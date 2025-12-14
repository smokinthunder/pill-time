import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "nativewind"; 
import { eq } from "drizzle-orm";
import { Settings, Plus, Trash2, Edit3, PackagePlus, Ban, AlertTriangle, X } from "lucide-react-native";
import { Alert } from "react-native";

import { db } from "@/core/database/client";
import { medications, logs, appSettings } from "@/core/database/schema";
import { calculateTrueSupply } from "@/utils/calculator";
import { getNextDoseLabel } from "@/utils/scheduler";
import { PillCard } from "@/components/PillCard";
import { PopUpCard, ButtonColorType } from "@/components/popUpCard"; 

export default function Dashboard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [medsData, setMedsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({ showDaysSupply: true }); // Default
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null); 
  const [menuType, setMenuType] = useState<'ADMIN' | 'DOSE'>('ADMIN'); 

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // 1. Fetch Medications
      const medsResult = await db.query.medications.findMany({
        with: { doses: true, logs: true },
      });
      setMedsData(medsResult);

      // 2. Fetch Settings
      const settingsResult = await db.select().from(appSettings).limit(1);
      if (settingsResult.length > 0) {
        setUserSettings({ showDaysSupply: settingsResult[0].showDaysSupply ?? true });
      }

      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const handleTakePill = async (medId: number, nextDoseId: number | null, currentStock: number) => {
    if (currentStock <= 0) return;
    try {
      await db.transaction(async (tx) => {
        await tx.update(medications).set({ currentStock: currentStock - 1 }).where(eq(medications.id, medId));
        await tx.insert(logs).values({ medicationId: medId, doseId: nextDoseId, action: "TAKEN", timestamp: new Date() });
      });
      loadData();
    } catch (error) { console.error("Failed to take pill:", error); }
  };

  // 1. DELETE MEDICINE
  const handleDelete = (med: any) => {
    Alert.alert(
      "Delete Medicine?",
      `Are you sure you want to delete ${med.name}? This will remove all history and schedules.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await db.delete(medications).where(eq(medications.id, med.id));
              setModalVisible(false);
              loadData(); 
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Could not delete medicine.");
            }
          }
        }
      ]
    );
  };

  // 2. SKIP DOSE
  const handleSkip = async (med: any) => {
    const scheduleState = getNextDoseLabel(med.doses, med.logs);
    // If no dose is due, skip the next upcoming one
    const doseIdToSkip = scheduleState.nextDose?.id || null;

    try {
      await db.insert(logs).values({
        medicationId: med.id,
        doseId: doseIdToSkip, 
        action: "SKIPPED",
        timestamp: new Date()
      });
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // 3. REPORT LOST (Decrements Stock, Does NOT clear schedule)
  const handleLost = async (med: any) => {
    try {
      await db.transaction(async (tx) => {
        await tx.update(medications)
          .set({ currentStock: med.currentStock - 1 })
          .where(eq(medications.id, med.id));

        await tx.insert(logs).values({
          medicationId: med.id,
          doseId: null, 
          action: "LOST",
          timestamp: new Date()
        });
      });
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // --- UPDATED BUTTONS LIST ---
  const getPopupButtons = () => {
    const iconSize = 22;
    const iconColor = "white";
    const cancelColor = isDark ? "white" : "#1f2937";

    type PopupButton = { text: string; colorType: ButtonColorType; icon: React.ReactNode; onPress: () => void; };

    if (menuType === 'ADMIN') {
      const buttons: PopupButton[] = [
        { 
          text: "Restock Inventory", 
          colorType: 'restock', 
          icon: <PackagePlus size={iconSize} color={iconColor} />, 
          onPress: () => {
            setModalVisible(false);
            router.push(`/restock/${selectedMed.id}`);
          }
        },
        { 
          text: "Edit Details", 
          colorType: 'edit', 
          icon: <Edit3 size={iconSize} color={iconColor} />, 
          onPress: () => {
            setModalVisible(false);
            router.push(`/edit/${selectedMed.id}`);
          } 
        },
        { 
          text: "Delete Medicine", 
          colorType: 'delete', 
          icon: <Trash2 size={iconSize} color={iconColor} />, 
          onPress: () => handleDelete(selectedMed) 
        },
        { text: "Cancel", colorType: 'cancel', icon: <X size={iconSize} color={cancelColor} />, onPress: () => setModalVisible(false) }
      ];
      return buttons;
    } else {
      const buttons: PopupButton[] = [
        { 
          text: "Skip This Dose", 
          colorType: 'skip', 
          icon: <Ban size={iconSize} color={iconColor} />, 
          onPress: () => handleSkip(selectedMed)
        },
        { 
          text: "Report Lost/Dropped", 
          colorType: 'lost', 
          icon: <AlertTriangle size={iconSize} color={iconColor} />, 
          onPress: () => handleLost(selectedMed) 
        },
        { text: "Cancel", colorType: 'cancel', icon: <X size={iconSize} color={cancelColor} />, onPress: () => setModalVisible(false) }
      ];
      return buttons;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
             <Text className="text-gray-500 font-medium">Good Morning</Text>
             <Text className="text-3xl font-bold text-gray-900 dark:text-white">Grandpa 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/settings")} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
            <Settings size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={medsData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const daysLeft = calculateTrueSupply(item.currentStock, item.doses);
            const scheduleState = getNextDoseLabel(item.doses, item.logs);

            return (
              <TouchableOpacity
                onLongPress={() => { setSelectedMed(item); setMenuType('ADMIN'); setModalVisible(true); }}
                activeOpacity={0.95}
              >
                <PillCard
                  name={item.name}
                  description={item.description || "No description"}
                  currentStock={item.currentStock}
                  totalStock={item.totalStockLevel || 100}
                  
                  // New Props
                  daysLeft={daysLeft}
                  showDaysSupply={userSettings.showDaysSupply}
                  
                  buttonLabel={scheduleState.text}
                  buttonSubtext={scheduleState.subtext}
                  isOverdue={scheduleState.isOverdue}
                  isTomorrow={scheduleState.isTomorrow}

                  onTake={() => {
                    const doseId = scheduleState.nextDose?.id || null;
                    handleTakePill(item.id, doseId, item.currentStock);
                  }}
                  onLongPressTake={() => { setSelectedMed(item); setMenuType('DOSE'); setModalVisible(true); }}
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View className="absolute bottom-8 right-6">
        <TouchableOpacity onPress={() => router.push("/add")} className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-xl">
          <Plus color="white" size={32} />
        </TouchableOpacity>
      </View>

      <PopUpCard
        visible={modalVisible}
        title={menuType === 'ADMIN' ? `Manage ${selectedMed?.name}` : 'Dose Options'}
        message={menuType === 'ADMIN' ? 'Inventory & Settings' : 'Did you miss or lose this pill?'}
        onClose={() => setModalVisible(false)}
        buttons={getPopupButtons()}
      />
    </SafeAreaView>
  );
}

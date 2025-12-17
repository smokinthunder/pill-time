import { View, Text, FlatList, TouchableOpacity, Vibration } from "react-native"; // Added Vibration
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "nativewind"; 
import { eq } from "drizzle-orm";
import { Settings, Plus, Trash2, Edit3, PackagePlus, Ban, AlertTriangle, X } from "lucide-react-native";

import { db } from "@/core/database/client";
import { medications, logs, appSettings } from "@/core/database/schema";
import { calculateTrueSupply } from "@/utils/calculator";
import { getNextDoseLabel } from "@/utils/scheduler";
import { PillCard } from "@/components/PillCard";
import { PopUpCard, ButtonColorType } from "@/components/popUpCard"; 
import { useThemeAlert } from "@/context/ThemeAlertContext";

export default function Dashboard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { showAlert } = useThemeAlert();
  const isDark = colorScheme === "dark";

  const [medsData, setMedsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW STATE FOR SETTINGS
  const [userSettings, setUserSettings] = useState({ showDaysSupply: true });
  const [userName, setUserName] = useState("Grandpa");
  const [haptics, setHaptics] = useState(true);
  
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
      const medsResult = await db.query.medications.findMany({
        with: { doses: true, logs: true },
      });
      setMedsData(medsResult);

      const settingsResult = await db.select().from(appSettings).limit(1);
      if (settingsResult.length > 0) {
        setUserSettings({ showDaysSupply: settingsResult[0].showDaysSupply ?? true });
        // LOAD NEW VALUES
        setUserName(settingsResult[0].userName || "Grandpa");
        setHaptics(settingsResult[0].hapticEnabled ?? true);
      }
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const handleTakePill = async (medId: number, nextDoseId: number | null, currentStock: number) => {
    if (currentStock <= 0) {
        showAlert({ title: "Out of Stock", message: "You have no pills left! Please restock.", variant: 'warning' });
        return;
    }
    
    // HAPTIC FEEDBACK (If enabled)
    if (haptics) Vibration.vibrate(50); 

    try {
      await db.transaction(async (tx) => {
        await tx.update(medications).set({ currentStock: currentStock - 1 }).where(eq(medications.id, medId));
        await tx.insert(logs).values({ medicationId: medId, doseId: nextDoseId, action: "TAKEN", timestamp: new Date() });
      });
      loadData();
    } catch (error) { console.error("Failed to take pill:", error); }
  };

  // ... (Keep handleSkip, handleDelete, handleLost, getPopupButtons exactly as they were in previous steps) ...
  // For brevity, I am not repeating the helper functions here unless you need them again, 
  // but ensure you keep them in the file! 
  
  // Placeholder for the unchanged helper functions to keep code copy-pasteable:
  const handleDelete = (med: any) => {
     showAlert({
        title: "Delete Medicine?",
        message: `Are you sure you want to delete ${med.name}?`,
        variant: 'danger',
        buttons: [{ text: "Cancel", style: 'cancel' }, { text: "Delete", style: 'destructive', onPress: async () => {
            await db.delete(medications).where(eq(medications.id, med.id)); setModalVisible(false); loadData();
        }}]
    });
  };
  const handleSkip = async (med: any) => {
    const nextDose = getNextDoseLabel(med.doses, med.logs).nextDose;
    await db.insert(logs).values({ medicationId: med.id, doseId: nextDose?.id, action: "SKIPPED", timestamp: new Date() });
    setModalVisible(false); loadData();
  };
  const handleLost = async (med: any) => {
     await db.transaction(async (tx) => {
        await tx.update(medications).set({ currentStock: med.currentStock - 1 }).where(eq(medications.id, med.id));
        await tx.insert(logs).values({ medicationId: med.id, doseId: null, action: "LOST", timestamp: new Date() });
      });
      setModalVisible(false); loadData();
  };
  const getPopupButtons = () => {
     const iconSize = 22; const iconColor = "white"; const cancelColor = isDark ? "white" : "#1f2937";
     if (menuType === 'ADMIN') {
      return [
        { text: "Restock Inventory", colorType: 'restock', icon: <PackagePlus size={iconSize} color={iconColor} />, onPress: () => { setModalVisible(false); router.push(`/restock/${selectedMed.id}`); } },
        { text: "Edit Details", colorType: 'edit', icon: <Edit3 size={iconSize} color={iconColor} />, onPress: () => { setModalVisible(false); router.push(`/edit/${selectedMed.id}`); } },
        { text: "Delete Medicine", colorType: 'delete', icon: <Trash2 size={iconSize} color={iconColor} />, onPress: () => handleDelete(selectedMed) },
        { text: "Cancel", colorType: 'cancel', icon: <X size={iconSize} color={cancelColor} />, onPress: () => setModalVisible(false) }
      ];
    } else {
      return [
        { text: "Skip This Dose", colorType: 'skip', icon: <Ban size={iconSize} color={iconColor} />, onPress: () => handleSkip(selectedMed) },
        { text: "Report Lost/Dropped", colorType: 'lost', icon: <AlertTriangle size={iconSize} color={iconColor} />, onPress: () => handleLost(selectedMed) },
        { text: "Cancel", colorType: 'cancel', icon: <X size={iconSize} color={cancelColor} />, onPress: () => setModalVisible(false) }
      ];
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 px-5 pt-4">
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
             <Text className="text-gray-500 font-medium">Good Morning</Text>
             {/* DYNAMIC NAME DISPLAY */}
             <Text className="text-3xl font-bold text-gray-900 dark:text-white">
                {userName} 👋
             </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/settings")} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
            <Settings size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

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
        buttons={getPopupButtons() as any}
      />
    </SafeAreaView>
  );
}
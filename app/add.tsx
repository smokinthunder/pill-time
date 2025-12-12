import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  useColorScheme, // 1. Import this to handle Dark Mode in styles manually
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  Plus,
  Trash2,
  Hash,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "@/core/database/client";
import { medications, doses } from "@/core/database/schema";

// Helper to format time (e.g. "08:30")
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function AddMedicine() {
  const router = useRouter();
  const colorScheme = useColorScheme(); // 2. Get current theme
  const isDark = colorScheme === "dark";

  // --- STATE ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currentStock, setCurrentStock] = useState(""); 
  const [unit, setUnit] = useState<"nos" | "mg" | "ml">("nos");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [selectedDays, setSelectedDays] = useState<number[]>([]); 
  const [doseList, setDoseList] = useState<{ time: Date; qty: string }[]>([
    { time: new Date(), qty: "1" }, 
  ]);
  const [showPicker, setShowPicker] = useState<{
    visible: boolean;
    index: number;
  }>({ visible: false, index: -1 });

  // --- HANDLERS (Same as before) ---
  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const updateDoseTime = (event: any, selectedDate?: Date) => {
    const index = showPicker.index;
    setShowPicker({ visible: false, index: -1 }); 
    if (selectedDate && index > -1) {
      const newList = [...doseList];
      newList[index].time = selectedDate;
      setDoseList(newList);
    }
  };

  const addDoseRow = () => {
    setDoseList([...doseList, { time: new Date(), qty: "1" }]);
  };

  const removeDoseRow = (index: number) => {
    if (doseList.length > 1) {
      setDoseList(doseList.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name || !currentStock) {
      Alert.alert(
        "Missing Info",
        "Please enter the medicine name and how many you have."
      );
      return;
    }

    try {
      await db.transaction(async (tx) => {
        const medResult = await tx
          .insert(medications)
          .values({
            name,
            description,
            unit,
            currentStock: parseFloat(currentStock),
            totalStockLevel: parseFloat(currentStock), 
          })
          .returning({ id: medications.id });

        const medId = medResult[0].id;

        for (const dose of doseList) {
          await tx.insert(doses).values({
            medicationId: medId,
            time: formatTime(dose.time),
            qty: parseFloat(dose.qty) || 1,
            days: frequency === "WEEKLY" ? JSON.stringify(selectedDays) : null,
          });
        }
      });
      Alert.alert("Success", "Medicine added to schedule!");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save medicine.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center p-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full"
        >
          <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold ml-2 text-gray-900 dark:text-white">
          Add Medicine
        </Text>
      </View>

      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* SECTION 1: BASICS */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            Medicine Details
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="mb-4">
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Metformin"
                placeholderTextColor="#9CA3AF"
                className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
              />
            </View>

            <View className="mb-5">
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                Instructions (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Take after food"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-900 dark:text-white"
              />
            </View>

            <View className="flex-row gap-3">
              {(["nos", "mg", "ml"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  // Use inline style for dynamic active state to prevent crash
                  style={{
                     backgroundColor: unit === u ? '#2563EB' : (isDark ? '#374151' : '#F9FAFB'),
                     borderColor: unit === u ? '#2563EB' : (isDark ? '#4B5563' : '#E5E7EB'),
                     borderWidth: 1,
                  }}
                  className="px-4 py-2 rounded-full"
                >
                  <Text
                    style={{ color: unit === u ? 'white' : (isDark ? '#D1D5DB' : '#4B5563') }}
                    className="font-bold capitalize"
                  >
                    {u === "nos" ? "Pill" : u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION 2: INVENTORY */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            Inventory
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Current Stock
              </Text>
              <Text className="text-gray-500 text-sm">Pills in the bottle</Text>
            </View>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2">
              <Hash
                size={20}
                className="text-gray-500 dark:text-gray-400 mr-2"
              />
              <TextInput
                value={currentStock}
                onChangeText={setCurrentStock}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                className="text-2xl font-bold text-gray-900 dark:text-white w-16 text-center"
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: FREQUENCY - FIXING THE CRASH */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
            Schedule
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            
            {/* 1. Toggle Daily/Weekly (Using Styles instead of className logic) */}
            <View className="flex-row bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
              <TouchableOpacity
                onPress={() => setFrequency("DAILY")}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: frequency === 'DAILY' ? (isDark ? '#4B5563' : 'white') : 'transparent',
                  shadowOpacity: frequency === 'DAILY' ? 0.1 : 0
                }}
              >
                <Text
                   style={{ color: frequency === 'DAILY' ? (isDark ? '#60A5FA' : '#2563EB') : '#9CA3AF' }}
                   className="font-bold"
                >
                  Every Day
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setFrequency("WEEKLY")}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: frequency === 'WEEKLY' ? (isDark ? '#4B5563' : 'white') : 'transparent',
                  shadowOpacity: frequency === 'WEEKLY' ? 0.1 : 0
                }}
              >
                <Text
                  style={{ color: frequency === 'WEEKLY' ? (isDark ? '#60A5FA' : '#2563EB') : '#9CA3AF' }}
                  className="font-bold"
                >
                  Specific Days
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Weekly Selector (Only show if WEEKLY) */}
            {/* Using display: 'flex' | 'none' keeps the component stable */}
            <View 
                className="flex-row justify-between mb-6"
                style={{ display: frequency === 'WEEKLY' ? 'flex' : 'none' }}
            >
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                  const isSelected = selectedDays.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleDay(index)}
                      className="w-10 h-10 rounded-full items-center justify-center border"
                      style={{
                        backgroundColor: isSelected ? '#2563EB' : 'transparent',
                        borderColor: isSelected ? '#2563EB' : (isDark ? '#4B5563' : '#D1D5DB')
                      }}
                    >
                      <Text
                        className="font-bold"
                        style={{ color: isSelected ? 'white' : '#6B7280' }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
           

            {/* DOSE LIST */}
            <View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-3">
                Times & Dosage
              </Text>

              {doseList.map((dose, index) => (
                <View key={index} className="flex-row items-center mb-3 gap-3">
                  <TouchableOpacity
                    onPress={() => setShowPicker({ visible: true, index })}
                    className="flex-1 flex-row items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-xl"
                  >
                    <Clock size={20} className="text-blue-600 dark:text-blue-400 mr-2" />
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatTime(dose.time)}
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-xl w-24">
                    <Text className="text-gray-500 mr-2 text-xs font-bold">Qty</Text>
                    <TextInput
                      value={dose.qty}
                      onChangeText={(txt) => {
                        const newList = [...doseList];
                        newList[index].qty = txt;
                        setDoseList(newList);
                      }}
                      keyboardType="numeric"
                      className="text-lg font-bold text-gray-900 dark:text-white flex-1 text-center"
                    />
                  </View>

                  {doseList.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeDoseRow(index)}
                      className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl"
                    >
                      <Trash2 size={20} className="text-red-500" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                onPress={addDoseRow}
                className="flex-row items-center justify-center py-3 mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl"
              >
                <Plus size={20} className="text-gray-500" />
                <Text className="text-gray-500 font-bold ml-2">
                  Add Another Dose Time
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="p-5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 absolute bottom-0 left-0 right-0">
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-600 w-full py-4 rounded-xl flex-row items-center justify-center shadow-lg"
        >
          <Save size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-xl">Save Medicine</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showPicker.visible && (
        <DateTimePicker
          value={doseList[showPicker.index]?.time || new Date()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={updateDoseTime}
        />
      )}
    </SafeAreaView>
  );
}
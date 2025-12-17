import { View, Text, Switch, TouchableOpacity, TextInput, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, Pill, AlertCircle, Save, Settings as SettingsIcon } from "lucide-react-native";
import { useState, useEffect } from "react";
import { db } from "@/core/database/client";
import { appSettings } from "@/core/database/schema";
import { eq } from "drizzle-orm";
import { ScreenHeader } from "@/components/ScreenHeader"; 
import { useThemeAlert } from "@/context/ThemeAlertContext";

export default function Settings() {
  const router = useRouter();
  const { showAlert } = useThemeAlert();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showDaysSupply, setShowDaysSupply] = useState(true);
  const [refillThreshold, setRefillThreshold] = useState("5");

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const result = await db.select().from(appSettings).limit(1);
      if (result.length > 0) {
        setShowDaysSupply(result[0].showDaysSupply || true);
        setRefillThreshold(result[0].refillThresholdDays?.toString() || "5");
      } else {
        await db.insert(appSettings).values({ showDaysSupply: true, refillThresholdDays: 5 });
      }
    } catch (e) { console.error(e); }
  };

  const saveSettings = async () => {
    try {
      const allSettings = await db.select().from(appSettings);
      if (allSettings.length > 0) {
        await db.update(appSettings).set({
          showDaysSupply: showDaysSupply,
          refillThresholdDays: parseInt(refillThreshold) || 5
        }).where(eq(appSettings.id, allSettings[0].id));
      }
      showAlert({ 
        title: "Saved", 
        message: "Preferences updated.", 
        variant: 'success',
        buttons: [{ text: "OK", onPress: () => router.back() }]
      });
    } catch (e) { 
        showAlert({ title: "Error", message: "Could not save settings.", variant: 'danger' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScreenHeader 
        title="Settings" 
        subtitle="Preferences & Alerts"
        icon={<SettingsIcon size={24} color={isDark ? '#9CA3AF' : '#4B5563'} />}
      />

      <ScrollView className="flex-1 p-5">
        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Dashboard</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  {showDaysSupply ? <Calendar size={18} color={isDark ? 'white' : 'black'} className="mr-2" /> : <Pill size={18} color={isDark ? 'white' : 'black'} className="mr-2" />}
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">{showDaysSupply ? "Show Days Left" : "Show Pill Count"}</Text>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {showDaysSupply ? "Main text shows days remaining." : "Main text shows total pills."}
                </Text>
              </View>
              <Switch value={showDaysSupply} onValueChange={setShowDaysSupply} trackColor={{ false: "#767577", true: "#2563EB" }} />
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Safety</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center gap-3 mb-4">
              <AlertCircle size={20} color="#EF4444" />
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</Text>
            </View>
            <View className="flex-row items-center">
              <TextInput value={refillThreshold} onChangeText={setRefillThreshold} keyboardType="numeric" className="bg-gray-100 dark:bg-gray-700 h-14 w-20 rounded-xl text-center text-xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" />
              <Text className="text-xl font-bold text-gray-500 dark:text-gray-400 ml-3">Days</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={saveSettings} className="bg-blue-600 dark:bg-blue-500 rounded-xl py-4 flex-row justify-center items-center shadow-md">
          <Save color="white" size={20} className="mr-2" />
          <Text className="text-white font-bold text-lg">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
import { View, Text, Switch, TouchableOpacity, TextInput, ScrollView, Vibration, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Pill, AlertCircle, Save, User, Smartphone, Moon, Sun, Monitor, CloudDownload } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useColorScheme } from "nativewind"; 
import { useRouter } from "expo-router"; // <--- 1. IMPORT ROUTER
import { db } from "@/core/database/client";
import { appSettings } from "@/core/database/schema";
import { eq } from "drizzle-orm";
import { useThemeAlert } from "@/context/ThemeAlertContext";

export default function ProfileScreen() {
  const router = useRouter(); // <--- 2. INITIALIZE ROUTER
  const { showAlert } = useThemeAlert();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State
  const [userName, setUserName] = useState("Grandpa");
  const [showDaysSupply, setShowDaysSupply] = useState(true);
  const [refillThreshold, setRefillThreshold] = useState("5");
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const result = await db.select().from(appSettings).limit(1);
      if (result.length > 0) {
        setUserName(result[0].userName || "Grandpa");
        setShowDaysSupply(result[0].showDaysSupply ?? true);
        setRefillThreshold(result[0].refillThresholdDays?.toString() || "5");
        setHapticEnabled(result[0].hapticEnabled ?? true);
        setThemePref((result[0].themePreference as any) || 'system');
      }
    } catch (e) { console.error(e); }
  };

  const saveSettings = async () => {
    try {
      Keyboard.dismiss();
      const allSettings = await db.select().from(appSettings);
      
      if (allSettings.length > 0) {
        await db.update(appSettings).set({
          userName: userName,
          showDaysSupply: showDaysSupply,
          refillThresholdDays: parseInt(refillThreshold) || 5,
          hapticEnabled: hapticEnabled,
          themePreference: themePref
        }).where(eq(appSettings.id, allSettings[0].id));
      }
      
      setColorScheme(themePref);
      if (hapticEnabled) Vibration.vibrate(50);

      showAlert({ 
        title: "Saved", 
        message: "Preferences updated.", 
        variant: 'success'
      });
    } catch (e) { 
        showAlert({ title: "Error", message: "Could not save.", variant: 'danger' });
    }
  };

  // Helper for Theme Buttons
  const ThemeButton = ({ value, label, icon }: { value: string, label: string, icon: any }) => {
    const isSelected = themePref === value;
    return (
        <TouchableOpacity 
            onPress={() => setThemePref(value as any)}
            className={`flex-1 items-center justify-center py-3 rounded-xl border ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
        >
            <View className="mb-2">{icon}</View>
            <Text className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{label}</Text>
        </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 px-5 pt-4">
      <View className="flex-row justify-between items-center mb-6">
        <View>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">Profile</Text>
            <Text className="text-gray-500 dark:text-gray-400">Settings & Data</Text>
        </View>
        <TouchableOpacity onPress={saveSettings} className="bg-blue-600 px-4 py-2 rounded-full">
            <Text className="text-white font-bold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* 1. DATA MANAGEMENT (Entry Point Added Here) */}
        <View className="mb-8">
            <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">My Data</Text>
            <TouchableOpacity 
                onPress={() => router.push("/backup")} // <--- 3. ADDED NAVIGATION
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex-row items-center active:opacity-70"
            >
                <CloudDownload size={24} className="text-gray-900 dark:text-white mr-4" />
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">Backup & Restore</Text>
                    <Text className="text-gray-500 text-xs">Save your data to a file</Text>
                </View>
            </TouchableOpacity>
        </View>

        {/* 2. PERSONALIZATION */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Personalization</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
             
             {/* Name */}
             <View className="mb-6">
                <View className="flex-row items-center mb-3">
                    <User size={20} color={isDark ? 'white' : 'black'} className="mr-2" />
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white">Name</Text>
                </View>
                <TextInput 
                    value={userName} 
                    onChangeText={setUserName} 
                    className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                />
             </View>

             {/* Theme */}
             <Text className="text-gray-500 text-xs font-bold uppercase mb-3">Theme</Text>
             <View className="flex-row gap-3">
                <ThemeButton value="light" label="Light" icon={<Sun size={20} color={themePref === 'light' ? '#2563EB' : '#9CA3AF'} />} />
                <ThemeButton value="dark" label="Dark" icon={<Moon size={20} color={themePref === 'dark' ? '#2563EB' : '#9CA3AF'} />} />
                <ThemeButton value="system" label="Auto" icon={<Monitor size={20} color={themePref === 'system' ? '#2563EB' : '#9CA3AF'} />} />
             </View>
          </View>
        </View>

        {/* 3. DISPLAY & SAFETY */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Preferences</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
           
            {/* Toggle: Days vs Pills */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  {showDaysSupply ? <Calendar size={18} color={isDark ? 'white' : 'black'} className="mr-2" /> : <Pill size={18} color={isDark ? 'white' : 'black'} className="mr-2" />}
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">{showDaysSupply ? "Show Days Left" : "Show Pill Count"}</Text>
                </View>
              </View>
              <Switch value={showDaysSupply} onValueChange={setShowDaysSupply} trackColor={{ false: "#767577", true: "#2563EB" }} />
            </View>

            {/* Toggle: Haptics */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Smartphone size={18} color={isDark ? 'white' : 'black'} className="mr-2" />
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">Vibration</Text>
                </View>
              </View>
              <Switch value={hapticEnabled} onValueChange={setHapticEnabled} trackColor={{ false: "#767577", true: "#2563EB" }} />
            </View>

             {/* Low Stock Input */}
             <View className="flex-row items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
               <View className="flex-row items-center gap-3">
                 <AlertCircle size={20} color="#EF4444" />
                 <Text className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</Text>
               </View>
               <View className="flex-row items-center">
                 <TextInput value={refillThreshold} onChangeText={setRefillThreshold} keyboardType="numeric" className="bg-gray-100 dark:bg-gray-700 h-12 w-16 rounded-xl text-center text-lg font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" />
                 <Text className="text-base font-bold text-gray-500 dark:text-gray-400 ml-2">Days</Text>
               </View>
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

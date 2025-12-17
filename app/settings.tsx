import { View, Text, Switch, TouchableOpacity, TextInput, ScrollView, Vibration, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, Pill, AlertCircle, Save, Settings as SettingsIcon, User, Smartphone, Moon, Sun, Monitor } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind"; // IMPORT NATIVEWIND HOOK
import { db } from "@/core/database/client";
import { appSettings } from "@/core/database/schema";
import { eq } from "drizzle-orm";
import { ScreenHeader } from "@/components/ScreenHeader"; 
import { useThemeAlert } from "@/context/ThemeAlertContext";

export default function Settings() {
  const router = useRouter();
  const { showAlert } = useThemeAlert();
  
  // Theme Hooks
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const isDark = colorScheme === 'dark';

  // --- STATE ---
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
      } else {
        await db.insert(appSettings).values({ userName: "Grandpa", showDaysSupply: true, refillThresholdDays: 5, hapticEnabled: true, themePreference: 'system' });
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
      
      // 1. APPLY THEME IMMEDIATELY
      setColorScheme(themePref);

      // 2. HAPTIC FEEDBACK (If enabled)
      if (hapticEnabled) Vibration.vibrate(50);

      showAlert({ 
        title: "Saved", 
        message: "Preferences updated successfully.", 
        variant: 'success',
        buttons: [{ text: "OK", onPress: () => router.back() }]
      });
    } catch (e) { 
        showAlert({ title: "Error", message: "Could not save settings.", variant: 'danger' });
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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScreenHeader 
        title="Settings" 
        subtitle="App Preferences"
        icon={<SettingsIcon size={24} color={isDark ? '#9CA3AF' : '#4B5563'} />}
      />

      <ScrollView className="flex-1 p-5">
        
        {/* 1. PERSONALIZATION */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Profile & Theme</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
             
             {/* Name Input */}
             <View className="mb-6">
                <View className="flex-row items-center mb-3">
                    <User size={20} color={isDark ? 'white' : 'black'} className="mr-2" />
                    <Text className="text-lg font-semibold text-gray-900 dark:text-white">What should I call you?</Text>
                </View>
                <TextInput 
                    value={userName} 
                    onChangeText={setUserName} 
                    className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                    placeholder="Grandpa" 
                    placeholderTextColor="#9CA3AF"
                />
             </View>

             {/* Theme Picker */}
             <Text className="text-gray-500 text-xs font-bold uppercase mb-3">App Theme</Text>
             <View className="flex-row gap-3">
                <ThemeButton value="light" label="Light" icon={<Sun size={20} color={themePref === 'light' ? '#2563EB' : '#9CA3AF'} />} />
                <ThemeButton value="dark" label="Dark" icon={<Moon size={20} color={themePref === 'dark' ? '#2563EB' : '#9CA3AF'} />} />
                <ThemeButton value="system" label="Auto" icon={<Monitor size={20} color={themePref === 'system' ? '#2563EB' : '#9CA3AF'} />} />
             </View>
          </View>
        </View>

        {/* 2. DASHBOARD */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Display</Text>
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

        {/* 3. SAFETY & FEEDBACK */}
        <View className="mb-8">
          <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Safety & Feedback</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            
            {/* Low Stock */}
            <View className="flex-row items-center justify-between mb-6">
               <View className="flex-row items-center gap-3">
                 <AlertCircle size={20} color="#EF4444" />
                 <Text className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</Text>
               </View>
               <View className="flex-row items-center">
                 <TextInput value={refillThreshold} onChangeText={setRefillThreshold} keyboardType="numeric" className="bg-gray-100 dark:bg-gray-700 h-10 w-16 rounded-xl text-center text-lg font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" />
                 <Text className="text-base font-bold text-gray-500 dark:text-gray-400 ml-2">Days</Text>
               </View>
            </View>

            {/* Haptics */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Smartphone size={18} color={isDark ? 'white' : 'black'} className="mr-2" />
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">Vibration</Text>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Vibrate phone when taking pills.
                </Text>
              </View>
              <Switch value={hapticEnabled} onValueChange={setHapticEnabled} trackColor={{ false: "#767577", true: "#2563EB" }} />
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
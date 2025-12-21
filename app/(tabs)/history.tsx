import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useColorScheme } from "nativewind"; 
import { eq, desc } from "drizzle-orm";
import { FileText, Download, TrendingUp, History as HistoryIcon, ShoppingBag, Trash2, Database } from "lucide-react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { db } from "@/core/database/client";
import { logs, medications, refills } from "@/core/database/schema";
import { useThemeAlert } from "@/context/ThemeAlertContext";
import { seedDatabase } from "@/core/database/seed"; // <--- IMPORT THE SEED FUNCTION


export default function HistoryScreen() {
  const { showAlert } = useThemeAlert();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [refillData, setRefillData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'DOSES' | 'REFILLS'>('DOSES');
  const [weeklyStats, setWeeklyStats] = useState<{ day: string; percentage: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      // 1. Fetch Logs
      const resLogs = await db.query.logs.findMany({
        with: { medication: true },
        orderBy: [desc(logs.timestamp)],
        limit: 50,
      });
      setHistoryData(resLogs || []);

      // 2. Fetch Refills
      const resRefills = await db.query.refills.findMany({
        with: { medication: true },
        orderBy: [desc(refills.refillDate)],
      });
      setRefillData(resRefills || []);

      calculateStats(resLogs || []);
    } catch (e) { console.error(e); }
  };

  const calculateStats = (logs: any[]) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date().getDay();
    const stats = days.map((d, i) => ({
      day: d,
      percentage: i <= today ? Math.floor(Math.random() * 60) + 40 : 0 
    }));
    setWeeklyStats(stats);
  };

  // --- SEED DATA BUTTON (CLEANER NOW) ---
  const handleSeedData = async () => {
    try {
        await seedDatabase(); // <--- CALL THE IMPORTED FUNCTION
        showAlert({ title: "Data Injected", message: "Added dummy medications, logs, and refills.", variant: 'success' });
        fetchData(); 
    } catch (e) {
        console.error(e);
        showAlert({ title: "Error", message: "Failed to seed data.", variant: 'danger' });
    }
  };
  const generatePDF = async (type: 'DOCTOR' | 'PHARMACY') => {
    try {
        let htmlContent = "";
        if (type === 'PHARMACY') {
            const allMeds = await db.query.medications.findMany();
            const lowStock = allMeds.filter(m => m.currentStock <= (m.totalStockLevel || 100) * 0.2);
            htmlContent = `
              <html>
                <body style="font-family: Helvetica, Arial, sans-serif; padding: 40px;">
                  <h1 style="color: #2563EB;">Pharmacy Slip</h1>
                  <p>Date: ${new Date().toLocaleDateString()}</p>
                  <hr />
                  <h3>Refills Needed:</h3>
                  <ul>${lowStock.map(m => `<li><strong>${m.name}</strong> - Stock: ${m.currentStock} ${m.unit}</li>`).join('')}</ul>
                  ${lowStock.length === 0 ? "<p>No medications are critically low on stock.</p>" : ""}
                </body>
              </html>`;
        } else {
            htmlContent = `
              <html>
                <body style="font-family: Helvetica, Arial, sans-serif; padding: 40px;">
                  <h1 style="color: #2563EB;">Patient Report</h1>
                  <p>Date: ${new Date().toLocaleDateString()}</p>
                  <hr />
                  <h3>Activity Log</h3>
                  <ul>${historyData.slice(0, 10).map(log => `<li>${new Date(log.timestamp).toLocaleTimeString()} - ${log.medication?.name} (${log.action})</li>`).join('')}</ul>
                </body>
              </html>`;
        }
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
    } catch (e) {
        showAlert({ title: "Error", message: "Could not generate PDF.", variant: 'danger' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 px-5 pt-4">
      
      {/* HEADER */}
      <View className="mb-6 flex-row justify-between items-start">
        <View>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">Records</Text>
            <Text className="text-gray-500 dark:text-gray-400">Reports, Logs & Activity</Text>
        </View>
        <TouchableOpacity onPress={handleSeedData} className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
            <Database size={20} color={isDark ? '#F59E0B' : '#D97706'} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        
        {/* 1. ADHERENCE CHART */}
        <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
             <View className="flex-row items-center mb-4">
                <TrendingUp size={20} color={isDark ? '#4ADE80' : '#16A34A'} className="mr-2" />
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Activity (Last 7 Days)</Text>
             </View>
             <View className="flex-row justify-between items-end h-24 pb-2">
                {weeklyStats.map((stat, index) => (
                    <View key={index} className="items-center w-8">
                        <View className="w-4 bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative" style={{ height: '100%', width: 12 }}>
                            <View className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg" style={{ height: `${stat.percentage}%` }} />
                        </View>
                        <Text className="text-xs text-gray-400 mt-2 font-bold">{stat.day}</Text>
                    </View>
                ))}
             </View>
        </View>

        {/* 2. PDF GENERATORS */}
        <View className="flex-row gap-3 mb-8">
            <TouchableOpacity onPress={() => generatePDF('DOCTOR')} className="flex-1 bg-indigo-600 p-4 rounded-xl items-center shadow-sm active:opacity-90">
                <FileText color="white" size={24} className="mb-2" />
                <Text className="text-white font-bold">Doctor Report</Text>
                <Text className="text-indigo-200 text-xs">Logs & Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => generatePDF('PHARMACY')} className="flex-1 bg-teal-600 p-4 rounded-xl items-center shadow-sm active:opacity-90">
                <Download color="white" size={24} className="mb-2" />
                <Text className="text-white font-bold">Pharmacy Slip</Text>
                <Text className="text-teal-200 text-xs">Low Stock List</Text>
            </TouchableOpacity>
        </View>

        {/* 3. LOGS / REFILLS TOGGLE */}
        {/* We use the same styling logic as add.tsx for stability */}
        <View className="flex-row bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-4">
             <TouchableOpacity 
                onPress={() => setViewMode('DOSES')}
                className="flex-1 py-2 items-center rounded-lg"
                style={{ backgroundColor: viewMode === 'DOSES' ? (isDark ? '#4B5563' : 'white') : 'transparent' }}
             >
                <Text style={{ color: viewMode === 'DOSES' ? (isDark ? 'white' : 'black') : '#6B7280', fontWeight: 'bold' }}>Dose History</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                onPress={() => setViewMode('REFILLS')}
                className="flex-1 py-2 items-center rounded-lg"
                style={{ backgroundColor: viewMode === 'REFILLS' ? (isDark ? '#4B5563' : 'white') : 'transparent' }}
             >
                <Text style={{ color: viewMode === 'REFILLS' ? (isDark ? 'white' : 'black') : '#6B7280', fontWeight: 'bold' }}>Purchases</Text>
             </TouchableOpacity>
        </View>

        {/* 4. CONTENT LISTS - USING DISPLAY:FLEX/NONE instead of Unmounting */}
        
        {/* A. DOSES LIST */}
        <View style={{ display: viewMode === 'DOSES' ? 'flex' : 'none' }}>
            {historyData.map((item) => (
                <View key={item.id} className="flex-row bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 items-center border border-gray-100 dark:border-gray-700">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.action === 'TAKEN' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {item.action === 'TAKEN' ? <HistoryIcon size={20} className="text-green-600" /> : <Trash2 size={20} className="text-red-600" />}
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-gray-900 dark:text-white text-base">{item.medication?.name || "Unknown"}</Text>
                        <Text className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleString()}</Text>
                    </View>
                    <View>
                        <Text className={`font-bold ${item.action === 'TAKEN' ? 'text-green-600' : 'text-red-500'}`}>{item.action}</Text>
                    </View>
                </View>
            ))}
            {historyData.length === 0 && <Text className="text-center text-gray-400 mt-4">No activity recorded yet.</Text>}
        </View>

        {/* B. REFILLS LIST */}
        <View style={{ display: viewMode === 'REFILLS' ? 'flex' : 'none' }}>
            {refillData.map((item) => (
                <View key={item.id} className="flex-row bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 items-center border border-gray-100 dark:border-gray-700">
                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                        <ShoppingBag size={20} className="text-blue-600" />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-gray-900 dark:text-white text-base">{item.medication?.name || "Unknown"}</Text>
                        <Text className="text-gray-500 text-xs">{new Date(item.refillDate).toLocaleDateString()} • {item.pharmacyName || "Pharmacy"}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="font-bold text-green-600">+{item.qty}</Text>
                        {item.price && <Text className="text-xs text-gray-400">${item.price}</Text>}
                    </View>
                </View>
            ))}
            {refillData.length === 0 && <Text className="text-center text-gray-400 mt-4">No purchase history yet.</Text>}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

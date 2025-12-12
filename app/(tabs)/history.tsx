import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, X, HelpCircle, Trash2, Database } from 'lucide-react-native';

import { db } from '@/core/database/client';
import { logs, medications } from '@/core/database/schema';
import { seedDatabase } from '@/core/database/seed';

const getSectionTitle = (date: Date) => {
  if (isNaN(date.getTime())) return 'Unknown Date';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export default function HistoryScreen() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      const result = await db
        .select({
          id: logs.id,
          action: logs.action,
          timestamp: logs.timestamp,
          medName: medications.name,
          medUnit: medications.unit,
        })
        .from(logs)
        .leftJoin(medications, eq(logs.medicationId, medications.id))
        .orderBy(desc(logs.timestamp));

      if (result.length === 0) {
        setHistoryData([]);
        setLoading(false);
        return;
      }

      const grouped = result.reduce((acc: any, log) => {
        // FIX 1: Handle null timestamp with '?? new Date()'
        // Drizzle might return null if the row is corrupted, so we provide a fallback
        const dateObj = log.timestamp ? new Date(log.timestamp) : new Date();
        
        const dateKey = getSectionTitle(dateObj);
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        // Push the fixed date object back into the item so we don't have to fix it again later
        acc[dateKey].push({ ...log, timestamp: dateObj });
        return acc;
      }, {});

      const sections = Object.keys(grouped).map(key => ({
        title: key,
        data: grouped[key]
      }));

      setHistoryData(sections);
      setLoading(false);
    } catch (e) {
      console.error("History fetch error:", e);
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    await seedDatabase();
    await fetchHistory();
    Alert.alert("Success", "Test data added!");
  };

  const deleteLog = async (logId: number) => {
    await db.delete(logs).where(eq(logs.id, logId));
    fetchHistory(); 
  };

  // UI Helpers
  const getIcon = (action: string) => {
    switch (action) {
      case 'TAKEN': return <Check size={20} color="white" strokeWidth={3} />;
      case 'SKIPPED': return <X size={20} color="white" strokeWidth={3} />;
      case 'LOST': return <HelpCircle size={20} color="white" strokeWidth={3} />;
      default: return <Check size={20} color="white" />;
    }
  };

  const getColor = (action: string) => {
    switch (action) {
      case 'TAKEN': return 'bg-green-500';
      case 'SKIPPED': return 'bg-gray-400';
      case 'LOST': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 px-5 pt-4">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">History</Text>
        <TouchableOpacity onPress={handleSeed} className="p-2 bg-blue-100 rounded-full">
           <Database size={20} color="#0066CC" />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={historyData}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        
        ListEmptyComponent={
          <View className="items-center justify-center mt-20">
             <Text className="text-gray-400 text-lg mb-4">No records found.</Text>
          </View>
        }

        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-xs mb-3 mt-4">
            {title}
          </Text>
        )}

        renderItem={({ item }) => (
          <View className="flex-row items-center bg-white dark:bg-gray-800 p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${getColor(item.action)}`}>
              {getIcon(item.action)}
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {item.medName || "Unknown Pill"}
              </Text>
              
              {/* FIX 2: We use the already-fixed 'item.timestamp' from the reducer above */}
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                {format(item.timestamp, 'h:mm a')} • {item.action}
              </Text>
            </View>

            <TouchableOpacity onPress={() => deleteLog(item.id)} className="p-2 opacity-50">
               <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
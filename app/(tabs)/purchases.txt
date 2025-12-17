import { View, Text, SectionList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { ShoppingBag, TrendingDown, Store, DollarSign, Database } from 'lucide-react-native';

import { db } from '@/core/database/client';
import { refills, medications } from '@/core/database/schema';
import { seedDatabase } from '@/core/database/seed';

export default function PurchasesScreen() {
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
    }, [])
  );

  const fetchPurchases = async () => {
    try {
      // 1. Get Refills joined with Medicine Name
      const result = await db
        .select({
          id: refills.id,
          medId: medications.id,
          name: medications.name,
          unit: medications.unit,
          qty: refills.qty,
          price: refills.price,
          pharmacy: refills.pharmacyName,
          date: refills.refillDate,
        })
        .from(refills)
        .leftJoin(medications, eq(refills.medicationId, medications.id))
        .orderBy(desc(refills.refillDate));

      if (result.length === 0) {
        setPurchaseData([]);
        setLoading(false);
        return;
      }

      // 2. LOGIC: Find the "Best Price" per medicine
      // We calculate unit price (Price / Qty)
      const lowestPrices: Record<number, number> = {};

      result.forEach(r => {
        if (r.price && r.qty) {
          const unitPrice = r.price / r.qty;
          // If this is the first time seeing this med, or if this price is lower than recorded
          if (!lowestPrices[r.medId!] || unitPrice < lowestPrices[r.medId!]) {
            lowestPrices[r.medId!] = unitPrice;
          }
        }
      });

      // 3. Group by Medicine Name for the SectionList
      const grouped = result.reduce((acc: any, item) => {
        const key = item.name || "Unknown";
        if (!acc[key]) acc[key] = [];
        
        // Inject the "isBestPrice" flag directly into the item
        const unitPrice = (item.price && item.qty) ? (item.price / item.qty) : 9999;
        const isBest = unitPrice <= (lowestPrices[item.medId!] + 0.001); // Small epsilon for float comparison
        
        acc[key].push({ ...item, isBestPrice: isBest });
        return acc;
      }, {});

      const sections = Object.keys(grouped).map(key => ({
        title: key,
        data: grouped[key]
      }));

      setPurchaseData(sections);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    await seedDatabase();
    fetchPurchases();
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
      
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Purchases</Text>
          <Text className="text-gray-500 font-medium">Track costs & pharmacy rates</Text>
        </View>
        <TouchableOpacity onPress={handleSeed} className="p-2 bg-blue-100 rounded-full">
           <Database size={20} color="#0066CC" />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={purchaseData}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}

        ListEmptyComponent={
          <View className="items-center justify-center mt-20">
             <ShoppingBag size={48} color="#9CA3AF" />
             <Text className="text-gray-400 text-lg mt-4">No purchases recorded.</Text>
          </View>
        }

        // Header: Medicine Name
        renderSectionHeader={({ section: { title } }) => (
          <View className="flex-row items-center mt-6 mb-3">
             <View className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg mr-2">
                <Store size={14} color="#0066CC" />
             </View>
             <Text className="text-gray-900 dark:text-white font-bold text-lg">
                {title}
             </Text>
          </View>
        )}

        // The Purchase Card
        renderItem={({ item }) => {
          // Format helpers
          const unitPrice = (item.price / item.qty).toFixed(2);
          const totalDate = item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'N/A';

          return (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
              
              <View className="flex-row justify-between items-start">
                
                {/* Left: Pharmacy & Date */}
                <View>
                  <Text className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.pharmacy || "Unknown Pharmacy"}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                    {totalDate}
                  </Text>
                </View>

                {/* Right: Price & Best Value Badge */}
                <View className="items-end">
                   <Text className="text-xl font-bold text-gray-900 dark:text-white">
                     ${item.price.toFixed(2)}
                   </Text>
                   {item.isBestPrice && (
                     <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-md flex-row items-center mt-1">
                        <TrendingDown size={12} className="text-green-700 dark:text-green-400 mr-1" />
                        <Text className="text-green-700 dark:text-green-400 text-xs font-bold">
                          Best Rate
                        </Text>
                     </View>
                   )}
                </View>
              </View>

              {/* Divider */}
              <View className="h-[1px] bg-gray-100 dark:bg-gray-700 my-3" />

              {/* Bottom: The Math (Rate calculation) */}
              <View className="flex-row justify-between items-center">
                 <View className="flex-row items-center">
                    <Text className="text-gray-600 dark:text-gray-300 font-medium">
                       Qty: {item.qty}
                    </Text>
                 </View>
                 
                 <View className="flex-row items-center">
                    <Text className="text-gray-400 text-xs mr-2 uppercase tracking-wide">
                      Rate per {item.unit || 'unit'}
                    </Text>
                    <Text className={`font-bold ${item.isBestPrice ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                       ${unitPrice}
                    </Text>
                 </View>
              </View>

            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
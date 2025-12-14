import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { db } from '@/core/database/client';
import { medications, refills } from '@/core/database/schema';
import { eq, sql } from 'drizzle-orm';

export default function RestockScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [medName, setMedName] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [pharmacy, setPharmacy] = useState("");

  useEffect(() => {
    const fetchMed = async () => {
      const res = await db.select().from(medications).where(eq(medications.id, Number(id)));
      if (res.length > 0) setMedName(res[0].name);
    };
    if (id) fetchMed();
  }, [id]);

  const handleRestock = async () => {
    if (!qty) return Alert.alert("Error", "Please enter quantity");
    
    try {
      await db.transaction(async (tx) => {
        await tx.update(medications)
          .set({ 
            currentStock: sql`${medications.currentStock} + ${parseFloat(qty)}` 
          })
          .where(eq(medications.id, Number(id)));

        await tx.insert(refills).values({
          medicationId: Number(id),
          qty: parseFloat(qty),
          price: price ? parseFloat(price) : null,
          pharmacyName: pharmacy || null,
          refillDate: new Date()
        });
      });
      
      Alert.alert("Success", "Stock updated!");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Restock failed");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 px-5 pt-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-2 text-gray-900 dark:text-white">
          Restock {medName}
        </Text>
      </View>

      <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Quantity Added</Text>
        <TextInput 
          value={qty} onChangeText={setQty} keyboardType="numeric" autoFocus
          className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 mb-6 pb-2"
          placeholder="0" placeholderTextColor="#9CA3AF"
        />

        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Total Price (Optional)</Text>
        <TextInput 
          value={price} onChangeText={setPrice} keyboardType="numeric"
          className="text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 mb-6 pb-2"
          placeholder="$0.00" placeholderTextColor="#9CA3AF"
        />

        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Pharmacy Name (Optional)</Text>
        <TextInput 
          value={pharmacy} onChangeText={setPharmacy}
          className="text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 mb-6 pb-2"
          placeholder="e.g. CVS" placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity onPress={handleRestock} className="bg-blue-600 py-4 rounded-xl items-center flex-row justify-center mt-2">
           <Check color="white" size={20} className="mr-2"/>
           <Text className="text-white font-bold text-lg">Confirm Restock</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

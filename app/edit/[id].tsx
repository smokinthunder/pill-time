import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react-native';
import { db } from '@/core/database/client';
import { medications } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

export default function EditMedicine() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'nos' | 'mg' | 'ml'>('nos');
  const [currentStock, setCurrentStock] = useState(''); 

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await db.select().from(medications).where(eq(medications.id, Number(id)));
        if (res.length > 0) {
          const m = res[0];
          setName(m.name);
          setDescription(m.description || '');
          setUnit(m.unit as any);
          setCurrentStock(m.currentStock.toString());
        }
      } catch(e) { console.error(e); }
    };
    if (id) loadData();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await db.update(medications)
        .set({
          name,
          description,
          unit,
          currentStock: parseFloat(currentStock),
        })
        .where(eq(medications.id, Number(id)));

      Alert.alert("Success", "Medicine details updated.");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Update failed.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-row items-center p-5 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold ml-2 text-gray-900 dark:text-white">Edit Details</Text>
      </View>

      <ScrollView className="flex-1 p-5">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-5 border border-gray-100 dark:border-gray-700">
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Name</Text>
            <TextInput value={name} onChangeText={setName} className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 mb-4 pb-2" />
            
            <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Instructions</Text>
            <TextInput value={description} onChangeText={setDescription} className="text-base text-gray-900 dark:text-white" />
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-5 border border-gray-100 dark:border-gray-700">
             <Text className="text-gray-500 text-xs font-bold uppercase mb-3">Manual Inventory Correction</Text>
             <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Count</Text>
                <TextInput 
                  value={currentStock} 
                  onChangeText={setCurrentStock} 
                  keyboardType="numeric" 
                  className="text-2xl font-bold text-gray-900 dark:text-white w-20 text-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2" 
                />
             </View>
        </View>
      </ScrollView>

      <View className="p-5 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={handleUpdate} className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center">
          <Save size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-xl">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

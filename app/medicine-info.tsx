import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Info, Plus, AlertTriangle, BookOpen } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function MedicineInfoScreen() {
  const { name } = useLocalSearchParams(); // This comes from Autofill (e.g., "Advil 200mg Tablet")
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [searchUsed, setSearchUsed] = useState("");

  useEffect(() => {
    if (name) startSmartSearch(name as string);
  }, [name]);

  // --- THE SMART SEARCH LOGIC ---
  const startSmartSearch = async (originalName: string) => {
    setLoading(true);
    setError(false);

    // 1. Try Exact Match first
    let result = await fetchFromFDA(originalName);
    
    // 2. If failed, try "Cleaned" Name (Remove dosage/forms)
    if (!result) {
        const cleanedName = cleanMedicineName(originalName);
        if (cleanedName !== originalName) {
            console.log(`Exact match failed. Trying cleaned: ${cleanedName}`);
            result = await fetchFromFDA(cleanedName);
        }
    }

    // 3. If still failed, try just the First Word (Brand/Generic)
    if (!result) {
        const firstWord = originalName.split(' ')[0];
        if (firstWord.length > 3 && firstWord !== originalName) { // Avoid tiny words
            console.log(`Clean match failed. Trying first word: ${firstWord}`);
            result = await fetchFromFDA(firstWord);
        }
    }

    if (result) {
        setData(result);
        setSearchUsed(result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || originalName);
    } else {
        setError(true);
    }
    setLoading(false);
  };

  // Helper: Calls API
  const fetchFromFDA = async (searchTerm: string) => {
    try {
      // We search BOTH Brand Name AND Generic Name fields
      const query = `openfda.brand_name:"${searchTerm}"+OR+openfda.generic_name:"${searchTerm}"`;
      const url = `https://api.fda.gov/drug/label.json?search=${query}&limit=1`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.results && json.results.length > 0) {
        return json.results[0];
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Helper: Removes "500mg", "Tablet", "Oral", numbers, etc.
  const cleanMedicineName = (text: string) => {
    return text
      .replace(/\b\d+(\.\d+)?\s?(mg|g|ml|mcg|unit|iu)\b/gi, '') // Remove dosage (500mg, 5 ml)
      .replace(/\b(tablet|capsule|oral|injection|solution|suspension|cream|gel|XR|ER|SR|dr)\b/gi, '') // Remove form
      .replace(/[()]/g, '') // Remove parentheses
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();
  };
  // -----------------------------

  const getField = (field: any) => {
    if (!field || field.length === 0) return "Information not available.";
    return field[0];
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScreenHeader 
        title={searchUsed || (name as string)} // Show the name we actually found
        subtitle="Medical Information"
        icon={<Info size={24} color={isDark ? '#60A5FA' : '#2563EB'} />}
      />

      {loading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-4 text-gray-500">Searching Medical Database...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-8">
            <AlertTriangle size={64} color="#EF4444" className="mb-4" />
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">No Info Found</Text>
            <Text className="text-gray-500 text-center mt-2 mb-6">
                We couldn't match "{name}" to the FDA database. It might be a supplement or the naming format is too specific.
            </Text>
            
            {/* Manual Override Option */}
            <TouchableOpacity 
                onPress={() => router.push(`/add?initialName=${name}`)} 
                className="bg-blue-600 px-6 py-3 rounded-xl"
            >
                <Text className="text-white font-bold">Add Manually Anyway</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.back()} className="mt-4">
                <Text className="text-gray-500">Go Back</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 p-5">
            
            <TouchableOpacity 
                onPress={() => router.push(`/add?initialName=${searchUsed}`)} 
                className="bg-blue-600 p-4 rounded-2xl flex-row items-center justify-center mb-6 shadow-md"
            >
                <Plus size={24} color="white" className="mr-2" />
                <Text className="text-white font-bold text-lg">Add to Schedule</Text>
            </TouchableOpacity>

            {/* Purpose */}
            <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl mb-4 shadow-sm">
                <View className="flex-row items-center mb-2">
                    <BookOpen size={20} color={isDark ? '#60A5FA' : '#2563EB'} className="mr-2" />
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">Purpose</Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-300 leading-6">
                    {getField(data.purpose || data.indications_and_usage)}
                </Text>
            </View>

            {/* Warnings */}
            <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl mb-4 shadow-sm border-l-4 border-amber-500">
                <View className="flex-row items-center mb-2">
                    <AlertTriangle size={20} color="#F59E0B" className="mr-2" />
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">Warnings</Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-300 leading-6">
                    {getField(data.warnings || data.do_not_use)}
                </Text>
            </View>

             {/* Dosage Info */}
             <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl mb-10 shadow-sm">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dosage & Admin</Text>
                <Text className="text-gray-600 dark:text-gray-300 leading-6">
                    {getField(data.dosage_and_administration)}
                </Text>
            </View>
            
            <Text className="text-center text-xs text-gray-400 mb-10">Data source: openFDA. Content is for informational purposes only.</Text>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
import { View, Text, TouchableOpacity, ScrollView, useColorScheme, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, ExternalLink } from 'lucide-react-native';
import { MedicineAutofill } from '@/components/MedicineAutofill';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function HubScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchText, setSearchText] = useState("");

  const handleSearch = () => {
    if (!searchText.trim()) return;
    router.push(`/medicine-info?name=${encodeURIComponent(searchText)}`);
  };

  const openPharmacyMap = () => {
    const query = "Pharmacy+near+me";
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    
    Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            Alert.alert("Error", "Could not open Maps.");
        }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 px-5 pt-4">
      
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Hub</Text>
        <Text className="text-gray-500 dark:text-gray-400">Resources & Helpers</Text>
      </View>

      {/* CRITICAL FIX: 
         We use `keyboardShouldPersistTaps="handled"` so taps on the dropdown work.
         We do NOT use zIndex on the ScrollView, but on the items inside.
      */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 100 }} 
        keyboardShouldPersistTaps="handled"
      >
        
        {/* 1. MEDICINE SEARCH (High Z-Index) */}
        {/* We give this container z-index 10 so it floats ABOVE the pharmacy card */}
        <View className="mb-8 z-10">
            <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Identify Pills</Text>
            
            <View className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Text className="text-gray-900 dark:text-white font-bold mb-3 text-lg">Search Medicine</Text>
                <Text className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Find purpose, warnings, and usage instructions.</Text>
                
                {/* AUTOFILL COMPONENT */}
                {/* We pass a prop to let it know to handle its own z-index */}
                <View className="z-20">
                    <MedicineAutofill 
                        value={searchText} 
                        onChange={setSearchText} 
                        isDark={isDark} 
                    />
                </View>

                {/* SEARCH BUTTON */}
                {/* This button will be pushed down by the dropdown if relative, or covered if absolute. 
                    Since standard autocomplete covers, that is expected behavior. 
                    But we add margin top to ensure spacing. */}
                <TouchableOpacity 
                    onPress={handleSearch}
                    className="mt-4 bg-blue-600 py-3 rounded-xl items-center -z-10"
                >
                    <Text className="text-white font-bold">Search Database</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* 2. PHARMACY FINDER (Low Z-Index) */}
        {/* z-index 0 ensures it stays BEHIND the search dropdown */}
        <View className="mb-8 z-0">
             <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">Local Services</Text>
            <TouchableOpacity 
                onPress={openPharmacyMap}
                className="bg-white dark:bg-gray-800 p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-700 flex-row items-center"
            >
            <View className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mr-4">
                <MapPin size={24} className="text-green-600 dark:text-green-400" />
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Find Pharmacy</Text>
                <Text className="text-gray-500 text-sm">Open Maps to find nearest store.</Text>
            </View>
            <ExternalLink size={16} className="text-gray-400" />
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

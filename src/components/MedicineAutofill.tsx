import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { Search, CloudOff } from 'lucide-react-native';
import medicineList from '@/data/medicines.json'; // Keep as backup

type Props = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  isDark?: boolean;
};

export const MedicineAutofill = ({ value, onChange, placeholder = "Search medicine...", isDark = false }: Props) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Ref for the Debounce Timer
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. THE SEARCH LOGIC
  const fetchSuggestions = async (text: string) => {
    try {
      setLoading(true);

      // A. Call the NIH Clinical Tables API (Free, no key required)
      const response = await fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${text}&ef=STRENGTHS_AND_FORMS`
      );
      const json = await response.json();
      
      // The API returns data in format: [count, [names_array], ...]
      // We grab the names array (index 1)
      const apiResults = json[1] || [];

      if (apiResults.length > 0) {
        setSuggestions(apiResults);
      } else {
        // Fallback to local filtering if API returns nothing useful
        fallbackLocalSearch(text);
      }
    } catch (error) {
      // If no internet, fallback to local JSON
      fallbackLocalSearch(text);
    } finally {
      setLoading(false);
    }
  };

  const fallbackLocalSearch = (text: string) => {
    const filtered = medicineList.filter(med => 
      med.toLowerCase().startsWith(text.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  };

  // 2. INPUT HANDLER (With Debounce)
  const handleTextChange = (text: string) => {
    onChange(text);

    // Clear previous timer (user is still typing)
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length > 1) {
      setShowList(true);
      setLoading(true); // Show spinner immediately
      
      // Wait 500ms before hitting the Internet (Saves data/battery)
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(text);
      }, 500);
    } else {
      setShowList(false);
      setLoading(false);
    }
  };

  const handleSelect = (item: string) => {
    onChange(item); // Update Parent Input
    setShowList(false); // Hide Dropdown
  };

  return (
    <View className="relative z-50"> 
      {/* Input Field */}
      <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 border border-gray-200 dark:border-gray-700">
        <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} className="mr-2" />
        <TextInput 
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          className="flex-1 py-4 text-lg font-bold text-gray-900 dark:text-white"
          autoCapitalize="words"
        />
        {/* Loading Indicator inside the bar */}
        {loading && <ActivityIndicator size="small" color="#2563EB" />}
      </View>

      {/* Suggestions Dropdown */}
      {showList && suggestions.length > 0 && (
        <View className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 elevation-5">
          {suggestions.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => handleSelect(item)}
              className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 flex-row items-center justify-between"
            >
              <Text className="text-gray-900 dark:text-white font-medium text-base">{item}</Text>
              
              {/* Visual indicator that this came from the "Cloud" vs Local */}
              {loading === false && !medicineList.includes(item) && (
                 // If item is NOT in our tiny local list, it came from internet
                 <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-bold">WEB</Text>
                 </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Empty State (Optional) */}
      {showList && suggestions.length === 0 && !loading && (
         <View className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 z-50 border border-gray-100 dark:border-gray-700 items-center">
            <CloudOff size={20} color="#9CA3AF" className="mb-2"/>
            <Text className="text-gray-400 text-sm">No matches found</Text>
         </View>
      )}
    </View>
  );
};
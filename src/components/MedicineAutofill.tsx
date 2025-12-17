import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useRef } from 'react';
import { Search } from 'lucide-react-native';
import medicineList from '@/data/medicines.json'; 

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
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (text: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${text}&ef=STRENGTHS_AND_FORMS`
      );
      const json = await response.json();
      const apiResults = json[1] || [];

      if (apiResults.length > 0) {
        setSuggestions(apiResults);
      } else {
        fallbackLocalSearch(text);
      }
    } catch (error) {
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

  const handleTextChange = (text: string) => {
    onChange(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length > 1) {
      setShowList(true);
      setLoading(true);
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(text);
      }, 500);
    } else {
      setShowList(false);
      setLoading(false);
    }
  };

  const handleSelect = (item: string) => {
    onChange(item); 
    setShowList(false); 
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
          // 1. OPEN LIST ON FOCUS (If there is text)
          onFocus={() => {
            if (value.length > 1) setShowList(true);
          }}
          // 2. CLOSE LIST ON BLUR (With slight delay to allow clicks)
          onBlur={() => {
            setTimeout(() => setShowList(false), 200);
          }}
        />
        {loading && <ActivityIndicator size="small" color="#2563EB" />}
      </View>

      {/* Suggestions Dropdown */}
      {showList && suggestions.length > 0 && (
        <View 
            className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 elevation-5"
            style={{ maxHeight: 200 }} 
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
              {suggestions.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleSelect(item)}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 flex-row items-center justify-between"
                >
                  <Text className="text-gray-900 dark:text-white font-medium text-base flex-1 mr-2">{item}</Text>
                  
                  {loading === false && !medicineList.includes(item) && (
                     <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                        <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-bold">WEB</Text>
                     </View>
                  )}
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
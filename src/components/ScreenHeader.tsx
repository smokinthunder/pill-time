import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
};

export const ScreenHeader = ({ title, subtitle, icon }: ScreenHeaderProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Explicitly define Arrow Color
  const arrowColor = isDark ? '#FFFFFF' : '#111827'; 

  return (
    <View className="px-5 pt-4 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm z-10">
      <View className="flex-row items-center">
        
        {/* Large Back Button Area */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-12 h-12 items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-full mr-4 active:opacity-70"
          accessibilityLabel="Go Back"
          accessibilityRole="button"
        >
          {/* Explicit color ensures visibility */}
          <ArrowLeft size={28} color={arrowColor} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Title Area */}
        <View className="flex-1">
          <View className="flex-row items-center">
            {/* Icon passed from parent */}
            {icon && <View className="mr-2">{icon}</View>}
            
            <Text 
              className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight"
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          {subtitle && (
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
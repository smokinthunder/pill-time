import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { CheckCircle, Trash2, AlertTriangle, Info } from 'lucide-react-native';

// --- TYPES ---
type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'destructive' | 'default';
};

type AlertOptions = {
  title: string;
  message: string;
  variant?: AlertVariant;
  buttons?: AlertButton[];
};

type ThemeAlertContextType = {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
};

// --- CONTEXT ---
const ThemeAlertContext = createContext<ThemeAlertContextType | undefined>(undefined);

export const useThemeAlert = () => {
  const context = useContext(ThemeAlertContext);
  if (!context) throw new Error("useThemeAlert must be used within a ThemeAlertProvider");
  return context;
};

// --- COMPONENT ---
export const ThemeAlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const showAlert = (options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300); // Clear after animation
  };

  // Helper to get Icon based on Variant
  const getIcon = () => {
    switch (config?.variant) {
      case 'success': return <CheckCircle size={48} color={isDark ? '#4ADE80' : '#16A34A'} />; // Green
      case 'danger': return <Trash2 size={48} color={isDark ? '#F87171' : '#DC2626'} />; // Red
      case 'warning': return <AlertTriangle size={48} color={isDark ? '#FBBF24' : '#D97706'} />; // Amber
      default: return <Info size={48} color={isDark ? '#60A5FA' : '#2563EB'} />; // Blue
    }
  };

  return (
    <ThemeAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="w-full bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl items-center">
            
            {/* 1. Icon Header */}
            <View className="mb-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full">
              {getIcon()}
            </View>

            {/* 2. Text Content */}
            <Text className="text-2xl font-extrabold text-gray-900 dark:text-white text-center mb-2">
              {config?.title}
            </Text>
            <Text className="text-lg text-gray-500 dark:text-gray-300 text-center mb-8 leading-6">
              {config?.message}
            </Text>

            {/* 3. Buttons */}
            <View className="w-full gap-3">
              {config?.buttons?.map((btn, index) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) btn.onPress();
                    }}
                    className={`w-full py-4 rounded-xl items-center justify-center border ${
                      isDestructive 
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-900' 
                        : isCancel 
                          ? 'bg-transparent border-transparent' 
                          : 'bg-blue-600 border-blue-600'
                    }`}
                  >
                    <Text 
                      className={`text-lg font-bold ${
                        isDestructive 
                          ? 'text-red-700 dark:text-red-400' 
                          : isCancel 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-white'
                      }`}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Default OK Button */}
              {(!config?.buttons || config.buttons.length === 0) && (
                 <TouchableOpacity 
                   onPress={hideAlert}
                   className="w-full py-4 rounded-xl items-center justify-center bg-blue-600"
                 >
                   <Text className="text-white text-lg font-bold">OK</Text>
                 </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Modal>
    </ThemeAlertContext.Provider>
  );
};
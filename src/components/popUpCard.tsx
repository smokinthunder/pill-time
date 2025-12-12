import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

export type ButtonColorType = 'restock' | 'edit' | 'delete' | 'skip' | 'lost' | 'cancel';

type PopUpCardProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons: {
    text: string;
    onPress: () => void;
    colorType: ButtonColorType; 
    icon: React.ReactNode; 
  }[];
};

export function PopUpCard({ visible, title, message, onClose, buttons }: PopUpCardProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 bg-black/80 justify-center items-center px-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border-2 border-gray-100 dark:border-gray-700"
        >
          <View className="mb-6 items-center">
            <Text className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">{title}</Text>
            <Text className="text-center text-gray-500 dark:text-gray-300 text-base font-medium leading-6">{message}</Text>
          </View>

          <View className="gap-3">
            {buttons.map((btn, index) => {
              let bgClass = "";
              let textClass = "text-white"; 
              let borderClass = "border-transparent";

              switch (btn.colorType) {
                case 'restock': bgClass = "bg-green-600 dark:bg-green-700"; break;
                case 'edit': bgClass = "bg-blue-600 dark:bg-blue-700"; break;
                case 'delete': bgClass = "bg-red-600 dark:bg-red-700"; break;
                case 'skip': bgClass = "bg-amber-500 dark:bg-amber-600"; break;
                case 'lost': bgClass = "bg-orange-600 dark:bg-orange-700"; break;
                case 'cancel': 
                  bgClass = "bg-gray-200 dark:bg-gray-800";
                  textClass = "text-gray-900 dark:text-gray-100";
                  borderClass = "border-gray-300 dark:border-gray-600";
                  break;
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => { btn.onPress(); onClose(); }}
                  activeOpacity={0.8}
                  className={`w-full py-4 rounded-xl flex-row items-center justify-center border ${bgClass} ${borderClass}`}
                >
                  <View className="mr-3">{btn.icon}</View>
                  <Text className={`font-bold text-lg ${textClass}`}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
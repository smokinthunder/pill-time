import { Tabs } from "expo-router";
import { Home, Calendar, ShoppingBag } from "lucide-react-native"; // Import Calendar Icon
import { useColorScheme } from "nativewind";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    primary: isDark ? "#4D94FF" : "#0066CC",
    background: isDark ? "#1F2937" : "#FFFFFF",
    inactive: isDark ? "#9CA3AF" : "#6B7280",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
      }}
    >
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      {/* 2. NEW: Purchases Tab */}
      <Tabs.Screen
        name="purchases" // Make sure file is named purchases.tsx
        options={{
          title: "Purchases",
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />

      {/* 3. History */}
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

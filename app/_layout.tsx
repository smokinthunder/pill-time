import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDatabase } from '@/core/database/initialize';
import { ThemeAlertProvider } from '@/context/ThemeAlertContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    const setup = async () => {
      try {
        await initializeDatabase();
        setDbReady(true);
      } catch (e) {
        console.error("DB Error:", e);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ThemeAlertProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="edit/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="restock/[id]" options={{ headerShown: false }} />
        </Stack>
      </ThemeAlertProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
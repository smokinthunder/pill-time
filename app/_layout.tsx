import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind'; // IMPORT NATIVEWIND hook
import 'react-native-reanimated';

import '@/global.css';
import { initializeDatabase } from '@/core/database/initialize';
import { ThemeAlertProvider } from '@/context/ThemeAlertContext';
import { db } from '@/core/database/client';
import { appSettings } from '@/core/database/schema';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme(); // NativeWind hook
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
        
        // --- 1. SYNC THEME FROM DATABASE ---
        const settings = await db.select().from(appSettings).limit(1);
        if (settings.length > 0 && settings[0].themePreference) {
           // Apply the saved theme ('system' | 'light' | 'dark')
           setColorScheme(settings[0].themePreference as any);
        }
        
        setDbReady(true);
      } catch (e) {
        console.error("Setup Error:", e);
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
    // Pass the active colorScheme to Navigation Theme
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
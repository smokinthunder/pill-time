import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native'; 
import 'react-native-reanimated';

import '@/global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDatabase } from '@/core/database/initialize';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  // Init DB
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

  // Hide Splash
  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  // ERROR HANDLING: If fonts fail, we shouldn't kill the app, but we can't render text.
  if (!fontsLoaded && !fontError) {
    // RETURN NULL IS OKAY, BUT LET'S TRY RETURNING THE PROVIDER WITH EMPTY VIEW
    // This keeps the context alive in edge cases.
    return null; 
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
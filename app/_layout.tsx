import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";

import "@/global.css";
import { initializeDatabase } from "@/core/database/initialize";
import { ThemeAlertProvider } from "@/context/ThemeAlertContext";
import { db } from "@/core/database/client";
import { appSettings } from "@/core/database/schema";
import { requestLocalNotificationPermissions } from "@/utils/notifications"; // Import

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const router = useRouter();

  // 1. STATE
  const [isReady, setIsReady] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  // 2. REFS (To prevent double-firing)
  const dbInitialized = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  // 3. INITIALIZATION EFFECT
  useEffect(() => {
    const setup = async () => {
      // Prevent running this twice
      if (dbInitialized.current) return;
      dbInitialized.current = true;

      try {
        // A. Init Database
        await initializeDatabase();

        // B. Sync Theme
        const settings = await db.select().from(appSettings).limit(1);
        if (settings.length > 0 && settings[0].themePreference) {
          setColorScheme(settings[0].themePreference as any);
        }

        // C. Check Onboarding Status
        const hasLaunched = await AsyncStorage.getItem("hasLaunched");
        if (hasLaunched === null) {
          setShouldShowOnboarding(true);
        }

        // REQUEST PERMISSIONS
        await requestLocalNotificationPermissions();
        // D. Mark App as Ready
        setIsReady(true);
      } catch (e) {
        console.error("Setup Error:", e);
        // Even if error, allow app to load to avoid white screen of death
        setIsReady(true);
      }
    };

    setup();
  }, []);

  // 4. NAVIGATION EFFECT (Runs only when Ready)
  useEffect(() => {
    if (isReady && fontsLoaded) {
      // Hide Splash
      SplashScreen.hideAsync();

      // Handle Navigation
      if (shouldShowOnboarding) {
        // Small delay ensures Navigation Container is mounted
        setTimeout(() => {
          router.replace("/onboarding");
        }, 100);
      }
    }
  }, [isReady, fontsLoaded, shouldShowOnboarding]);

  // 5. RENDER
  if (!fontsLoaded || !isReady) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ThemeAlertProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="settings"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen name="edit/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="restock/[id]" options={{ headerShown: false }} />

          {/* Prevent user from swiping back during onboarding */}
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack>
      </ThemeAlertProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

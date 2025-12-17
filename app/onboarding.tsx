import { View, Text, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeartHandshake, Pill, Bell, User, Check, ArrowRight } from 'lucide-react-native';
import { db } from '@/core/database/client';
import { appSettings } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: "Welcome!",
    desc: "I am here to help you manage your medicines simply and safely.",
    icon: <HeartHandshake size={100} color="#2563EB" />,
    color: "bg-blue-50"
  },
  {
    id: 2,
    title: "Track Pills",
    desc: "Never wonder 'Did I take that?' again. I keep a history of everything.",
    icon: <Pill size={100} color="#16A34A" />, // Green
    color: "bg-green-50"
  },
  {
    id: 3,
    title: "Stay Stocked",
    desc: "I count your pills and tell you when it's time to call the pharmacy.",
    icon: <Bell size={100} color="#D97706" />, // Amber
    color: "bg-amber-50"
  },
  {
    id: 4,
    title: "Let's Start",
    desc: "First things first...",
    icon: <User size={100} color="#4F46E5" />, // Indigo
    color: "bg-indigo-50"
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState("");
  
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    const finalName = name.trim() || "Grandpa"; // Default if empty

    try {
      // 1. Save Name to Database
      const settings = await db.select().from(appSettings).limit(1);
      if (settings.length > 0) {
        await db.update(appSettings)
            .set({ userName: finalName })
            .where(eq(appSettings.id, settings[0].id));
      } else {
        await db.insert(appSettings).values({ userName: finalName });
      }

      // 2. Mark Onboarding as Done in Storage
      await AsyncStorage.setItem('hasLaunched', 'true');

      // 3. Go to App
      Vibration.vibrate(50);
      router.replace('/(tabs)');
      
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center p-6">
          
          {/* ANIMATED CONTENT */}
          <Animated.View 
            key={currentIndex} 
            entering={SlideInRight} 
            exiting={SlideOutLeft}
            className="items-center w-full"
          >
            {/* Icon Circle */}
            <View className={`w-48 h-48 rounded-full items-center justify-center mb-10 ${SLIDES[currentIndex].color} dark:bg-gray-800`}>
              {SLIDES[currentIndex].icon}
            </View>

            {/* Text */}
            <Text className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-4">
              {SLIDES[currentIndex].title}
            </Text>
            
            <Text className="text-xl text-gray-500 dark:text-gray-400 text-center leading-8 px-4">
              {SLIDES[currentIndex].desc}
            </Text>

            {/* NAME INPUT (Only on last slide) */}
            {isLastSlide && (
              <View className="w-full mt-10">
                <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">What should I call you?</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Grandma, John..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-100 dark:bg-gray-800 p-5 rounded-2xl text-2xl font-bold text-center text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  autoFocus
                />
              </View>
            )}
          </Animated.View>

        </View>

        {/* FOOTER NAVIGATION */}
        <View className="p-6 w-full">
          
          {/* Dots */}
          <View className="flex-row justify-center space-x-2 mb-8 gap-2">
            {SLIDES.map((_, index) => (
              <View 
                key={index} 
                className={`h-2 rounded-full ${index === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} 
              />
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity 
            onPress={handleNext}
            activeOpacity={0.8}
            className={`w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg ${isLastSlide ? 'bg-indigo-600' : 'bg-blue-600'}`}
          >
            <Text className="text-white font-bold text-xl mr-2">
              {isLastSlide ? "Get Started" : "Next"}
            </Text>
            {isLastSlide ? <Check color="white" size={24} /> : <ArrowRight color="white" size={24} />}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { Send, Bot, ArrowLeft, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/core/database/client";
import { medications } from "@/core/database/schema";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; 

export default function ChatScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const [messages, setMessages] = useState<{id: string, text: string, sender: 'user' | 'bot'}[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [medContext, setMedContext] = useState("");

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadContext();
    setMessages([{
        id: '1',
        text: "Hi there! I can help you understand your medicines. What would you like to know?",
        sender: 'bot'
    }]);
  }, []);

  const loadContext = async () => {
    try {
        const meds = await db.select().from(medications);
        if (meds.length > 0) {
            const list = meds.map(m => `${m.name} (${m.currentStock} ${m.unit})`).join(", ");
            setMedContext(`User Inventory: ${list}.`);
        } else {
            setMedContext("User Inventory: Empty.");
        }
    } catch (e) { console.error(e); }
  };

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    if (!API_KEY) {
        setMessages(prev => [...prev, { id: 'err', text: "Error: Missing API Key.", sender: 'bot' }]);
        return;
    }

    const userMsg = inputText;
    setInputText("");
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);
    setLoading(true);

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using stable 2.5 model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

        const prompt = `
            System: You are a helpful medical assistant. 
            Context: The user has these meds: ${medContext}.
            Style: Keep answers short (max 2-3 sentences). Use simple words. Be clear and safe.
            User: ${userMsg}
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: text, sender: 'bot' }]);

    } catch (error) {
        setMessages(prev => [...prev, { id: 'err', text: "I couldn't reach the internet. Try again later.", sender: 'bot' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
          {/* 1. HEADER */}
          <View className="flex-row items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
            <TouchableOpacity 
                onPress={() => router.back()} 
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mr-4"
            >
                <ArrowLeft size={28} color={isDark ? "white" : "black"} />
            </TouchableOpacity>
            <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-row items-center">
                    Health Assistant
                </Text>
                <Text className="text-sm text-blue-600 dark:text-blue-400 font-bold">Ask about your pills</Text>
            </View>
            <Sparkles size={28} color="#2563EB" />
          </View>

          {/* 2. CHAT LIST */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
                <View className={`flex-row mb-6 ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {item.sender === 'bot' && (
                        <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center mr-3 mt-1 border border-blue-200 dark:border-blue-800">
                            <Bot size={24} color="#2563EB" />
                        </View>
                    )}
                    
                    <View 
                        className={`p-5 rounded-3xl max-w-[85%] shadow-sm ${
                            item.sender === 'user' 
                            ? 'bg-blue-600 rounded-tr-none' 
                            : 'bg-white dark:bg-gray-800 rounded-tl-none border border-gray-200 dark:border-gray-700'
                        }`}
                    >
                        <Text className={`text-xl leading-7 ${item.sender === 'user' ? 'text-white font-medium' : 'text-gray-900 dark:text-white'}`}>
                            {item.text}
                        </Text>
                    </View>
                </View>
            )}
          />

          {/* 3. INPUT AREA - FIXED: Using standard 'style' props to avoid NativeWind/Keyboard crash */}
          <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <View className="flex-row items-end gap-3">
                    <TextInput 
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type here..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        // FIXED: Replaced className with style
                        style={{
                            flex: 1,
                            backgroundColor: isDark ? '#374151' : '#F3F4F6',
                            padding: 16,
                            borderRadius: 16,
                            fontSize: 20,
                            color: isDark ? 'white' : '#111827',
                            borderWidth: 1,
                            borderColor: isDark ? '#4B5563' : '#E5E7EB',
                            minHeight: 60,
                            maxHeight: 120
                        }}
                    />
                    
                    <TouchableOpacity 
                        onPress={handleSend}
                        disabled={loading || inputText.length === 0}
                        // FIXED: Replaced className with style
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 4,
                            backgroundColor: (loading || inputText.length === 0) 
                                ? (isDark ? '#4B5563' : '#D1D5DB') 
                                : '#2563EB',
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Send size={28} color="white" style={{ marginLeft: 4 }} />
                        )}
                    </TouchableOpacity>
                </View>
          </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles, Bot, User } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader'; // Reusing your unified header
import { useColorScheme } from 'nativewind';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function ChatScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your medication assistant. You can ask me about your schedule, history, or drug details.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

    // 2. Simulate Bot Response (Placeholder for AI)
    setTimeout(() => {
        const botMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            text: "I am a UI placeholder right now, but soon I will be smart!", 
            sender: 'bot', 
            timestamp: new Date() 
        };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-2 self-end">
                <Bot size={16} className="text-blue-600 dark:text-blue-400" />
            </View>
        )}
        
        <View 
            className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                isUser 
                ? 'bg-blue-600 rounded-br-none' 
                : 'bg-gray-200 dark:bg-gray-800 rounded-bl-none'
            }`}
        >
            <Text className={`text-base ${isUser ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {item.text}
            </Text>
        </View>

        {isUser && (
            <View className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center ml-2 self-end">
                <User size={16} className="text-gray-600 dark:text-gray-400" />
            </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <ScreenHeader 
        title="Assistant" 
        subtitle="Ask me anything"
        icon={<Sparkles size={24} color={isDark ? '#FBBF24' : '#D97706'} />} // Gold sparkle
      />

      {/* Chat Area */}
      <View className="flex-1 px-4 pt-4">
        <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
        />
        
        {loading && (
            <View className="flex-row items-center mb-4 ml-10">
                <ActivityIndicator size="small" color="#2563EB" />
                <Text className="text-gray-400 ml-2 text-xs">Thinking...</Text>
            </View>
        )}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-row items-center pb-8">
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-full text-base text-gray-900 dark:text-white mr-3 max-h-24"
                multiline
            />
            <TouchableOpacity 
                onPress={handleSend}
                className={`w-12 h-12 rounded-full items-center justify-center ${input.trim() ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                disabled={!input.trim()}
            >
                <Send size={20} color="white" className={input.trim() ? '' : 'opacity-50'} />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}
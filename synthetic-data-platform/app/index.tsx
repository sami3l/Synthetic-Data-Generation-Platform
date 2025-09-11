import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

export default function IndexScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const user = await AsyncStorage.getItem('user');
        
        if (token && user) {
          // User is authenticated, redirect to main app
          router.replace('/(tabs)/home');
        } else if (user && JSON.parse(user).role === 'admin') {
          // User is not authenticated, redirect to login
          router.replace('/(tabs)/admin');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, redirect to login
        router.replace('/(auth)/login');
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="mt-4 text-gray-600">Loading...</Text>
    </View>
  );
}

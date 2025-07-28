import React, { useState } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '@/services/api/authService';

const LoginScreen = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = isSignup
        ? await authService.signup({ email, password, username: name })
        : await authService.login(email, password);

      // Fix: Use access_token instead of token for login response
      const token = isSignup ? response.token : response.access_token;
      
      if (token) {
        await AsyncStorage.setItem('token', token);
      }
      
      // Store user data if available
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View className="items-center mb-12">
          <Text className="text-3xl font-bold text-gray-900 text-center">
            Synthetic Data Platform
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
            <TextInput
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {isSignup && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
            </View>
          )}

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
            <TextInput
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`w-full py-3 rounded-lg items-center justify-center ${
              isLoading ? 'bg-indigo-400' : 'bg-indigo-600'
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                {isSignup ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="py-2" onPress={() => setIsSignup(!isSignup)}>
            <Text className="text-indigo-600 text-center">
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center">
            Demo credentials: demo@example.com / password
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
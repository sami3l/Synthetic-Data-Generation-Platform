import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '@/services/api/authService';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const LoginScreen = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Check for existing user session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const user = await AsyncStorage.getItem('user');
        if (token && user) {
          router.replace('/(tabs)/home');
        }
      } catch (error) {
        console.log('No existing session found');
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (isSignup) {
        response = await authService.signup({ email, password, username: name });
        await AsyncStorage.setItem('token', response.token);
      } else {
        response = await authService.login(email, password);
        await AsyncStorage.setItem('token', response.access_token);
        
        // Fetch user profile after successful login
        if (response.access_token) {
          const userProfile = await authService.getProfile();
          await AsyncStorage.setItem('user', JSON.stringify(userProfile));
        }
      }

      router.replace('/(tabs)/home');
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10">
            <View className="bg-indigo-100 p-4 rounded-full mb-4">
              <Icon name="database" size={40} color={theme.colors.primary} />
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center">
              Synthetic Data Generation
            </Text>
            <Text className="text-gray-600 mt-2 text-center">
              {isSignup ? 'Create your account' : 'Welcome back! Sign in to continue'}
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email Address</Text>
              <TextInput
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" />}
                outlineColor="#e5e7eb"
                activeOutlineColor={theme.colors.primary}
              
              />
            </View>

            {isSignup && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
                <TextInput
                  mode="outlined"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  left={<TextInput.Icon icon="account" />}
                  outlineColor="#e5e7eb"
                  activeOutlineColor={theme.colors.primary}
                />
              </View>
            )}

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
              <TextInput
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!isPasswordVisible}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={isPasswordVisible ? "eye-off" : "eye"} 
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  />
                }
                outlineColor="#e5e7eb"
                activeOutlineColor={theme.colors.primary}
              />
            </View>

            {!isSignup && (
              <TouchableOpacity className="self-end">
                <Text className="text-indigo-600 text-sm font-medium">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            
            <View className="flex-row items-center my-4">
              <></>
            </View>

            <TouchableOpacity
              className={`w-full py-3  rounded-lg items-center justify-center shadow-sm ${
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

            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-3 text-gray-500">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <TouchableOpacity 
              className="py-3" 
              onPress={() => setIsSignup(!isSignup)}
            >
              <Text className="text-indigo-600 text-center font-medium">
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
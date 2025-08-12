import React, { useState, useEffect } from 'react';
import { 
  View, 
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Icon, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authService } from '@/services/api/authService';



// TypeScript interfaces
interface UserData {
  username?: string;
  email?: string;
}

interface UserProfileResponse {
  id: number;
  user_id: number;
  full_name?: string;
  organization?: string;
  usage_purpose?: string;
  role?: string;  // Nouveau champ role
  created_at?: string;
  updated_at?: string;
}

export default function ProfileScreen() {
  
  
  
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  // Vérifier si l'utilisateur est admin basé sur le profil chargé
  const isAdmin = profile?.role === 'admin';

  // Navigation vers l'administration
  const navigateToAdmin = () => {
    router.push('/(tabs)/admin' as any);
  };

  // Load user data on component mount
  useEffect(() => {
    loadProfileData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Fonction pour forcer le rechargement des données utilisateur
 
  const loadProfileData = async () => {
    console.log('🔄 Starting loadProfileData...');
    try {
      // Plus besoin de charger depuis AsyncStorage, on utilise Redux maintenant
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }


      const profileData = await authService.getProfile();
      console.log('✅ Profile received:', profileData);
      setProfile(profileData);
      
      
    } catch (error: any) {
      console.error('❌ Error loading profile data:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      if (error?.response?.status === 401 || error?.message?.includes('Session expired')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load profile data. Pull to refresh.');
      }
    } finally {
     
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call auth service logout
      await authService.logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-b from-indigo-50 to-white">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600 font-medium">Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-indigo-50 mt-12 mb-6 to-white">
      <Animated.ScrollView 
        className="flex-1 px-5"
        style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Profile Header */}
        <View className="mt-8 mb-6">
          <View className="items-center">
            {/* Avatar with gradient border */}
            <View className="w-24 h-24 rounded-full mb-4 p-1 bg-gradient-to-r from-indigo-500 to-purple-600">
              <View className="flex-1 bg-white rounded-full items-center justify-center">
                <Text className="text-3xl font-bold text-indigo-600">
                  {profile?.full_name ? 
                    profile.full_name.charAt(0).toUpperCase() : 
                    user?.username ? user.username.charAt(0).toUpperCase() : 'U'
                  }
                </Text>
              </View>
            </View>
            
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {profile?.full_name || user?.username || 'User'}
            </Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-bold text-gray-900">Personal Information</Text>
            <TouchableOpacity 
              onPress={() => router.push('/profile/edit')}
              className="p-2 -mr-2"
            >
              <Icon source="pencil" size={20} color="#6366f1"/>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-green-50 rounded-lg items-center justify-center mr-4">
                <Icon source="account" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wider">Full Name</Text>
                <Text className="text-gray-900 font-medium mt-1">
                  {profile?.full_name || 'Not provided'}
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-orange-50 rounded-lg items-center justify-center mr-4">
                <Icon source="office-building" size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wider">Organization</Text>
                <Text className="text-gray-900 font-medium mt-1">
                  {profile?.organization || 'Not specified'}
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-purple-50 rounded-lg items-center justify-center mr-4">
                <Icon source="target" size={20} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wider">Usage Purpose</Text>
                <Text className="text-gray-900 font-medium mt-1">
                  {profile?.usage_purpose || 'Not specified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Details Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-5">Account Details</Text>
          
          <View className="space-y-4">
            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-teal-50 rounded-lg items-center justify-center mr-4">
                <Icon source="calendar" size={20} color="#14b8a6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wider">Member Since</Text>
                <Text className="text-gray-900 font-medium mt-1">
                  {formatDate(profile?.created_at)}
                </Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 bg-pink-50 rounded-lg items-center justify-center mr-4">
                <Icon source="update" size={20} color="#ec4899" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wider">Last Updated</Text>
                <Text className="text-gray-900 font-medium mt-1">
                  {formatDate(profile?.updated_at)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Actions</Text>
          
          <View className="space-y-3">
            <TouchableOpacity 
              className="flex-row items-center justify-between p-5 bg-white rounded-xl border border-gray-100"
              onPress={() => router.push('/(tabs)/requests')}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-indigo-50 rounded-lg items-center justify-center mr-4">
                  <Icon source="file-document" size={20} color="#6366f1" />
                </View>
                <Text className="text-gray-900 font-medium">View Requests</Text>
              </View>
              <Icon source="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center justify-between p-5 bg-white rounded-xl border border-gray-100"
              onPress={() => router.push('/profile/datasets')}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-emerald-50 rounded-lg items-center justify-center mr-4">
                  <Icon source="database" size={20} color="#10b981" />
                </View>
                <Text className="text-gray-900 font-medium">My Datasets</Text>
              </View>
              <Icon source="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>



            <TouchableOpacity 
              className="flex-row items-center justify-between p-5 bg-white rounded-xl border border-gray-100"
            //   onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-4">
                  <Icon source="cog" size={20} color="#3b82f6" />
                </View>
                <Text className="text-gray-900 font-medium">Settings</Text>
              </View>
              <Icon source="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center justify-between p-5 bg-white rounded-xl border border-gray-100"
            //   onPress={() => router.push('/(tabs)/help')}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-50 rounded-lg items-center justify-center mr-4">
                  <Icon source="help-circle" size={20} color="#10b981" />
                </View>
                <Text className="text-gray-900 font-medium">Help & Support</Text>
              </View>
              <Icon source="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        

        {/* Admin Button - Visible seulement pour les admins */}
        {/* {isAdmin && (
          <TouchableOpacity
            className="w-full py-3 rounded-lg items-center justify-center bg-blue-600 mb-4"
            onPress={navigateToAdmin}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <Icon source="shield-account" size={20} color="black" />
              <Text className="text-white font-semibold ml-2">Administration</Text>
            </View>
          </TouchableOpacity>
        )} */}

        {/* Logout Button */}
        <TouchableOpacity
          className={`w-fit py-3 rounded-xl items-center justify-center ${isLoggingOut
            ? 'bg-gray-400' : 'bg-red-600'}`}
            onPress={handleLogout}
            disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#000000" />
            ) : (
            <Text className="text-white font-semibold">Logout</Text>
            )}
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
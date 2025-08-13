import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/services/api/authService';
import AdminDashboard from '../../components/AdminDashboard';

// Interface pour le profil utilisateur
interface UserProfileResponse {
  id: number;
  user_id: number;
  full_name?: string;
  organization?: string;
  usage_purpose?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminScreen() {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le profil utilisateur au démarrage
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    console.log('🔄 Loading profile for admin screen...');
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = await authService.getProfile();
      console.log('✅ Profile loaded in admin screen:', profileData);
      console.log('🔑 User role:', (profileData as any)?.role);
      
      setProfile(profileData as UserProfileResponse);
    } catch (error: any) {
      console.error('❌ Error loading profile in admin screen:', error);
      setError('Failed to load user profile');
      
      // Si erreur d'authentification, rediriger vers login
      if (error?.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600 font-medium">Loading admin panel...</Text>
      </SafeAreaView>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-6">
        <Text className="text-red-600 text-lg font-medium text-center mb-4">
          {error}
        </Text>
        <Text className="text-gray-600 text-center">
          Please try refreshing the app or contact support.
        </Text>
      </SafeAreaView>
    );
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = profile?.role === 'admin';
  
  console.log('🔍 Admin check:', {
    profile: profile,
    role: profile?.role,
    isAdmin: isAdmin
  });

  // Si pas admin, afficher message d'accès refusé
  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white px-6">
        <View className="items-center">
          <Text className="text-6xl mb-4">🔒</Text>
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Accès réservé
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            Cette section est réservée aux administrateurs.
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            Votre rôle actuel: {profile?.role || 'utilisateur'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si admin, afficher le dashboard admin
  return (
    <View className="flex-1 mt-10">
      <AdminDashboard />
    </View>
  );
}
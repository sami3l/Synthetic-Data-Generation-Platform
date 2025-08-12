import {  Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { authService } from '../../services/api/authService';


export default function TabsLayout() {
  const theme = useTheme();  
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Charger le profil utilisateur au démarrage pour récupérer le rôle
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (user) {
          const profile = await authService.getProfile();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading profile in tabs:', error);
      }
    };
    
    loadProfile();
  }, [user]);

  // Vérifier si l'utilisateur est admin
  const isAdmin = userProfile?.role === 'admin';

  return (

    <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          tabBarIcon: ({ color }) => <Icon name="auto-fix" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          headerShown:false,
          tabBarIcon: ({ color }) => <Icon name="format-list-bulleted" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests-new"
        options={{
          href: null, // Cacher cet onglet de la navigation
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Icon name="bell" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{    
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="account" size={24} color={color} />,
          
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="shield-account" size={24} color={color} />,
          href: isAdmin ? undefined : null, // Masquer l'onglet si pas admin
        }}
      />
    </Tabs>
 
  );
}
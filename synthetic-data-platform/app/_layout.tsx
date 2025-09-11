import { Stack } from 'expo-router';
import React from 'react';
import '../global.css';
import { Provider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { store } from '../store/index';
import { useNotifications } from '../hooks/useNotifications';
import { View, Platform } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Redirect } from 'expo-router';
// import { useSessionExpiration } from '../hooks/useSessionExpiration';

// Thème moderne et élégant
const modernTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366F1', // Indigo moderne
    primaryContainer: '#E0E7FF',
    secondary: '#EC4899', // Rose vif
    secondaryContainer: '#FCE7F3',
    tertiary: '#06B6D4', // Cyan
    tertiaryContainer: '#CFFAFE',
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    background: '#FAFBFC',
    outline: '#E2E8F0',
    outlineVariant: '#F1F5F9',
    onSurface: '#1E293B',
    onSurfaceVariant: '#64748B',
    onBackground: '#0F172A',
    error: '#EF4444',
    errorContainer: '#FEE2E2',
    onError: '#FFFFFF',
    onErrorContainer: '#991B1B',
    success: '#10B981',
    successContainer: '#D1FAE5',
    warning: '#F59E0B',
    warningContainer: '#FEF3C7',
  },
  roundness: 12, // Coins plus arrondis pour un look moderne
};

function AppContent() {
  const { user } = useAuth(); // Récupérer l'utilisateur depuis le store Redux
  useNotifications(); // Hook pour gérer les notifications push
  // useSessionExpiration(); // Hook pour gérer l'expiration de session

    if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Platform.OS === 'web' ? '#fff' : undefined,
        },
        headerShadowVisible: Platform.OS === 'web',
        contentStyle: {
          backgroundColor: Platform.OS === 'web' ? '#F9FAFB' : undefined,
        },
      }}
    >
      <Stack.Screen 
        name="(auth)" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{
          headerShown: Platform.OS === 'web',
          headerTitle: "Profil",
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: '600',
          },
        }} 
      />
      <Stack.Screen 
        name="requests" 
        options={{
          headerShown: Platform.OS === 'web',
          headerTitle: "Requêtes",
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: '600',
          },
        }} 
      />
      <Stack.Screen 
        name='admin' 
        options={{
          headerShown: Platform.OS === 'web',
          headerTitle: "Administration",
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: '600',
          },
        }} 
      />
    </Stack>
  );
}


export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={modernTheme}>
        <AppContent />
      </PaperProvider>
    </Provider>
  );
}


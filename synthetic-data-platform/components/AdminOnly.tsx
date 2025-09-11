import React from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminOnlyProps {
  children: React.ReactNode;
}

// Ce composant affiche son contenu uniquement si l'utilisateur est admin
export const AdminOnly: React.FC<AdminOnlyProps> = ({ children }) => {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUser();
  }, []);

  
  if (!user || user.role !== 'admin') {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Accès réservé à l&apos;administration
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

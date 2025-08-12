// hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { axiosInstance } from '../services/api/axios.config';
import Constants from 'expo-constants';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  // Fonction pour tester les notifications locales
  const scheduleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test de notification ! 📱",
        body: 'Ceci est une notification de test pour votre plateforme de données synthétiques.',
        data: { testData: 'test notification' },
      },
      trigger: { 
        seconds: 2 
      } as any,
    });
  };

  useEffect(() => {
    if (!user) return;

    // Demander les permissions et enregistrer le token
    registerForPushNotificationsAsync();

    // Tester une notification locale après 5 secondes (seulement en développement)
    if (__DEV__) {
      setTimeout(() => {
        scheduleTestNotification();
      }, 5000);
    }

    // Listener pour les notifications reçues quand l'app est ouverte
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification reçue:', notification);
    });

    // Listener pour quand l'utilisateur tape sur une notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapée:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [user]);

  const registerForPushNotificationsAsync = async () => {
    try {
      // Vérifier si nous sommes dans Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo) {
        console.log('⚠️ Notifications push non disponibles dans Expo Go. Utilisez un development build.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'synthetic-data-platform';
      
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;

      // Envoyer le token au backend
      if (token) {
        await axiosInstance.post('/users/register-push-token', { push_token: token });
        console.log('✅ Token de notification enregistré:', token);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
    }
  };

  return {
    scheduleTestNotification
  };
};

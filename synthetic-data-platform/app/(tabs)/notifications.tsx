import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  RefreshControl, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { 
  Text, 
  Card, 
  ActivityIndicator, 
  Button,
  Icon,
  Badge
} from 'react-native-paper';
import { router } from 'expo-router';
import { notificationService, Notification } from '@/services/api/notificationsService';
import Toast from 'react-native-toast-message';
import { authService } from '@/services/api/authService';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<number[]>([]);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await notificationService.getNotifications();
      console.log('Notifications chargées:', data);
      
      // S'assurer que data est un tableau
      const safeNotifications = Array.isArray(data) ? data : [];
      // Trier par date (plus récentes en premier) - utiliser timestamp
      const sortedNotifications = safeNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setNotifications(sortedNotifications);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des notifications:', error);
      
      if (error.response?.status === 401 || error.message?.includes('Session expired')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read || markingAsRead.includes(notification.id)) return;

    try {
      setMarkingAsRead(prev => [...prev, notification.id]);
      
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );

      // Uncomment when API is ready
      await authService.markNotificationAsRead(notification.id);
      
      Toast.show({
        type: 'success',
        text1: 'Notification marquée comme lue',
        position: 'bottom'
      });

    } catch (error) {
      console.error('Erreur lors du marquage:', error);
      // Revert optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: false } : n)
      );
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer comme lu',
        position: 'bottom'
      });
    } finally {
      setMarkingAsRead(prev => prev.filter(id => id !== notification.id));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      await Promise.all(
        unreadNotifications.map(n => authService.markAllNotificationsAsRead())
      );
      
      Toast.show({
        type: 'success',
        text1: 'Toutes les notifications marquées comme lues',
        position: 'bottom'
      });

    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
      // Revert
      await loadNotifications();
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer toutes comme lues',
        position: 'bottom'
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert';
      case 'info': 
      default: return 'information';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': 
      default: return '#3b82f6';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-4 text-gray-600">Chargement des notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 mt-10">
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text variant="headlineSmall" className="font-bold text-gray-900">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View className="ml-2">
                <Badge 
                  size={20} 
                  style={{ backgroundColor: '#ef4444' }}
                >
                  {unreadCount}
                </Badge>
              </View>
            )}
          </View>
          
          {unreadCount > 0 && (
            <Button
              mode="outlined"
              compact
              onPress={handleMarkAllAsRead}
              icon="check-all"
            >
              Tout marquer lu
            </Button>
          )}
        </View>
        
        <Text variant="bodySmall" className="text-gray-500 mt-1">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''} au total
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor="#6366f1"
          />
        }
      >
        {notifications.length === 0 ? (
          <Card className="mt-4">
            <Card.Content className="items-center py-12">
              <Icon source="bell-off" size={64} color="#9ca3af" />
              <Text variant="titleLarge" className="text-gray-800 font-bold mt-4 mb-2">
                Aucune notification
              </Text>
              <Text variant="bodyMedium" className="text-gray-600 text-center">
                Vous recevrez ici les notifications concernant{'\n'}
                vos générations de données synthétiques.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View className="py-4">
            {notifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                activeOpacity={0.7}
                onPress={() => handleMarkAsRead(notification)}
              >
                <Card 
                  className={`mb-3 ${
                    notification.is_read 
                      ? 'bg-white border-gray-100' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  style={{
                    borderWidth: 1,
                    borderColor: notification.is_read ? '#f3f4f6' : '#dbeafe'
                  }}
                >
                  <Card.Content className="p-4">
                    <View className="flex-row items-start">
                      <View className="mr-3 mt-1">
                        <Icon
                          source={getNotificationIcon(notification.type)}
                          size={20}
                          color={getNotificationColor(notification.type)}
                        />
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between mb-2">
                          <Text 
                            variant="bodyMedium" 
                            className={`flex-1 leading-relaxed ${
                              notification.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'
                            }`}
                          >
                            {notification.message}
                          </Text>
                          
                          {!notification.is_read && (
                            <View className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2" />
                          )}
                        </View>
                        
                        <View className="flex-row items-center justify-between">
                          <Text variant="bodySmall" className="text-gray-500">
                            {formatRelativeTime(notification.timestamp)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
import { axiosInstance } from './axios.config';

export interface Notification {
  id: number;
  user_id: number;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  timestamp: string;
}

class NotificationService {
  /**
   * Récupère les notifications de l'utilisateur
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      console.log('Récupération des notifications...');
      
      // Essayons différents endpoints
      let response;
      try {
        response = await axiosInstance.get('/notifications');
      } catch (error) {
        console.warn('Endpoint /notifications failed, trying /user/notifications');
        try {
          response = await axiosInstance.get('/user/notifications');
        } catch (error2) {
          console.warn('Endpoint /user/notifications failed, trying /data/notifications');
          response = await axiosInstance.get('/data/notifications');
        }
      }
      
      console.log('Réponse notifications:', response.data);
      
      // S'assurer que la réponse est un tableau
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.notifications)) {
        return data.notifications;
      } else {
        console.warn('Format de réponse notifications inattendu:', data);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return []; // Retourner un tableau vide
    }
  }
}

export const notificationService = new NotificationService();
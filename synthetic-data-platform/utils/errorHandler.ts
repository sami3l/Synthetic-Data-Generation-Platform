/**
 * Utilitaires de gestion d'erreur pour l'application
 */
import Toast from 'react-native-toast-message';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ErrorHandler {
  static handleApiError(error: any): ApiError {
    console.error('API Error:', error);

    if (error.response) {
      // Erreur de réponse du serveur
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return {
            message: data.detail || 'Requête invalide',
            status,
            code: 'BAD_REQUEST'
          };
        case 401:
          return {
            message: 'Session expirée. Veuillez vous reconnecter.',
            status,
            code: 'UNAUTHORIZED'
          };
        case 403:
          return {
            message: 'Accès refusé',
            status,
            code: 'FORBIDDEN'
          };
        case 404:
          return {
            message: 'Ressource non trouvée',
            status,
            code: 'NOT_FOUND'
          };
        case 422:
          return {
            message: data.detail || 'Données de validation incorrectes',
            status,
            code: 'VALIDATION_ERROR'
          };
        case 500:
          return {
            message: 'Erreur serveur interne',
            status,
            code: 'SERVER_ERROR'
          };
        default:
          return {
            message: data.detail || `Erreur serveur (${status})`,
            status,
            code: 'UNKNOWN_SERVER_ERROR'
          };
      }
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: 'Erreur de connexion. Vérifiez votre connexion internet.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Erreur de configuration ou autre
      return {
        message: error.message || 'Une erreur inattendue s\'est produite',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  static showErrorToast(error: any, title: string = 'Erreur') {
    const apiError = this.handleApiError(error);
    
    Toast.show({
      type: 'error',
      text1: title,
      text2: apiError.message,
      visibilityTime: 4000,
    });
  }

  static showSuccessToast(message: string, title: string = 'Succès') {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 3000,
    });
  }

  static showInfoToast(message: string, title: string = 'Information') {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 3000,
    });
  }

  static showWarningToast(message: string, title: string = 'Attention') {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      visibilityTime: 3000,
    });
  }
}

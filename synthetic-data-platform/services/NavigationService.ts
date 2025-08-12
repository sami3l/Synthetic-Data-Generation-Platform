// services/NavigationService.ts
import { router } from 'expo-router';

class NavigationService {
  private static instance: NavigationService;

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  public navigateToLogin() {
    try {
      // Rediriger vers l'écran de connexion (dans le groupe auth)
      router.replace('/(auth)/login');
      console.log('🔄 Redirection vers l\'écran de connexion');
    } catch (error) {
      console.error('❌ Erreur lors de la redirection vers le login:', error);
      // Fallback - forcer la navigation
      setTimeout(() => {
        try {
          router.replace('/(auth)/login');
        } catch (retryError) {
          console.error('❌ Erreur lors du retry de redirection:', retryError);
        }
      }, 100);
    }
  }

  public navigateToHome() {
    try {
      router.replace('/');
      console.log('🔄 Redirection vers l\'accueil');
    } catch (error) {
      console.error('❌ Erreur lors de la redirection vers l\'accueil:', error);
    }
  }

  public handleSessionExpired() {
    console.log('🔑 Session expirée détectée, nettoyage et redirection...');
    this.navigateToLogin();
  }
}

export default NavigationService.getInstance();

// hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, initializeUser } from '../features/auth/authSlice';
import { RootState, AppDispatch } from '../store';
// import NavigationService from '../services/NavigationService';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  // Charger l'utilisateur depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          dispatch(initializeUser({ user, token }));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      }
    };

    // Charger seulement si pas déjà connecté
    if (!user) {
      loadUserFromStorage();
    }
  }, [dispatch, user]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await (dispatch(login({ email, password })) as any).unwrap();
      
      // Sauvegarder dans AsyncStorage après login réussi
      if (result.user && result.access_token) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        await AsyncStorage.setItem('token', result.access_token);
      }
      
      return true;
    } catch {
      return false;
    }
  };

  // const handleLogout = async () => {
  //   try {
  //     // Nettoyer le Redux store
  //     dispatch(logout());
      
  //     // Nettoyer AsyncStorage
  //     await AsyncStorage.multiRemove(['token', 'user']);
      
  //     // Rediriger vers la page de connexion
  //     NavigationService.navigateToLogin();
      
  //     console.log('🚪 Déconnexion réussie');
  //   } catch (error) {
  //     console.error('❌ Erreur lors de la déconnexion:', error);
  //     // Même en cas d'erreur, forcer la redirection
  //     NavigationService.navigateToLogin();
  //   }
  // };

  return {
    user,
    loading,
    error,
    login: handleLogin,
    // logout: handleLogout,
  };
};
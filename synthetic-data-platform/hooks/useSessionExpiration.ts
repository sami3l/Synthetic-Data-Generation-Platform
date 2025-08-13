// // hooks/useSessionExpiration.ts
// import { useEffect } from 'react';
// import { useAuth } from './useAuth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NavigationService from '../services/NavigationService';

// export const useSessionExpiration = () => {
//   const { user, logout } = useAuth();

//   useEffect(() => {
//     let timeoutId: ReturnType<typeof setTimeout>;

//     const checkTokenValidity = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
        
//         if (!token) {
//           // Pas de token, pas besoin de vérifier
//           return;
//         }

//         // Décoder le token JWT pour vérifier la date d'expiration
//         const tokenParts = token.split('.');
//         if (tokenParts.length !== 3) {
//           console.warn('⚠️ Token JWT invalide');
//           await handleExpiredSession();
//           return;
//         }

//         try {
//           const payload = JSON.parse(atob(tokenParts[1]));
//           const currentTime = Math.floor(Date.now() / 1000);
          
//           if (payload.exp && payload.exp < currentTime) {
//             console.log('🔑 Token expiré détecté');
//             await handleExpiredSession();
//             return;
//           }

//           // Programmer une vérification avant l'expiration
//           if (payload.exp) {
//             const timeUntilExpiration = (payload.exp - currentTime) * 1000;
//             const checkInterval = Math.min(timeUntilExpiration - 60000, 5 * 60 * 1000); // 1 minute avant expiration ou 5 minutes max
            
//             if (checkInterval > 0) {
//               timeoutId = setTimeout(checkTokenValidity, checkInterval);
//             }
//           }
//         } catch (decodeError) {
//           console.error('❌ Erreur lors du décodage du token:', decodeError);
//         }
//       } catch (error) {
//         console.error('❌ Erreur lors de la vérification du token:', error);
//       }
//     };

//     const handleExpiredSession = async () => {
//       console.log('🔑 Session expirée - déconnexion automatique');
//       try {
//         await AsyncStorage.multiRemove(['token', 'user']);
//         logout();
//         NavigationService.navigateToLogin();
//       } catch (error) {
//         console.error('❌ Erreur lors de la gestion de l\'expiration:', error);
//         NavigationService.navigateToLogin();
//       }
//     };

//     if (user) {
//       checkTokenValidity();
//     }

//     // Nettoyer le timeout si le composant est démonté
//     return () => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//     };
//   }, [user, logout]);
// };

// export default useSessionExpiration;

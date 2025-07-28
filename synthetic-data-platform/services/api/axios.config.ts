// services/api/axios.config.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const baseURL = 'http://192.168.65.39:8000';
export const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true // Important pour l'authentification
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 

// Intercepteur pour gérer les erreurs de manière globale
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Gérer l'expiration du token ou l'authentification invalide
                    console.error('Session expirée ou non autorisée');
                    // Rediriger vers la page de connexion si nécessaire
                    break;
                case 403:
                    console.error('Accès interdit');
                    break;
                case 404:
                    console.error('Ressource non trouvée');
                    break;
                default:
                    console.error('Une erreur est survenue:', error.response.data);
            }
        }
        return Promise.reject(error);
    }
);


export default axiosInstance;
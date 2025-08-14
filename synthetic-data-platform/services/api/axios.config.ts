// services/api/axios.config.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationService from '../NavigationService';


// Variable pour éviter les redirections multiples
let isRedirecting = false;

// Utiliser l'IP correcte de votre machine
const baseURL = 'http://192.168.11.176:8000';

export const axiosInstance = axios.create({
    baseURL,
    timeout: 30000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Instance spéciale pour les requêtes de génération (longues)
export const axiosInstanceLongTimeout = axios.create({
    baseURL,
    timeout: 600000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Log pour debugging
console.log('🌐 Axios configuré avec baseURL:', baseURL);

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      console.log(`🔄 Requête ${config.method?.toUpperCase()} vers ${config.url}`);
      
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour l'instance de génération
axiosInstanceLongTimeout.interceptors.request.use(
  async (config) => {
    try {
      console.log(`🔄 Requête LONGUE ${config.method?.toUpperCase()} vers ${config.url}`);
      
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de manière globale
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Réponse reçue de ${response.config.url}: ${response.status}`);
    return response;
  },
  async (error) => {
    console.error('❌ Erreur intercepteur response:', error);
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Timeout - Le serveur met trop de temps à répondre';
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      error.message = 'Impossible de contacter le serveur';
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      console.log('🔑 Session expirée, redirection vers le login...');
      
      if (!isRedirecting) {
        isRedirecting = true;
        try {
          await AsyncStorage.multiRemove(['token', 'user']);
          // Rediriger vers l'écran de connexion
          NavigationService.navigateToLogin();
          // Remplacer l'erreur par un message plus clair
          error.message = 'Session expired. Please login again.';
          
          // Reset après un délai pour permettre de nouvelles tentatives
          setTimeout(() => {
            isRedirecting = false;
          }, 2000);
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
          isRedirecting = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

// Intercepteur pour l'instance de génération (timeout plus long)
axiosInstanceLongTimeout.interceptors.response.use(
  (response) => {
    console.log(`✅ Réponse LONGUE reçue de ${response.config.url}: ${response.status}`);
    return response;
  },
  async (error) => {
    console.error('❌ Erreur intercepteur response LONGUE:', error);
    
    if (error.code === 'ECONNABORTED') {
      error.message = 'Timeout - La génération a pris plus de 10 minutes';
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      error.message = 'Impossible de contacter le serveur';
    }
    
    if (error.response?.status === 401) {
      console.log('🔑 Session expirée (requête longue), redirection vers le login...');
      
      if (!isRedirecting) {
        isRedirecting = true;
        try {
          await AsyncStorage.multiRemove(['token', 'user']);
          NavigationService.navigateToLogin();
          error.message = 'Session expired. Please login again.';
          
          // Reset après un délai pour permettre de nouvelles tentatives
          setTimeout(() => {
            isRedirecting = false;
          }, 2000);
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
          isRedirecting = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

export const API_BASE_URL = baseURL;
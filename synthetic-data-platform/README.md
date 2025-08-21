# 🧬 Synthetic Data Generation Platform - Frontend

![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue)
![Expo](https://img.shields.io/badge/Expo-~53.0.20-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-NativeWind-blue)

Une application mobile native construite avec React Native et Expo pour la génération de données synthétiques alimentée par l'IA.

## 📱 Vue d'Ensemble

Cette application mobile permet aux utilisateurs de :
- 📊 Uploader des datasets (CSV, Excel)
- 🤖 Générer des données synthétiques avec des modèles AI (CTGAN, TVAE)
- ⚡ Optimiser les hyperparamètres pour de meilleures performances
- 📈 Suivre et gérer les requêtes de génération
- 👥 Interface d'administration pour la gestion des utilisateurs
- 📱 Support multiplateforme (iOS, Android, Web)

## 🏗️ Architecture

### Stack Technologique
- **Framework**: React Native avec Expo
- **Navigation**: Expo Router (file-based routing)
- **État Global**: Redux Toolkit
- **Styling**: NativeWind (TailwindCSS pour React Native)
- **UI Components**: React Native Paper + composants personnalisés
- **HTTP Client**: Axios avec intercepteurs d'authentification
- **Sécurité**: Expo SecureStore pour les tokens
- **Notifications**: Expo Notifications

### Structure du Projet
```
synthetic-data-platform/
├── app/                    # Screens avec expo-router
│   ├── (auth)/            # Écrans d'authentification
│   ├── (tabs)/            # Navigation par onglets
│   ├── admin*/            # Écrans d'administration
│   ├── profile/           # Gestion du profil
│   └── requests/          # Gestion des requêtes
├── components/            # Composants réutilisables
│   ├── admin/            # Composants d'administration
│   ├── ui/               # Composants UI de base
│   └── *.tsx             # Composants fonctionnels
├── services/             # Services et API
│   └── api/              # Clients API
├── store/                # Redux store et slices
├── hooks/                # Hooks personnalisés
├── contexts/             # React contexts
├── utils/                # Utilitaires
├── constants/            # Constantes et configurations
└── types/                # Définitions TypeScript
```

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI: `npm install -g @expo/cli`
- Pour développement mobile:
  - iOS: Xcode (macOS uniquement)
  - Android: Android Studio

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd synthetic-data-platform

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npx expo start
```

### Variables d'Environnement
Créer un fichier `.env` dans le répertoire racine :
```env
# API Backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_API_VERSION=v1

# Configuration Expo
EXPO_PUBLIC_APP_ENV=development
```

## 📱 Fonctionnalités Principales

### 🔐 Authentification
- Connexion/Inscription avec email et mot de passe
- Gestion des tokens JWT avec refresh automatique
- Stockage sécurisé des credentials avec Expo SecureStore
- Protection des routes selon les rôles

**Composants**: `app/(auth)/`, `services/api/authService.ts`

### 📊 Gestion des Datasets
- Upload de fichiers CSV/Excel avec validation
- Prévisualisation des données avec métadonnées
- Gestion des erreurs et feedback utilisateur
- Support de fichiers volumineux (jusqu'à 50MB)

**Composants**: `upload-dataset.tsx`, `components/DatasetManager*.tsx`

### 🤖 Génération de Données Synthétiques
- Configuration des paramètres de génération
- Sélection des modèles AI (CTGAN, TVAE)
- Configuration des hyperparamètres
- Suivi en temps réel du statut de génération

**Composants**: `new-request.tsx`, `components/GenerationConfigComponent.tsx`

### ⚡ Optimisation des Hyperparamètres
- Configuration automatique des paramètres optimaux
- Sélection de métriques d'optimisation
- Suivi du processus d'optimisation
- Résultats détaillés avec métriques

**Composants**: `OptimizationConfigScreen.tsx`, `OptimizationTrackingScreen.tsx`

### 👥 Interface d'Administration
- Gestion des utilisateurs et permissions
- Monitoring des requêtes système
- Analytics et statistiques d'usage
- Logs détaillés des actions

**Composants**: `admin*.tsx`, `components/admin/`, `hooks/useAdminService.ts`

## 🎨 Design System

### Thème et Couleurs
```typescript
// constants/Colors.ts
export const Colors = {
  light: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    // ...
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    // ...
  }
}
```

### Composants UI
- **ThemedText**: Texte adaptatif au thème
- **ThemedView**: Conteneurs adaptatifs
- **Collapsible**: Sections pliables
- **HapticTab**: Onglets avec feedback haptique

## 🔧 Services et API

### Configuration Axios
```typescript
// services/api/axios.config.ts
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Services Disponibles
- **authService**: Authentification et autorisation
- **datasetService**: Gestion des datasets
- **syntheticDataGenerationService**: Génération de données
- **adminService**: Fonctions d'administration
- **statsService**: Statistiques et analytics
- **notificationsService**: Gestion des notifications

## 📱 Navigation

### Structure de Navigation
```typescript
// app/_layout.tsx - Navigation principale
// app/(tabs)/_layout.tsx - Onglets principaux
// app/(auth)/_layout.tsx - Stack d'authentification
```

### Routes Principales
- `/` - Page d'accueil
- `/upload-dataset` - Upload de datasets
- `/new-request` - Nouvelle génération
- `/(tabs)/` - Navigation principale (Accueil, Requêtes, Profil)
- `/admin*` - Interfaces d'administration
- `/(auth)/` - Authentification

## 🎯 État Global (Redux)

### Store Configuration
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import dataSlice from './slices/dataSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    data: dataSlice,
    // ... autres slices
  },
});
```

### Slices Principaux
- **authSlice**: État d'authentification
- **dataSlice**: Données et datasets
- **uiSlice**: État de l'interface utilisateur

## 🧪 Testing

### Scripts de Test
```bash
# Linter et formatage
npm run lint

# Tests unitaires (à configurer)
npm run test

# Test sur différentes plateformes
npm run android
npm run ios
npm run web
```

## 📦 Build et Déploiement

### Builds de Développement
```bash
# Démarrer avec options de plateforme
npx expo start --ios
npx expo start --android
npx expo start --web
```

### Builds de Production
```bash
# Build pour iOS
npx expo build:ios

# Build pour Android
npx expo build:android

# Build pour Web
npx expo export --platform web
```

### Configuration EAS Build
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Configurer EAS
eas login
eas build:configure

# Build de production
eas build --platform all
```

## 🔒 Sécurité

### Bonnes Pratiques
- Tokens stockés dans Expo SecureStore
- Validation côté client et serveur
- Chiffrement HTTPS pour toutes les communications
- Expiration automatique des sessions

### Gestion des Permissions
```typescript
// Vérification des permissions
const checkPermissions = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  // ...
};
```

## 🐛 Debugging et Logging

### Outils de Debug
- **Expo DevTools**: Interface de debugging intégrée
- **Flipper**: Debugging avancé (Android/iOS)
- **React Native Debugger**: Debugging Redux
- **Expo Logs**: Logs en temps réel

### Logging
```typescript
import { logger } from '@/utils/logger';

logger.info('Operation successful', { userId, action });
logger.error('Operation failed', error);
```

## 📚 Documentation

### Ressources Utiles
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Guide](https://reactnative.dev/docs/getting-started)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [NativeWind](https://www.nativewind.dev/)

### APIs Internes
- Voir `services/api/` pour la documentation des APIs
- Voir `types/` pour les interfaces TypeScript
- Voir `hooks/` pour les hooks personnalisés

## 🤝 Contribution

### Workflow de Développement
1. Créer une branche feature: `git checkout -b feature/nouvelle-fonctionnalite`
2. Développer avec tests
3. Commits conventionnels: `feat:`, `fix:`, `docs:`
4. Pull request avec review

### Standards de Code
- ESLint + Prettier configurés
- TypeScript strict mode
- Conventions de nommage cohérentes
- Documentation des composants complexes

## 📈 Performance

### Optimisations
- Lazy loading des écrans
- Memoization des composants lourds
- Optimisation des images avec Expo Image
- Bundle splitting automatique

### Monitoring
- Crash reporting avec Expo
- Performance metrics
- Analytics d'usage utilisateur

---

## 🔗 Liens Backend

Cette application frontend communique avec le backend FastAPI. Voir le README du backend pour :
- Configuration de l'API
- Documentation des endpoints
- Variables d'environnement requises
- Base de données et migrations

**Repository Backend**: `synth-backend/README.md`

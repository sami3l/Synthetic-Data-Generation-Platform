import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminService, User, UserProfile } from '../services/api/adminService';

const AdminUserDetail: React.FC = () => {
  const { userId, username, email, role, isActive } = useLocalSearchParams();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reconstruire l'objet User à partir des paramètres
  const user: User = {
    id: parseInt(userId as string),
    username: username as string,
    email: email as string,
    role: role as string,
    is_active: isActive === 'true'
  };

  const loadUserProfile = useCallback(async () => {
    try {
      console.log('Loading profile for user:', userId);
      const profile = await adminService.getUserProfile(parseInt(userId as string));
      console.log('Profile loaded:', profile);
      setUserProfile(profile);
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      Alert.alert('Erreur', 'Impossible de charger le profil utilisateur');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const toggleUserActive = async () => {
    setActionLoading(true);
    try {
      await adminService.updateUserActive(user.id, !user.is_active);
      Alert.alert(
        'Succès', 
        `Utilisateur ${!user.is_active ? 'activé' : 'désactivé'} avec succès`,
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le statut de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const changeUserRole = async (newRole: string) => {
    setActionLoading(true);
    try {
      await adminService.updateUserRole(user.id, newRole);
      Alert.alert('Succès', `Rôle modifié vers ${newRole}`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le rôle');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async () => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminService.deleteUser(user.id);
              Alert.alert('Succès', 'Utilisateur supprimé', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          
       
          <Text className="text-2xl font-bold text-gray-900 flex-1">
            Détails Utilisateur
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Informations de base */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="font-semibold text-gray-700 mb-3 text-lg">
            Informations de base
          </Text>
          <View className="space-y-3">
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-24">ID:</Text>
              <Text className="text-gray-600 flex-1">{user.id}</Text>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-24">Email:</Text>
              <Text className="text-gray-600 flex-1">{user.email}</Text>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-24">Username:</Text>
              <Text className="text-gray-600 flex-1">{user.username || 'Non défini'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="font-medium text-gray-700 w-24">Rôle:</Text>
              <View className={`px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                <Text className="text-xs font-medium">{user.role}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Text className="font-medium text-gray-700 w-24">Statut:</Text>
              <View className={`px-2 py-1 rounded-full ${getStatusColor(user.is_active)}`}>
                <Text className="text-xs font-medium">
                  {user.is_active ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profil détaillé */}
        {userProfile && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="font-semibold text-gray-700 mb-3 text-lg">
             Profil détaillé
            </Text>
            <View className="space-y-3">
              <View className="flex-row">
                <Text className="font-medium text-gray-700 w-28">Nom complet:</Text>
                <Text className="text-gray-600 flex-1">
                  {userProfile.full_name || 'Non défini'}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="font-medium text-gray-700 w-28">Organisation:</Text>
                <Text className="text-gray-600 flex-1">
                  {userProfile.organization || 'Non défini'}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="font-medium text-gray-700 w-28">Usage prévu:</Text>
                <Text className="text-gray-600 flex-1">
                  {userProfile.usage_purpose || 'Non défini'}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="font-medium text-gray-700 w-28">Créé le:</Text>
                <Text className="text-gray-600 flex-1">
                  {new Date(userProfile.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="font-medium text-gray-700 w-28">Dernière MAJ:</Text>
                <Text className="text-gray-600 flex-1">
                  {new Date(userProfile.updated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Statistiques d'activité */}
        <View className="bg-blue-50 rounded-lg p-4 mb-4">
          <Text className="font-semibold text-blue-800 mb-3 text-lg">
             Statistiques d&apos;activité
          </Text>
          <View className="flex-row justify-between mb-3">
            <View className="bg-white rounded-lg p-3 flex-1 mr-2">
              <Text className="text-2xl font-bold text-blue-600">0</Text>
              <Text className="text-xs text-gray-600">Requêtes créées</Text>
            </View>
            <View className="bg-white rounded-lg p-3 flex-1 mx-1">
              <Text className="text-2xl font-bold text-green-600">0</Text>
              <Text className="text-xs text-gray-600">Requêtes approuvées</Text>
            </View>
            <View className="bg-white rounded-lg p-3 flex-1 ml-2">
              <Text className="text-2xl font-bold text-purple-600">0</Text>
              <Text className="text-xs text-gray-600">Datasets générés</Text>
            </View>
          </View>
        </View>

        {/* Actions administratives */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="font-semibold text-gray-700 mb-3 text-lg">
            Actions administratives
          </Text>
          
          {/* Changer le rôle */}
          <View className="flex-row space-x-2 mb-3">
            <TouchableOpacity
              onPress={() => changeUserRole('admin')}
              disabled={actionLoading || user.role === 'admin'}
              className={`flex-1 p-3 rounded-lg ${
                user.role === 'admin' 
                  ? 'bg-gray-200' 
                  : 'bg-red-100'
              }`}
            >
              <Text className={`text-center font-medium ${
                user.role === 'admin' 
                  ? 'text-gray-500' 
                  : 'text-red-700'
              }`}>
                Faire Admin
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => changeUserRole('user')}
              disabled={actionLoading || user.role === 'user'}
              className={`flex-1 p-3 rounded-lg ${
                user.role === 'user' 
                  ? 'bg-gray-200' 
                  : 'bg-blue-100'
              }`}
            >
              <Text className={`text-center font-medium ${
                user.role === 'user' 
                  ? 'text-gray-500' 
                  : 'text-blue-700'
              }`}>
                Faire User
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toggle activation */}
          <TouchableOpacity
            onPress={toggleUserActive}
            disabled={actionLoading}
            className={`p-3 rounded-lg mb-3 ${
              user.is_active ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            <Text className={`text-center font-medium ${
              user.is_active ? 'text-red-700' : 'text-green-700'
            }`}>
              {user.is_active ? 'Désactiver' : 'Activer'} l&apos;utilisateur
            </Text>
          </TouchableOpacity>

          {/* Supprimer */}
          <TouchableOpacity
            onPress={deleteUser}
            disabled={actionLoading}
            className="p-3 bg-red-600 rounded-lg"
          >
            <Text className="text-center font-medium text-white">
              Supprimer l&apos;utilisateur
            </Text>
          </TouchableOpacity>

          {actionLoading && (
            <View className="items-center mt-4">
              <ActivityIndicator color="#3B82F6" />
              <Text className="text-gray-600 mt-2">Traitement en cours...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminUserDetail;

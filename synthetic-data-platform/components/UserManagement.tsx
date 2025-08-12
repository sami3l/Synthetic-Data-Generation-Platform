import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { adminService, User } from '../services/api/adminService';

const UserManagement: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers({
        search: searchQuery,
        role: roleFilter,
        limit: 50
      });
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleSearch = () => {
    setLoading(true);
    loadUsers();
  };

  const openUserDetail = (user: User) => {
    // Navigation vers la page de détail avec les paramètres
    router.push({
      pathname: '/admin-user-detail',
      params: {
        userId: user.id.toString(),
        username: user.username || '',
        email: user.email,
        role: user.role,
        isActive: user.is_active.toString()
      }
    });
  };

  const toggleUserActive = async (user: User) => {
    setActionLoading(true);
    try {
      await adminService.updateUserActive(user.id, !user.is_active);
      Alert.alert(
        'Succès', 
        `Utilisateur ${!user.is_active ? 'activé' : 'désactivé'} avec succès`
      );
      loadUsers();
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le statut de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (user: User) => {
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
              Alert.alert('Succès', 'Utilisateur supprimé');
              loadUsers();
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

  useEffect(() => {
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter]); // Dépendances appropriées

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
        <Text className="mt-4 text-gray-600">Chargement des utilisateurs...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
        {/* Header avec recherche */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Gestion des Utilisateurs
          </Text>
          
          {/* Barre de recherche */}
          <View className="flex-row mb-3">
            <TextInput
              className="flex-1 bg-gray-100 rounded-lg px-4 py-3 mr-2"
              placeholder="Rechercher par email ou nom d'utilisateur..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              onPress={handleSearch}
              className="bg-blue-200 rounded-lg px-4 py-3 justify-center"
            >
              <Text className="text-blue-600 font-semibold">🔍</Text>
            </TouchableOpacity>
          </View>

          {/* Filtres par rôle */}
          <View className="flex-row">
            {['', 'admin', 'user'].map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => {
                  setRoleFilter(role);
                  setLoading(true);
                  loadUsers();
                }}
                className={`mr-2 px-4 py-2 rounded-lg ${
                  roleFilter === role 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }`}
              >
                <Text className={`font-medium ${
                  roleFilter === role ? 'text-white' : 'text-gray-700'
                }`}>
                  {role || 'Tous'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Liste des utilisateurs */}
        <ScrollView
          className="flex-1 p-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              onPress={() => openUserDetail(user)}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {user.username || 'Sans nom'}
                  </Text>
                  <Text className="text-gray-600 mt-1">{user.email}</Text>
                  
                  <View className="flex-row mt-2">
                    <View className={`px-2 py-1 rounded-full mr-2 ${getRoleColor(user.role)}`}>
                      <Text className="text-xs font-medium">{user.role}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${getStatusColor(user.is_active)}`}>
                      <Text className="text-xs font-medium">
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions rapides */}
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => toggleUserActive(user)}
                    disabled={actionLoading}
                    className={`p-2 rounded-lg mr-2 ${
                      user.is_active ? 'bg-red-100' : 'bg-green-100'
                    }`}
                  >
                    <Text className="text-xs">
                      {user.is_active ? '🚫 Désactiver' : '✅ Activer'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => deleteUser(user)}
                    disabled={actionLoading}
                    className="p-2 bg-red-100 rounded-lg"
                  >
                    <Text className="text-xs">🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {users.length === 0 && (
            <View className="bg-white rounded-lg p-8 items-center">
              <Text className="text-gray-500 text-lg">Aucun utilisateur trouvé</Text>
            </View>
          )}
        </ScrollView>
      </View>
  );
};

export default UserManagement;

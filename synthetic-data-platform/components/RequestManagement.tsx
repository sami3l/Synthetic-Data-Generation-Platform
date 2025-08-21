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
import { adminService, DataRequest } from '../services/api/adminService';

const RequestManagement: React.FC = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await adminService.getRequests({
        search: searchQuery,
        status: statusFilter,
        limit: 50
      });
      setRequests(data);
    } catch (err) {
      console.error('Erreur lors du chargement des requêtes:', err);
      Alert.alert('Erreur', 'Impossible de charger les requêtes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleSearch = () => {
    setLoading(true);
    loadRequests();
  };

  const openRequestDetail = (request: DataRequest) => {
    // Navigation vers la page de détail avec les paramètres
    router.push({
      pathname: '/admin-request-detail',
      params: {
        requestId: request.id.toString(),
        requestName: request.request_name,
        datasetName: request.dataset_name,
        status: request.status,
        userId: request.user_id.toString(),
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        approvedBy: request.approved_by?.toString() || '',
        approvedAt: request.approved_at || '',
        rejectionReason: request.rejection_reason || ''
      }
    });
  };

  const quickApprove = async (request: DataRequest) => {
    //check if the device is phone 
    Alert.alert(
      'Approbation rapide',
      `Approuver rapidement la requête "${request.request_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminService.approveRequest(request.id);
              Alert.alert('Succès', 'Requête approuvée avec succès');
              loadRequests();
            } catch {
              Alert.alert('Erreur', 'Impossible d\'approuver la requête');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const quickReject = async (request: DataRequest) => {
    Alert.alert(
      'Rejet rapide',
      `Rejeter la requête "${request.request_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminService.rejectRequest(request.id, 'Rejet rapide depuis la liste');
              Alert.alert('Succès', 'Requête rejetée');
              loadRequests();
            } catch {
              Alert.alert('Erreur', 'Impossible de rejeter la requête');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      case 'processing': return 'En traitement';
      case 'completed': return 'Terminée';
      case 'failed': return 'Échouée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Chargement des requêtes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header avec recherche */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Gestion des Requêtes
        </Text>
        
        {/* Barre de recherche */}
        <View className="flex-row mb-3">
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-4 py-3 mr-2"
            placeholder="Rechercher par nom de requête ou dataset..."
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

        {/* Filtres par statut */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {['', 'pending', 'approved', 'rejected', 'processing', 'completed', 'failed'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  setStatusFilter(status);
                  setLoading(true);
                  loadRequests();
                }}
                className={`mr-2 px-4 py-2 rounded-lg ${
                  statusFilter === status 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200'
                }`}
              >
                <Text className={`font-medium ${
                  statusFilter === status ? 'text-white' : 'text-gray-700'
                }`}>
                  {status ? getStatusText(status) : 'Tous'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Liste des requêtes */}
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.map((request) => (
          <TouchableOpacity
            key={request.id}
            onPress={() => openRequestDetail(request)}
            className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {request.request_name}
                </Text>
                <Text className="text-gray-600 mt-1">{request.dataset_name}</Text>
                
                <View className="flex-row mt-2 items-center">
                  <View className={`px-2 py-1 rounded-full mr-2 ${getStatusColor(request.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(request.status)}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">
                    ID: {request.id} • User: {request.user_id}
                  </Text>
                </View>

                <Text className="text-xs text-gray-500 mt-1">
                  Créée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              {/* Actions rapides pour les requêtes en attente */}
              {request.status === 'pending' && (
                <View className="flex-row ml-2">
                  <TouchableOpacity
                    onPress={() => quickApprove(request)}
                    disabled={actionLoading}
                    className="p-2 bg-green-100 rounded-lg mr-2"
                  >
                    <Text className="text-xs">✅ Approve</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => quickReject(request)}
                    disabled={actionLoading}
                    className="p-2 bg-red-100 rounded-lg"
                  >
                    <Text className="text-xs">❌ Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Affichage raison de rejet si applicable */}
            {request.status === 'rejected' && request.rejection_reason && (
              <View className="mt-2 p-2 bg-red-50 rounded border-l-4 border-red-200">
                <Text className="text-xs text-red-700 font-medium">Raison du rejet:</Text>
                <Text className="text-xs text-red-600">{request.rejection_reason}</Text>
              </View>
            )}

            {/* Affichage info d'approbation si applicable */}
            {request.status === 'approved' && request.approved_at && (
              <View className="mt-2 p-2 bg-green-50 rounded border-l-4 border-green-200">
                <Text className="text-xs text-green-700">
                  Approuvée le {new Date(request.approved_at).toLocaleDateString('fr-FR')}
                  {request.approved_by && ` par l'admin ${request.approved_by}`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {requests.length === 0 && (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-gray-500 text-lg">Aucune requête trouvée</Text>
          </View>
        )}
      </ScrollView>

      {actionLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-30 justify-center items-center">
          <View className="bg-white rounded-lg p-4">
            <ActivityIndicator color="#3B82F6" />
            <Text className="text-gray-600 mt-2">Traitement en cours...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default RequestManagement;

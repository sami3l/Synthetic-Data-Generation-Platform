import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminService, DataRequest } from '../services/api/adminService';

const AdminRequestDetail: React.FC = () => {
  const { 
    requestId, 
    requestName, 
    datasetName, 
    status, 
    userId, 
    createdAt, 
    updatedAt,
    approvedBy,
    approvedAt,
    rejectionReason 
  } = useLocalSearchParams();
  
  const router = useRouter();
  const [requestDetail, setRequestDetail] = useState<DataRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Reconstruire l'objet DataRequest à partir des paramètres
  const request: DataRequest = {
    id: parseInt(requestId as string),
    user_id: parseInt(userId as string),
    request_name: requestName as string,
    dataset_name: datasetName as string,
    status: status as 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed',
    created_at: createdAt as string,
    updated_at: updatedAt as string,
    approved_by: approvedBy ? parseInt(approvedBy as string) : undefined,
    approved_at: (approvedAt as string) || undefined,
    rejection_reason: (rejectionReason as string) || undefined,
  };

  const loadRequestDetail = useCallback(async () => {
    try {
      console.log('Loading request detail for:', requestId);
      const detail = await adminService.getRequestDetail(parseInt(requestId as string));
      console.log('Request detail loaded:', detail);
      setRequestDetail(detail);
    } catch (err) {
      console.error('Erreur lors du chargement du détail:', err);
      Alert.alert('Erreur', 'Impossible de charger les détails de la requête');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequestDetail();
  }, [loadRequestDetail]);

  const approveRequest = async () => {
    Alert.alert(
      'Confirmer l&apos;approbation',
      `Êtes-vous sûr de vouloir approuver la requête "${request.request_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminService.approveRequest(request.id);
              Alert.alert('Succès', 'Requête approuvée avec succès', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch {
              Alert.alert('Erreur', 'Impossible d&apos;approuver la requête');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectRequest = async () => {
    if (!rejectionReasonInput.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer une raison de rejet');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.rejectRequest(request.id, rejectionReasonInput);
      Alert.alert('Succès', 'Requête rejetée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      setShowRejectModal(false);
      setRejectionReasonInput('');
    } catch {
      Alert.alert('Erreur', 'Impossible de rejeter la requête');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRequest = async () => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la requête "${request.request_name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminService.deleteRequest(request.id);
              Alert.alert('Succès', 'Requête supprimée', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer la requête');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

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
        <Text className="mt-4 text-gray-600">Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Text className="text-2xl font-bold text-gray-900 flex-1">
            Détails Requête
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
              <Text className="font-medium text-gray-700 w-32">ID:</Text>
              <Text className="text-gray-600 flex-1">{request.id}</Text>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-32">Nom requête:</Text>
              <Text className="text-gray-600 flex-1">{request.request_name}</Text>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-32">Dataset:</Text>
              <Text className="text-gray-600 flex-1">{request.dataset_name}</Text>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-32">Utilisateur:</Text>
              <Text className="text-gray-600 flex-1">ID: {request.user_id}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="font-medium text-gray-700 w-32">Statut:</Text>
              <View className={`px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                <Text className="text-xs font-medium">{getStatusText(request.status)}</Text>
              </View>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-32">Créée le:</Text>
              <Text className="text-gray-600 flex-1">
                {new Date(request.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View className="flex-row">
              <Text className="font-medium text-gray-700 w-32">Modifiée le:</Text>
              <Text className="text-gray-600 flex-1">
                {new Date(request.updated_at).toLocaleDateString('fr-FR', {
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

        {/* Détails d'approbation */}
        {(request.status === 'approved' || request.status === 'rejected') && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="font-semibold text-gray-700 mb-3 text-lg">
              {request.status === 'approved' ? '✅ Approbation' : '❌ Rejet'}
            </Text>
            <View className="space-y-3">
              {request.approved_by && (
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">
                    {request.status === 'approved' ? 'Approuvée par:' : 'Rejetée par:'}
                  </Text>
                  <Text className="text-gray-600 flex-1">Admin ID: {request.approved_by}</Text>
                </View>
              )}
              {request.approved_at && (
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Date:</Text>
                  <Text className="text-gray-600 flex-1">
                    {new Date(request.approved_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}
              {request.rejection_reason && (
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Raison:</Text>
                  <Text className="text-gray-600 flex-1">{request.rejection_reason}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Détails détaillés si disponibles */}
        {requestDetail && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="font-semibold text-gray-700 mb-3 text-lg">
              Détails supplémentaires
            </Text>
            <View className="space-y-2">
              {/* Ici vous pouvez ajouter d'autres champs spécifiques au requestDetail */}
              <Text className="text-gray-600">
                Nom du dataset: {requestDetail.dataset_name}
              </Text>
              <Text className="text-gray-600">
                Approved by : {requestDetail.approved_by}
              </Text>
                {/* Ajoutez d'autres champs pertinents ici */}

            </View>
          </View>
        )}

        {/* Statistiques de traitement */}
        <View className="bg-blue-50 rounded-lg p-4 mb-4">
          <Text className="font-semibold text-blue-800 mb-3 text-lg">
            Statistiques de traitement
          </Text>
          <View className="flex-row justify-between mb-3">
            <View className="bg-white rounded-lg p-3 flex-1 mr-2">
              <Text className="text-2xl font-bold text-blue-600">Soon</Text>
              <Text className="text-xs text-gray-600">Lignes générées</Text>
            </View>
            <View className="bg-white rounded-lg p-3 flex-1 mx-1">
              <Text className="text-2xl font-bold text-green-600">Soon</Text>
              <Text className="text-xs text-gray-600">Qualité données</Text>
            </View>
            <View className="bg-white rounded-lg p-3 flex-1 ml-2">
              <Text className="text-2xl font-bold text-purple-600">Soon</Text>
              <Text className="text-xs text-gray-600">Temps traitement</Text>
            </View>
          </View>
        </View>

        {/* Actions administratives */}
        {request.status === 'pending' && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="font-semibold text-gray-700 mb-3 text-lg">
            Actions administratives
            </Text>
            
            {/* Approuver */}
            <TouchableOpacity
              onPress={approveRequest}
              disabled={actionLoading}
              className="p-3 bg-green-100 rounded-lg mb-3"
            >
              <Text className="text-center font-medium text-green-700">
                Approuver la requête
              </Text>
            </TouchableOpacity>

            {/* Rejeter */}
            <TouchableOpacity
              onPress={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="p-3 bg-red-100 rounded-lg mb-3"
            >
              <Text className="text-center font-medium text-red-700">
                Rejeter la requête
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions de suppression (toujours disponible pour admin) */}
          <TouchableOpacity
            onPress={deleteRequest}
            disabled={actionLoading}
            className="p-3 bg-red-600 rounded-lg"
          >
            <Text className="text-center font-medium text-white">
              Supprimer la requête
            </Text>
          </TouchableOpacity>

        {actionLoading && (
          <View className="items-center mt-4">
            <ActivityIndicator color="#3B82F6" />
            <Text className="text-gray-600 mt-2">Traitement en cours...</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de rejet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRejectModal}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg p-6 m-4 w-4/5">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Rejeter la requête
            </Text>
            <Text className="text-gray-600 mb-4">
              Veuillez indiquer la raison du rejet :
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 h-24"
              placeholder="Raison du rejet..."
              value={rejectionReasonInput}
              onChangeText={setRejectionReasonInput}
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                className="flex-1 p-3 bg-gray-200 rounded-lg"
              >
                <Text className="text-center font-medium text-gray-700">
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRejectRequest}
                disabled={actionLoading}
                className="flex-1 p-3 bg-red-600 rounded-lg"
              >
                <Text className="text-center font-medium text-white">
                  Rejeter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminRequestDetail;

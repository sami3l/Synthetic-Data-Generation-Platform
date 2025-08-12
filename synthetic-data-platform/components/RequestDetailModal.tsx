import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { DataRequest } from '../services/api/adminService';

interface RequestDetailModalProps {
  visible: boolean;
  onClose: () => void;
  request: DataRequest | null;
  onAction: (action: string, request: DataRequest) => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  visible,
  onClose,
  request,
  onAction
}) => {
  if (!request) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ En attente';
      case 'approved': return '✅ Approuvée';
      case 'rejected': return '❌ Rejetée';
      case 'processing': return '🔄 En traitement';
      case 'completed': return '✅ Terminée';
      case 'failed': return '❌ Échouée';
      default: return status;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'approved': return 25;
      case 'processing': return 60;
      case 'completed': return 100;
      case 'rejected':
      case 'failed': return 0;
      default: return 0;
    }
  };

  const handleAction = (action: string) => {
    Alert.alert(
      'Confirmer l\'action',
      `Êtes-vous sûr de vouloir ${action} cette requête ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => onAction(action, request)
        }
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-5/6">
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text className="text-2xl font-bold text-gray-900">
              Détails de la requête
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <Text className="text-gray-600 text-xl">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Statut et progression */}
            <View className="bg-blue-50 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-blue-800">
                  📊 Statut actuel
                </Text>
                <View className={`px-3 py-1 rounded-full ${getStatusColor(request.status)}`}>
                  <Text className="text-sm font-medium">
                    {getStatusText(request.status)}
                  </Text>
                </View>
              </View>
              
              {/* Barre de progression */}
              <View className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Progression</Text>
                  <Text className="text-sm text-blue-600 font-medium">
                    {getProgressPercentage(request.status)}%
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full">
                  <View 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${getProgressPercentage(request.status)}%` }}
                  ></View>
                </View>
              </View>

              <Text className="text-sm text-gray-600">
                {request.status === 'pending' && 'En attente d\'approbation administrateur'}
                {request.status === 'approved' && 'Prêt pour le traitement'}
                {request.status === 'processing' && 'Génération des données en cours...'}
                {request.status === 'completed' && 'Dataset synthétique généré avec succès'}
                {request.status === 'rejected' && 'Requête rejetée par un administrateur'}
                {request.status === 'failed' && 'Échec lors de la génération'}
              </Text>
            </View>

            {/* Informations principales */}
            <View className="bg-gray-50 rounded-2xl p-4 mb-4">
              <Text className="font-bold text-gray-700 mb-3">
                📋 Informations générales
              </Text>
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">ID:</Text>
                  <Text className="text-gray-600 flex-1">#{request.id}</Text>
                </View>
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Nom:</Text>
                  <Text className="text-gray-600 flex-1 font-medium">
                    {request.request_name}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Dataset:</Text>
                  <Text className="text-gray-600 flex-1">
                    {request.dataset_name}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Utilisateur:</Text>
                  <Text className="text-gray-600 flex-1">
                    ID #{request.user_id}
                  </Text>
                </View>
              </View>
            </View>

            {/* Dates importantes */}
            <View className="bg-green-50 rounded-2xl p-4 mb-4">
              <Text className="font-bold text-green-800 mb-3">
                📅 Chronologie
              </Text>
              <View className="space-y-3">
                <View className="flex-row items-start">
                  <View className="w-3 h-3 bg-blue-500 rounded-full mt-1 mr-3"></View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-700">Requête créée</Text>
                    <Text className="text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </Text>
                  </View>
                </View>
                
                {request.approved_at && (
                  <View className="flex-row items-start">
                    <View className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3"></View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-700">Approuvée</Text>
                      <Text className="text-sm text-gray-500">
                        {formatDate(request.approved_at)}
                        {request.approved_by && ` • Admin #${request.approved_by}`}
                      </Text>
                    </View>
                  </View>
                )}
                
                {request.status === 'processing' && (
                  <View className="flex-row items-start">
                    <View className="w-3 h-3 bg-yellow-500 rounded-full mt-1 mr-3 animate-pulse"></View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-700">En traitement</Text>
                      <Text className="text-sm text-gray-500">
                        Temps estimé restant: 15 minutes
                      </Text>
                    </View>
                  </View>
                )}
                
                {request.status === 'completed' && (
                  <View className="flex-row items-start">
                    <View className="w-3 h-3 bg-purple-500 rounded-full mt-1 mr-3"></View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-700">Terminée</Text>
                      <Text className="text-sm text-gray-500">
                        Fichier disponible au téléchargement
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Paramètres techniques */}
            <View className="bg-purple-50 rounded-2xl p-4 mb-4">
              <Text className="font-bold text-purple-800 mb-3">
                ⚙️ Paramètres techniques
              </Text>
              <View className="space-y-2">
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Algorithme:</Text>
                  <Text className="text-gray-600 flex-1">GAN (par défaut)</Text>
                </View>
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Échantillons:</Text>
                  <Text className="text-gray-600 flex-1">1,000 lignes</Text>
                </View>
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Format:</Text>
                  <Text className="text-gray-600 flex-1">CSV</Text>
                </View>
                <View className="flex-row">
                  <Text className="font-medium text-gray-700 w-32">Taille estimée:</Text>
                  <Text className="text-gray-600 flex-1">
                    {request.status === 'completed' ? '2.4 MB' : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rejet (si applicable) */}
            {request.rejection_reason && (
              <View className="bg-red-50 rounded-2xl p-4 mb-4">
                <Text className="font-bold text-red-800 mb-2">
                  ❌ Raison du rejet
                </Text>
                <Text className="text-gray-700 bg-white p-3 rounded-lg">
                  {request.rejection_reason}
                </Text>
              </View>
            )}

            {/* Fichier résultat */}
            {request.status === 'completed' && (
              <View className="bg-yellow-50 rounded-2xl p-4 mb-4">
                <Text className="font-bold text-yellow-800 mb-3">
                  📁 Fichier généré
                </Text>
                <View className="flex-row items-center justify-between bg-white p-3 rounded-lg">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-700">
                      synthetic_{request.dataset_name}.csv
                    </Text>
                    <Text className="text-sm text-gray-500">
                      2.4 MB • Généré le {formatDate(request.updated_at)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleAction('Télécharger')}
                    className="bg-blue-500 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-white font-medium text-sm">
                      📥 Télécharger
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Actions administratives */}
            <View className="space-y-3">
              <Text className="font-bold text-gray-700 mb-3">
                🛠️ Actions administratives
              </Text>
              
              {request.status === 'pending' && (
                <>
                  <TouchableOpacity
                    onPress={() => handleAction('Approuver')}
                    className="p-4 bg-green-100 rounded-lg border border-green-200"
                  >
                    <Text className="text-center font-medium text-green-700">
                      ✅ Approuver cette requête
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAction('Rejeter')}
                    className="p-4 bg-red-100 rounded-lg border border-red-200"
                  >
                    <Text className="text-center font-medium text-red-700">
                      ❌ Rejeter cette requête
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {request.status === 'approved' && (
                <TouchableOpacity
                  onPress={() => handleAction('Lancer le traitement')}
                  className="p-4 bg-blue-100 rounded-lg border border-blue-200"
                >
                  <Text className="text-center font-medium text-blue-700">
                    ▶️ Lancer le traitement
                  </Text>
                </TouchableOpacity>
              )}

              {request.status === 'processing' && (
                <TouchableOpacity
                  onPress={() => handleAction('Arrêter le traitement')}
                  className="p-4 bg-orange-100 rounded-lg border border-orange-200"
                >
                  <Text className="text-center font-medium text-orange-700">
                    ⏸️ Arrêter le traitement
                  </Text>
                </TouchableOpacity>
              )}

              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => handleAction('Contacter l\'utilisateur')}
                  className="flex-1 p-3 bg-blue-100 rounded-lg"
                >
                  <Text className="text-center font-medium text-blue-700">
                    📧 Contacter
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleAction('Dupliquer')}
                  className="flex-1 p-3 bg-gray-100 rounded-lg"
                >
                  <Text className="text-center font-medium text-gray-700">
                    📋 Dupliquer
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => handleAction('Supprimer')}
                className="p-3 bg-red-600 rounded-lg"
              >
                <Text className="text-center font-medium text-white">
                  🗑️ Supprimer définitivement
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default RequestDetailModal;

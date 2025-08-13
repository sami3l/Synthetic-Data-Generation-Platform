import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  Card, 
  ActivityIndicator,
  Chip,
  IconButton,
} from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '@/services/api/authService';
import { ErrorHandler } from '@/utils/errorHandler';

interface Request {
  id: number;
  request_name?: string;
  dataset_name?: string;
  parameters?: { 
    model_type?: string; 
    sample_size?: number;
  };
  status: string;
  created_at: string;
}

const RequestsScreen = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await authService.getRequests();
      
      const normalizedRequests = (response || []).map((request: any) => ({
        ...request,
        parameters: request.parameters || request.request_parameters || {},
        request_name: request.request_name || `Requête #${request.id}`,
        dataset_name: request.dataset_name || request.uploaded_dataset?.original_filename || 'Dataset non spécifié',
      }));
      
      setRequests(normalizedRequests);
    } catch (error) {
      console.error('Erreur lors du chargement des requêtes:', error);
      ErrorHandler.showErrorToast(error, 'Erreur de chargement');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDeleteRequest = async (requestId: number) => {
    try {
      await authService.deleteRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      ErrorHandler.showSuccessToast('Requête supprimée avec succès');
    } catch (error) {
      ErrorHandler.showErrorToast(error, 'Erreur de suppression');
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pending': '#f59e0b',        // Orange - En attente d'approbation
      'approved': '#10b981',       // Vert - Approuvé, prêt à générer
      'processing': '#3b82f6',     // Bleu - En cours de génération
      'completed': '#059669',      // Vert foncé - Terminé avec succès
      'failed': '#ef4444',         // Rouge - Échoué
      'cancelled': '#6b7280',      // Gris - Annulé
      'rejected': '#dc2626',       // Rouge foncé - Rejeté par admin
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'approved': 'Approuvé',
      'processing': 'En cours',
      'completed': 'Terminé',
      'failed': 'Échoué',
      'cancelled': 'Annulé',
      'rejected': 'Rejeté',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-gray-600">Chargement des requêtes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 mt-10">
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <Text variant="headlineSmall" className="font-bold text-gray-900">
          Mes Requêtes ({requests.length})
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRequests(true)}
          />
        }
      >
        {requests.length === 0 ? (
          <Card className="mt-4">
            <Card.Content className="items-center py-8">
              <Text variant="titleLarge" className="text-gray-800 font-bold mb-2">
                Aucune requête
              </Text>
              <Text variant="bodyMedium" className="text-gray-600 text-center">
                Vous n&apos;avez pas encore créé de requête de génération.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          requests.map(request => (
            <TouchableOpacity 
              key={request.id} 
              onPress={() => router.push(`/requests/${request.id}`)}
              activeOpacity={0.7}
            >
              <Card className="mb-3 bg-white">
                <Card.Content className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <Text variant="titleMedium" className="flex-1 font-semibold text-gray-900 mr-2">
                      {request.request_name || `Requête #${request.id}`}
                    </Text>
                    <Chip
                      mode="outlined"
                      textStyle={{ fontSize: 12 }}
                      style={{
                        backgroundColor: getStatusColor(request.status) + '20',
                        borderColor: getStatusColor(request.status),
                      }}
                    >
                      {getStatusLabel(request.status)}
                    </Chip>
                  </View>
                  
                  <View className="mb-3">
                    <Text variant="bodySmall" className="text-gray-600 mb-1">
                      📊 Dataset: {request.dataset_name}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text variant="bodySmall" className="text-gray-500">
                      🕒 {formatDate(request.created_at)}
                    </Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(request.id);
                      }}
                    />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
{/* 
      <FAB
        icon="plus"
        className="absolute bottom-4 right-4"
        onPress={() => router.push('/new-request')}
        label="Nouvelle requête"
      /> */}
    </SafeAreaView>
  );
};

export default RequestsScreen;

import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  RefreshControl,
  Linking
} from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Icon,
  ActivityIndicator,
  Chip,
  FAB,
  Searchbar
} from 'react-native-paper';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '@/services/api/authService';
import { dataService } from '@/services/api/dataService';
import { statsService } from '@/services/api/statsService';

interface DataRequest {
  id: number;
  request_name: string;
  dataset_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_id: number;
  request_parameters?: any;
}

interface RequestsState {
  requests: DataRequest[];
  isLoading: boolean;
  isRefreshing: boolean;
  searchQuery: string;
}

export default function RequestsScreen() {
  const [state, setState] = useState<RequestsState>({
    requests: [],
    isLoading: true,
    isRefreshing: false,
    searchQuery: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (refresh = false) => {
    try {
      if (refresh) {
        setState(prev => ({ ...prev, isRefreshing: true }));
      } else {
        setState(prev => ({ ...prev, isLoading: true }));
      }

      const requests = await authService.getRequests();
      
      setState(prev => ({ 
        ...prev, 
        requests,
        isLoading: false,
        isRefreshing: false
      }));

    } catch (error: any) {
      console.error('Erreur lors du chargement des requêtes:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les requêtes'
      });
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isRefreshing: false
      }));
    }
  };

  const handleRequestPress = (request: DataRequest) => {
    router.push(`/requests/${request.id}`);
  };

  const handleDownload = async (request: DataRequest) => {
    if (request.status !== 'completed') {
      Toast.show({
        type: 'warning',
        text1: 'Téléchargement impossible',
        text2: 'La génération n\'est pas encore terminée'
      });
      return;
    }

    try {
      // Récupérer l'URL de téléchargement depuis le backend
      const downloadData = await dataService.getDownloadUrl(request.id);
      
      if (downloadData.download_url) {
        // Ouvrir l'URL dans le navigateur pour le téléchargement
        const supported = await Linking.canOpenURL(downloadData.download_url);
        if (supported) {
          await Linking.openURL(downloadData.download_url);
          Toast.show({
            type: 'success',
            text1: 'Téléchargement démarré',
            text2: 'Le fichier va être téléchargé'
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erreur de téléchargement',
            text2: 'Impossible d\'ouvrir le lien'
          });
        }
      } else {
        Toast.show({
          type: 'warning',
          text1: 'URL indisponible',
          text2: 'Aucune URL de téléchargement trouvée'
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de téléchargement',
        text2: error.response?.data?.detail || 'Une erreur est survenue'
      });
    }
  };

  const getStatusColor = (status: string): string => {
    return statsService.getStatusColor(status);
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'En cours';
      case 'completed': return 'Terminé';
      case 'failed': return 'Échoué';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = state.requests.filter(request =>
    request.id.toString().includes(state.searchQuery) ||
    request.request_name?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    request.dataset_name?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    request.status.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  if (state.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Chargement des requêtes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      
      {/* Barre de recherche */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Searchbar
          placeholder="Rechercher par ID, nom ou statut..."
          onChangeText={(query) => setState(prev => ({ ...prev, searchQuery: query }))}
          value={state.searchQuery}
        />
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={state.isRefreshing}
            onRefresh={() => loadRequests(true)}
          />
        }
      >
        
        {/* Statistiques rapides */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {state.requests.length}
                </Text>
                <Text style={{ color: '#666' }}>Total</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
                  {state.requests.filter(r => r.status === 'completed').length}
                </Text>
                <Text style={{ color: '#666' }}>Terminées</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2196F3' }}>
                  {state.requests.filter(r => ['pending', 'processing'].includes(r.status)).length}
                </Text>
                <Text style={{ color: '#666' }}>En cours</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Liste des requêtes */}
        {filteredRequests.length === 0 ? (
          <Card style={{ marginBottom: 16 }}>
            <Card.Content style={{ alignItems: 'center', padding: 32 }}>
              <Icon source="database-search" size={48} />
              <Text style={{ marginTop: 16, fontSize: 16, fontWeight: 'bold' }}>
                {state.searchQuery ? 'Aucun résultat' : 'Aucune requête'}
              </Text>
              <Text style={{ marginTop: 8, textAlign: 'center', color: '#666' }}>
                {state.searchQuery 
                  ? 'Aucune requête ne correspond à votre recherche'
                  : 'Vous n\'avez pas encore créé de requête de génération'
                }
              </Text>
              {!state.searchQuery && (
                <Button 
                  mode="contained" 
                  onPress={() => router.push('/new-request')}
                  style={{ marginTop: 16 }}
                >
                  Créer une requête
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} style={{ marginBottom: 12 }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                        {request.request_name || `Requête #${request.id}`}
                      </Text>
                      <Chip 
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={{ 
                          marginLeft: 8, 
                          backgroundColor: getStatusColor(request.status) + '20',
                          borderColor: getStatusColor(request.status)
                        }}
                      >
                        {getStatusLabel(request.status)}
                      </Chip>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Icon source="database" size={16} />
                      <Text style={{ marginLeft: 8, color: '#666' }}>
                        Dataset: {request.dataset_name}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Icon source="clock" size={16} />
                      <Text style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                        Créé le {formatDate(request.created_at)}
                        {request.updated_at !== request.created_at && (
                          <Text> • Modifié le {formatDate(request.updated_at)}</Text>
                        )}
                      </Text>
                    </View>

                    {/* Les métadonnées avancées ne sont pas disponibles dans le modèle actuel */}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleRequestPress(request)}
                    style={{ marginRight: 8 }}
                    compact
                  >
                    Détails
                  </Button>
                  
                  {request.status === 'completed' && (
                    <Button 
                      mode="contained" 
                      onPress={() => handleDownload(request)}
                      icon="download"
                      compact
                    >
                      Télécharger
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB pour nouvelle requête */}
      <FAB 
        icon="plus"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => router.push('/new-request')}
      />
    </SafeAreaView>
  );
}

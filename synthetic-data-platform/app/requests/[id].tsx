import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  RefreshControl,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Linking
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Divider,
  RadioButton,
  ActivityIndicator,
  Chip,
  Icon
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { authService } from '@/services/api/authService';
import { dataService } from '@/services/api/dataService';

interface DataRequest {
  id: number;
  user_id: number;
  request_name: string;
  dataset_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  uploaded_dataset_id?: number; // Ajout de ce champ pour l'ID du dataset
  // NOUVEAUX CHAMPS
  approved_by?: {
    id: number;
    email: string;
    full_name?: string;
  };
  approved_at?: string;
  rejection_reason?: string;
  processing_time?: number; // en secondes
  file_size?: number; // en bytes
  estimated_duration?: string;
  progress_percentage?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  description?: string;
  
  request_parameters?: {
    model_type?: string;
    epochs?: number;
    batch_size?: number;
    learning_rate?: number;
    optimization_enabled?: boolean;
    optimization_method?: string;
    optimization_n_trials?: number;
    hyperparameters?: string[];
    id?: number;
    request_id?: number;
  };
  results?: {
    quality_score?: number;
    output_path?: string;
    optimized?: boolean;
    generation_time?: number; // temps de génération en secondes
    rows_generated?: number;
    columns_count?: number;
    memory_usage?: number; // en MB
    final_parameters?: {
      epochs: number;
      batch_size: number;
      learning_rate: number;
      model_type: string;
    };
    download_url?: string;
    metrics?: {
      accuracy?: number;
      precision?: number;
      recall?: number;
      f1_score?: number;
    };
  };
  logs?: string[];
  error_message?: string;
}

interface FormData {
  request_name: string;
  model_type: 'ctgan' | 'tvae';
  sample_size: number;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  optimization_method: 'none' | 'grid' | 'random' | 'bayesian';
  n_trials: number;
}

const modelTypes = [
  { label: 'CTGAN', value: 'ctgan' as const, description: 'Générateur Adversaire pour données tabulaires' },
  { label: 'TVAE', value: 'tvae' as const, description: 'Auto-encodeur Variationnel pour données tabulaires' },
];

const optimizationMethods = [
  { label: 'Aucune', value: 'none' as const, description: 'Pas d\'optimisation automatique' },
  { label: 'Grid Search', value: 'grid' as const, description: 'Recherche exhaustive dans une grille' },
  { label: 'Random Search', value: 'random' as const, description: 'Recherche aléatoire dans l\'espace' },
  { label: 'Optimisation Bayésienne', value: 'bayesian' as const, description: 'Optimisation intelligente adaptative' },
];

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<DataRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [userRole, setUserRole] = useState(''); // Mode test
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState<FormData>({
    request_name: '',
    model_type: 'ctgan',
    sample_size: 1000,
    epochs: 100,
    batch_size: 500,
    learning_rate: 0.002,
    optimization_method: 'none',
    n_trials: 20,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Request Details',
    });
  }, [navigation]);

  const fetchRequestDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authService.getRequestById(Number(id));
  
      console.log('📋 [RequestDetails] Données reçues du backend:', JSON.stringify(response, null, 2));
      
      setRequest(response as DataRequest);

      const params = (response as any).request_parameters;
 
      try {
        await authService.getProfile();
        // Pour l'instant, on considère tout utilisateur comme non-admin
        // TODO: Implémenter la vérification du rôle côté backend
        setUserRole('user');
      } catch {
        console.log('Could not fetch user profile, defaulting to user role');
        setUserRole('user');
      }
      
      // Initialiser le formulaire avec les données existantes
      setFormData({
        request_name: response.request_name || '',
        model_type: (params?.model_type as 'ctgan' | 'tvae') || 'ctgan',
        sample_size: 1000, // Valeur par défaut
        epochs: params?.epochs || 100,
        batch_size: params?.batch_size || 500,
        learning_rate: params?.learning_rate || 0.002,
        optimization_method: params?.optimization_enabled
          ? ((params?.optimization_method as 'grid' | 'random' | 'bayesian') || 'grid')
          : 'none',
        n_trials: params?.optimization_n_trials || 20,
      });
      
    } catch (error: any) {
      console.error('Error fetching request details:', error);
      if (error.response?.status === 401 || error.message?.includes('Session expired')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load request details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id, fetchRequestDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequestDetails();
    setRefreshing(false);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      
      const updateData = {
        request: {
          request_name: formData.request_name,
          dataset_name: request?.dataset_name || ''
        },
        params: {
          model_type: formData.model_type,
          epochs: formData.epochs,
          batch_size: formData.batch_size,
          learning_rate: formData.learning_rate,
          optimization_enabled: formData.optimization_method !== 'none',
          optimization_method: formData.optimization_method !== 'none' ? formData.optimization_method : 'grid',
          optimization_n_trials: formData.n_trials,
          hyperparameters: formData.optimization_method !== 'none' ? ['epochs', 'batch_size'] : []
        }
      };

      console.log('💾 [RequestDetails] Sauvegarde:', updateData);
     
      await dataService.updateDataRequest(Number(id), updateData);

      Toast.show({
        type: 'success',
        text1: 'Modifications sauvegardées !',
        text2: 'Les paramètres ont été mis à jour'
      });

      setIsEditing(false);
      await fetchRequestDetails(); // Recharger les données

    } catch (error: any) {
      console.error('❌ [RequestDetails] Erreur sauvegarde:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: error.message || 'Impossible de sauvegarder'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateData = async () => {
    if (!request?.id) return;

    Alert.alert(
      'Generate Data',
      'Are you sure you want to generate synthetic data with current parameters?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setIsGenerating(true);
              
              // Récupérer les datasets disponibles pour obtenir un ID valide
              let datasetId = request.uploaded_dataset_id;
              if (!datasetId) {
                try {
                  const datasets = await dataService.getUploadedDatasets();
                  if (datasets.length > 0) {
                    datasetId = datasets[0].id; 
                    console.log('🔍 [RequestDetails] Dataset automatique:', datasetId);
                  } else {
                    throw new Error('Aucun dataset disponible. Veuillez d\'abord uploader un dataset.');
                  }
                } catch (datasetError) {
                  console.error('Erreur récupération datasets:', datasetError);
                  throw new Error('Impossible de récupérer les datasets disponibles.');
                }
              }
              
              const generationConfig = {
                dataset_id: datasetId,
                model_type: formData.model_type,
                sample_size: formData.sample_size,
                mode: formData.optimization_method !== 'none' ? 'optimization' : 'simple' as 'simple' | 'optimization',
                epochs: formData.epochs,
                batch_size: formData.batch_size,
                learning_rate: formData.learning_rate,
                generator_lr: formData.learning_rate, // Utiliser le même learning rate pour le générateur
                discriminator_lr: formData.learning_rate, // Utiliser le même learning rate pour le discriminateur
                optimization_method: formData.optimization_method !== 'none' ? formData.optimization_method as 'grid' | 'random' | 'bayesian' : undefined,
                n_trials: formData.optimization_method !== 'none' ? formData.n_trials : undefined,
                hyperparameters: formData.optimization_method !== 'none' ? ['epochs', 'batch_size', 'learning_rate'] : undefined
              };

              console.log('🚀 [RequestDetails] Démarrage génération avec config:', generationConfig);
              
              // Utiliser la nouvelle signature de generateSyntheticData
              const result = await dataService.generateSyntheticData(Number(id), generationConfig);
              
              console.log('✅ [RequestDetails] Génération démarrée:', result);
              
              // Update the request status
              setRequest(prev => ({
                ...prev!,
                status: 'processing',
                updated_at: new Date().toISOString()
              }));

              Toast.show({
                type: 'success',
                text1: 'Génération démarrée !',
                text2: 'Suivez l\'avancement dans la liste des requêtes'
              });

            } catch (error: any) {
              console.error('Generation error:', error);
              Toast.show({
                type: 'error',
                text1: 'Erreur de génération',
                text2: error.message || 'Impossible de démarrer la génération'
              });
            } finally {
              setIsGenerating(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadData = async () => {
    if (!request?.id) {
      Alert.alert('Erreur', 'ID de requête manquant');
      return;
    }

    if (request.status !== 'completed') {
      Alert.alert('Attention', 'La génération doit être terminée avant de pouvoir télécharger les données');
      return;
    }

    try {
      // Étape 1: Obtenir un token de téléchargement temporaire
      console.log('🔑 Génération du token de téléchargement...');
      const tokenResponse = await dataService.getDownloadToken(request.id);
      
      if (tokenResponse.download_url) {
        console.log('🔗 URL de téléchargement avec token:', tokenResponse.download_url);
        
        // Étape 2: Utiliser l'URL avec token (pas besoin d'authentification)
        const supported = await Linking.canOpenURL(tokenResponse.download_url);
        if (supported) {
          await Linking.openURL(tokenResponse.download_url);
          Toast.show({
            type: 'success',
            text1: 'Téléchargement démarré',
            text2: `Le fichier va être téléchargé (token valide ${tokenResponse.expires_in_minutes} minutes)`
          });
        } else {
          // Si Linking ne fonctionne pas, proposer le lien à copier
          Alert.alert(
            'Lien de téléchargement',
            `Copiez ce lien dans votre navigateur :\n\n${tokenResponse.download_url}\n\n(Valide ${tokenResponse.expires_in_minutes} minutes)`,
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
      } else {
        Alert.alert('Erreur', 'Impossible de générer le token de téléchargement');
      }
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert('Erreur', error.message || 'Impossible de télécharger les données');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'alert-octagon';
      case 'high': return 'chevron-double-up';
      case 'medium': return 'chevron-up';
      case 'low': return 'chevron-down';
      default: return 'minus';
    }
  };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'pending': return 'clock-outline';
  //     case 'approved': return 'check-circle-outline';
  //     case 'rejected': return 'close-circle-outline';
  //     case 'completed': return 'check-circle';
  //     case 'processing': return 'progress-clock';
  //     case 'failed': return 'alert-circle';
  //     case 'cancelled': return 'stop-circle-outline';
  //     default: return 'help-circle-outline';
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'processing': return '#3b82f6';
      case 'completed': return '#059669';
      case 'failed': return '#dc2626';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      case 'processing': return 'En cours';
      case 'completed': return 'Terminée';
      case 'failed': return 'Échouée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnu';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'La demande est en attente d\'approbation par un administrateur.';
      case 'approved': return 'La demande a été approuvée et peut être générée.';
      case 'rejected': return 'La demande a été rejetée par un administrateur.';
      case 'processing': return 'La génération de données synthétiques est en cours.';
      case 'completed': return 'La génération de données synthétiques est terminée avec succès.';
      case 'failed': return 'La génération de données synthétiques a échoué.';
      case 'cancelled': return 'La demande a été annulée.';
      default: return 'Statut inconnu.';
    }
  };

  const handleApproveRequest = async () => {
    try {
      setIsLoading(true);
      // TODO: Implémenter l'appel API pour approuver la demande
      // await dataService.approveRequest(request.id);
      
      Toast.show({
        type: 'success',
        text1: 'Demande approuvée',
        text2: 'La demande a été approuvée avec succès'
      });
      
      await fetchRequestDetails();
    } catch (error: any) {
      console.error('Error approving request:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'approuver la demande'
      });
    } finally {
      setIsLoading(false);
      setShowApprovalDialog(false);
    }
  };

  const handleRejectRequest = async (rejectionReason: string) => {
    try {
      setIsLoading(true);
      // TODO: Implémenter l'appel API pour rejeter la demande
      // await dataService.rejectRequest(request.id, rejectionReason);
      
      Toast.show({
        type: 'success',
        text1: 'Demande rejetée',
        text2: 'La demande a été rejetée'
      });
      
      await fetchRequestDetails();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de rejeter la demande'
      });
    } finally {
      setIsLoading(false);
      setShowRejectionDialog(false);
    }
  };

  const handleDeleteRequest = () => {
    if (!request || !request.id) {
      Alert.alert('Error', 'Unable to delete request. Request not found.');
      return;
    }

    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteRequest(request.id);
              Alert.alert('Success', 'Request deleted successfully.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              console.error('Delete request error:', error);
              Alert.alert(
                'Error', 
                error.message || 'Failed to delete request. Please try again.'
              );
            }
          }
        }
      ]
    );
  };


  // TODO: Implémenter la génération optimisée
  
  // const handleOptimizedGeneration = () => {
  //   if (!request?.id) return;
    
  //   // Navigation vers l'écran de configuration d'optimisation
  //   router.push(`/OptimizationConfigScreen.tsx` as any);
  // };

  // 🔧 Fonction utilitaire pour accéder aux paramètres de manière sûre
  const getRequestParams = () => {
    return (request as any)?.request_parameters || null;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Icon source="alert-circle" size={48} color="#ef4444" />
        <Text className="mt-4 text-gray-600">Request not found</Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 bg-gray-600 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Icon source="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text variant="titleLarge" className="font-bold text-gray-900 ml-4 flex-1">
          Request Details
        </Text>
        <TouchableOpacity onPress={handleDeleteRequest}>
          <Icon source="delete" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="px-5 py-4"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Main Info Card */}
        <Card className="mb-4">
          <Card.Content className="p-5">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-xl font-bold text-gray-900 flex-1">
                {request.request_name}
              </Text>
              <Chip
                mode="outlined"
                textStyle={{ color: getStatusColor(request.status) }}
                style={{ borderColor: getStatusColor(request.status) }}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Chip>
            </View>

            <View className="flex-row items-center mb-4">
              <Icon source="file-document" size={20} color="#6b7280" />
              <Text className="text-gray-700 ml-2 text-base">
                {request.dataset_name}
              </Text>
            </View>

            <Divider className="my-4" />

            <View className="space-y-3">
              
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Created</Text>
                <Text className="text-gray-900 font-medium">
                  {formatDate(request.created_at)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Last Updated</Text>
                <Text className="text-gray-900 font-medium">
                  {formatDate(request.updated_at)}
                </Text>
              </View>

              {/* Affichage conditionnel des priorités */}
              {request.priority && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-500">Priority</Text>
                  <View className="flex-row items-center">
                    <Icon 
                      source={getPriorityIcon(request.priority)} 
                      size={16} 
                      color={getPriorityColor(request.priority)} 
                    />
                    <Text 
                      className="font-medium ml-1" 
                      style={{ color: getPriorityColor(request.priority) }}
                    >
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Temps de traitement si disponible */}
              {request.processing_time && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Processing Time</Text>
                  <Text className="text-gray-900 font-medium">
                    {formatDuration(request.processing_time)}
                  </Text>
                </View>
              )}

              {/* Taille du fichier si disponible */}
              {request.file_size && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Dataset Size</Text>
                  <Text className="text-gray-900 font-medium">
                    {formatFileSize(request.file_size)}
                  </Text>
                </View>
              )}

              {/* Barre de progression pour les tâches en cours */}
              {request.progress_percentage !== undefined && request.status === 'processing' && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-500">Progress</Text>
                  <View className="flex-row items-center">
                    <View className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                      <View 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: `${request.progress_percentage}%` }}
                      />
                    </View>
                    <Text className="text-gray-900 font-medium text-sm">
                      {request.progress_percentage}%
                    </Text>
                  </View>
                </View>
              )}

              {/* Durée estimée si disponible */}
              {request.estimated_duration && request.status === 'processing' && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Est. Completion</Text>
                  <Text className="text-gray-900 font-medium">
                    {request.estimated_duration}
                  </Text>
                </View>
              )}

              {/* Message de debug si peu de données */}
              {(!getRequestParams() && !request.priority && !request.processing_time && !request.file_size) && (
                <View className="bg-amber-50 p-3 rounded-lg mt-3">
                  <Text className="text-amber-800 text-sm">
                    ⚠️ Certaines informations ne sont pas disponibles. 
                    Vérifiez les logs pour plus de détails.
                  </Text>
                </View>
              )}
            </View>

            {/* Tags section */}
            {request.tags && request.tags.length > 0 && (
              <>
                <Divider className="my-4" />
                <View>
                  <Text className="text-gray-500 font-medium mb-2">Tags</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {request.tags.map((tag, index) => (
                      <Chip key={index} mode="outlined" compact>
                        {tag}
                      </Chip>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Description section */}
            {request.description && (
              <>
                <Divider className="my-4" />
                <View>
                  <Text className="text-gray-500 font-medium mb-2">Description</Text>
                  <Text className="text-gray-700 leading-relaxed">
                    {request.description}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Parameters Card - Affichage conditionnel amélioré */}
        <Card className="mb-4">
          <Card.Content className="p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Parameters
              </Text>
              {request.status === 'pending' && (
                <Button
                  mode={isEditing ? "contained" : "outlined"}
                  onPress={() => setIsEditing(!isEditing)}
                  icon={isEditing ? "check" : "pencil"}
                  compact
                >
                  {isEditing ? "Done" : "Edit"}
                </Button>
              )}
            </View>

            {isEditing && request.status === 'pending' ? (
                <View className="space-y-4">
                  {/* Nom de la requête */}
                  <View>
                    <Text className="text-gray-500 font-medium mb-2">Request Name</Text>
                    <TextInput
                      value={formData.request_name}
                      onChangeText={(text) => updateFormData('request_name', text)}
                      mode="flat"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: 8,
                      }}
                    />
                  </View>

                  {/* Type de modèle */}
                  <View>
                    <Text className="text-gray-500 font-medium mb-3">Model Type</Text>
                    <RadioButton.Group 
                      onValueChange={(value) => updateFormData('model_type', value)}
                      value={formData.model_type}
                    >
                      {modelTypes.map((type) => (
                        <View key={type.value} className="mb-2">
                          <RadioButton.Item 
                            label={type.label} 
                            value={type.value}
                            labelStyle={{ fontSize: 16, fontWeight: '500' }}
                          />
                          <Text className="text-sm ml-10 -mt-1 text-gray-600">
                            {type.description}
                          </Text>
                        </View>
                      ))}
                    </RadioButton.Group>
                  </View>

                  <Divider className="my-3" />

                  {/* Paramètres de génération */}
                  <View>
                    <Text className="text-gray-500 font-medium mb-2">Sample Size</Text>
                    <TextInput
                      value={formData.sample_size.toString()}
                      onChangeText={(text) => updateFormData('sample_size', parseInt(text) || 1000)}
                      keyboardType="numeric"
                      mode="flat"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: 8,
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-gray-500 font-medium mb-2">Epochs</Text>
                    <TextInput
                      value={formData.epochs.toString()}
                      onChangeText={(text) => updateFormData('epochs', parseInt(text) || 100)}
                      keyboardType="numeric"
                      mode="flat"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: 8,
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-gray-500 font-medium mb-2">Batch Size</Text>
                    <TextInput
                      value={formData.batch_size.toString()}
                      onChangeText={(text) => updateFormData('batch_size', parseInt(text) || 500)}
                      keyboardType="numeric"
                      mode="flat"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: 8,
                      }}
                    />
                  </View>

                  <View>
                    <Text className="text-gray-500 font-medium mb-2">Learning Rate</Text>
                    <TextInput
                      value={formData.learning_rate.toString()}
                      onChangeText={(text) => updateFormData('learning_rate', parseFloat(text) || 0.002)}
                      keyboardType="numeric"
                      mode="flat"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: 8,
                      }}
                    />
                  </View>

                  <Divider className="my-3" />

                  {/* Optimisation */}
                  <View>
                    <Text className="text-gray-500 font-medium mb-3">Optimization Method</Text>
                    <RadioButton.Group 
                      onValueChange={(value) => updateFormData('optimization_method', value)}
                      value={formData.optimization_method}
                    >
                      {optimizationMethods.map((method) => (
                        <View key={method.value} className="mb-2">
                          <RadioButton.Item 
                            label={method.label} 
                            value={method.value}
                            labelStyle={{ fontSize: 16, fontWeight: '500' }}
                          />
                          <Text className="text-sm ml-10 -mt-1 text-gray-600">
                            {method.description}
                          </Text>
                        </View>
                      ))}
                    </RadioButton.Group>
                  </View>

                  {formData.optimization_method !== 'none' && (
                    <View>
                      <Text className="text-gray-500 font-medium mb-2">Number of Trials</Text>
                      <TextInput
                        value={formData.n_trials.toString()}
                        onChangeText={(text) => updateFormData('n_trials', parseInt(text) || 20)}
                        keyboardType="numeric"
                        mode="flat"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          borderRadius: 8,
                        }}
                      />
                    </View>
                  )}

                  {/* Boutons de sauvegarde en mode édition */}
                  <View className="flex-row space-x-3 mt-4">
                    <Button 
                      mode="outlined" 
                      onPress={() => {
                        setIsEditing(false);
                        fetchRequestDetails(); // Annuler les modifications
                      }}
                      className="flex-1"
                      icon="close"
                    >
                      Cancel
                    </Button>
                    <Button 
                      mode="contained" 
                      onPress={handleSaveChanges}
                      loading={isLoading}
                      disabled={isLoading}
                      className="flex-1"
                      icon={isLoading ? undefined : "content-save"}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </View>
                </View>
              ) : (
                <View className="space-y-3">
                  {getRequestParams()?.model_type && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Model Type</Text>
                      <Text className="text-gray-900 font-medium">
                        {getRequestParams().model_type}
                      </Text>
                    </View>
                  )}

                  {getRequestParams()?.epochs && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Epochs</Text>
                      <Text className="text-gray-900 font-medium">
                        {getRequestParams().epochs}
                      </Text>
                    </View>
                  )}

                  {getRequestParams()?.batch_size && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Batch Size</Text>
                      <Text className="text-gray-900 font-medium">
                        {getRequestParams().batch_size}
                      </Text>
                    </View>
                  )}

                  {getRequestParams()?.learning_rate && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Learning Rate</Text>
                      <Text className="text-gray-900 font-medium">
                        {getRequestParams().learning_rate}
                      </Text>
                    </View>
                  )}

                  {getRequestParams()?.optimization_enabled && (
                    <>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Optimization</Text>
                        <Text className="text-gray-900 font-medium">Enabled</Text>
                      </View>

                      {getRequestParams().optimization_method && (
                        <View className="flex-row justify-between">
                          <Text className="text-gray-500">Search Type</Text>
                          <Text className="text-gray-900 font-medium">
                            {getRequestParams().optimization_method}
                          </Text>
                        </View>
                      )}

                      {getRequestParams().optimization_n_trials && (
                        <View className="flex-row justify-between">
                          <Text className="text-gray-500">Trials</Text>
                          <Text className="text-gray-900 font-medium">
                            {getRequestParams().optimization_n_trials}
                          </Text>
                        </View>
                      )}

                      {getRequestParams().hyperparameters && getRequestParams().hyperparameters.length > 0 && (
                        <View className="flex-row justify-between">
                          <Text className="text-gray-500">Hyperparameters</Text>
                          <Text className="text-gray-900 font-medium">
                            {getRequestParams().hyperparameters.join(', ')}
                          </Text>
                        </View>
                      )}

                    </>
                  )}

                  {/* Message si aucun paramètre n'est disponible */}
                  {!getRequestParams() && (
                    <View className="bg-gray-50 p-4 rounded-lg">
                      <Text className="text-gray-600 text-center">
                        🔧 Aucun paramètre configuré pour cette demande
                      </Text>
                      <Text className="text-gray-500 text-center text-sm mt-1">
                        Les paramètres seront définis lors de la génération
                      </Text>
                    </View>
                  )}

                  {/* Message si paramètres partiels */}
                  {getRequestParams() && 
                   !getRequestParams().model_type && 
                   !getRequestParams().epochs && 
                   !getRequestParams().batch_size && (
                    <View className="bg-blue-50 p-4 rounded-lg">
                      <Text className="text-blue-800 text-center">
                        ⚙️ Paramètres en cours de configuration
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>


        {/* Approval Information Card */}
        {(request.status === 'approved' || request.status === 'rejected' || 
          request.status === 'processing' || request.status === 'completed' || 
          request.status === 'failed') && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Approval Information
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-500">Status</Text>
                  <View className="flex-row items-center">
                    {/* <Icon 
                      source={getStatusIcon(request.status)} 
                      size={16} 
                      color={getStatusColor(request.status)} 
                    /> */}
                    <Text 
                      className="font-medium ml-2" 
                      style={{ color: getStatusColor(request.status) }}
                    >
                      {getStatusLabel(request.status)}
                    </Text>
                  </View>
                </View>

                {request.approved_by && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">
                      {request.status === 'rejected' ? 'Rejected by' : 'Approved by'}
                    </Text>
                    <Text className="text-gray-900 font-medium">
                      {request.approved_by.full_name || request.approved_by.email}
                    </Text>
                  </View>
                )}

                {request.approved_at && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">
                      {request.status === 'rejected' ? 'Rejected on' : 'Approved on'}
                    </Text>
                    <Text className="text-gray-900 font-medium">
                      {formatDate(request.approved_at)}
                    </Text>
                  </View>
                )}

                {request.status === 'rejected' && request.rejection_reason && (
                  <>
                    <Divider className="my-2" />
                    <View>
                      <Text className="text-gray-500 font-medium mb-2">Rejection Reason</Text>
                      <View className="bg-red-50 p-3 rounded-lg">
                        <Text className="text-red-800">
                          {request.rejection_reason}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {request.status !== 'rejected' && (
                  <View className="bg-blue-50 p-3 rounded-lg mt-3">
                    <Text className="text-blue-800 text-sm">
                      {getStatusDescription(request.status)}
                    </Text>
                  </View>
                )}

                {/* Download button for completed requests */}
                {request.status === 'completed' && (
                  <View className="mt-4">
                    <Button
                      mode="contained"
                      onPress={handleDownloadData}
                      icon="download"
                      loading={false}
                      disabled={false}
                      className="mb-2"
                      style={{ backgroundColor: '#059669' }}
                      labelStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}
                    >
                       Download Generated Data
                    </Button>
                    <Text className="text-xs text-gray-500 text-center mt-1">
                      Download your synthetic dataset
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Admin Actions Card */}
        {request.status === 'pending' && userRole === 'admin' && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Admin Actions
              </Text>
              
              <View className="space-y-3">
                <Button
                  mode="contained"
                  onPress={() => setShowApprovalDialog(true)}
                  icon="check-circle"
                  className="py-2"
                  buttonColor="#10b981"
                  textColor="white"
                >
                  Approve Request
                </Button>
                
                <Button
                  mode="contained"
                  onPress={() => setShowRejectionDialog(true)}
                  icon="close-circle"
                  className="py-2"
                  buttonColor="#ef4444"
                  textColor="white"
                >
                  Reject Request
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Generate Data Button (for approved requests) */}
        {request.status === 'approved' && !isEditing && (
          <View className="p-5">
           
                <Button
                  mode="contained"
                  onPress={handleGenerateData}
                  loading={isGenerating}
                  disabled={isGenerating}
                  className="py-2 mb-3"
                  style={{ backgroundColor: '#000000' }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                >
                  {isGenerating ? 'Generating...' : '🚀 Generate Synthetic Data'}
                </Button>
              </View>
        )}

        {/* Regenerate Data Button (for completed requests) */}
        {request.status === 'completed' && !isEditing && (
          <View className="p-5">
            <Button
              mode="contained"
              onPress={handleGenerateData}
              loading={isGenerating}
              disabled={isGenerating}
              className="py-2 mb-3"
              style={{ backgroundColor: '#059669' }}
              labelStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
            >
              {isGenerating ? 'Regenerating...' : 'Regenerate Synthetic Data'}
            </Button>
            
            <Text className="text-xs text-gray-500 text-center mt-1">
              This will generate new synthetic data with the current parameters
            </Text>
          </View>
        )}

        {/* Error Card */}
        {request.status === 'failed' && request.error_message && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-red-600 mb-4">
                Error Details
              </Text>
              <View className="bg-red-50 p-4 rounded-lg">
                <Text className="text-red-800">
                  {request.error_message}
                </Text>
              </View>
              
              {/* Retry Button */}
              <View className="mt-4">
                <Button
                  mode="contained"
                  onPress={handleGenerateData}
                  loading={isGenerating}
                  disabled={isGenerating}
                  className="py-2"
                  style={{ backgroundColor: '#dc2626' }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
                  icon="refresh"
                >
                  {isGenerating ? 'Retrying...' : 'Retry Generation'}
                </Button>
                <Text className="text-xs text-gray-500 text-center mt-2">
                  This will attempt to generate the data again with the same parameters
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Logs Card */}
        {(request.status === 'processing' || request.status === 'completed') && request.logs && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Generation Logs
              </Text>
              <View className="bg-gray-100 p-4 rounded-lg max-h-60">
                <ScrollView nestedScrollEnabled>
                  {request.logs.map((log, index) => (
                    <Text key={index} className="text-sm text-gray-700 mb-1 font-mono">
                      {log}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
          <View className="bg-white rounded-lg p-6 mx-4 min-w-80">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Approuver la demande
            </Text>
            <Text className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir approuver cette demande de génération ?
            </Text>
            <View className="flex-row space-x-3">
              <Button 
                mode="outlined" 
                onPress={() => setShowApprovalDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                mode="contained" 
                onPress={handleApproveRequest}
                className="flex-1"
                buttonColor="#10b981"
              >
                Approuver
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Rejection Dialog */}
      {showRejectionDialog && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
          <View className="bg-white rounded-lg p-6 mx-4 min-w-80">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Rejeter la demande
            </Text>
            <Text className="text-gray-600 mb-4">
              Veuillez indiquer la raison du rejet :
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Raison du rejet..."
              multiline
              numberOfLines={3}
              className="mb-6"
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            <View className="flex-row space-x-3">
              <Button 
                mode="outlined" 
                onPress={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                mode="contained" 
                onPress={() => handleRejectRequest(rejectionReason)}
                className="flex-1"
                buttonColor="#ef4444"
                disabled={!rejectionReason.trim()}
              >
                Rejeter
              </Button>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
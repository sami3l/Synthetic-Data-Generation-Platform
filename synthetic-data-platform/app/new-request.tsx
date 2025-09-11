import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity, 
  Alert
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Divider,
  RadioButton,
  ActivityIndicator,
  Modal,
  Portal,
  Provider as PaperProvider,
  useTheme
} from 'react-native-paper';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { UploadedDataset } from '@/services/api/dataService';
import FileUploadComponent from '@/components/FileUploadComponentV2';
import { authService } from '@/services/api/authService';

interface FormData {
  dataset_id: number | null;
  model_type: 'ctgan' | 'tvae';
  sample_size: number;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  optimization_method: 'none' | 'grid' | 'random' | 'bayesian';
  n_trials: number;
  hyperparameters: Record<string, any>;
}

interface ValidationErrors {
  dataset_id?: string;
  sample_size?: string;
  epochs?: string;
  batch_size?: string;
  learning_rate?: string;
  n_trials?: string;
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

export default function NewRequestScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [datasets, setDatasets] = useState<UploadedDataset[]>([]);
  const [showDatasetList, setShowDatasetList] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<UploadedDataset | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // States pour les modals de modification/suppression
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDataset, setEditingDataset] = useState<UploadedDataset | null>(null);
  const [newFilename, setNewFilename] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    dataset_id: null,
    model_type: 'ctgan',
    sample_size: 1000,
    epochs: 100,
    batch_size: 500,
    learning_rate: 0.002,
    optimization_method: 'none',
    n_trials: 20,
    hyperparameters: {}
  });

  // Charger la liste des datasets au montage du composant
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      console.log('🔄 [NewRequest] Chargement des datasets...');
      setIsLoadingDatasets(true);
      
      const response = await authService.getDatasets();
      const datasetsArray = Array.isArray((response as any)?.datasets) 
        ? (response as any).datasets 
        : Array.isArray(response) 
          ? response 
          : [];
      
      console.log('✅ [NewRequest] Datasets chargés:', datasetsArray.length);
      setDatasets(datasetsArray);
      
    } catch (error: any) {
      console.error('❌ [NewRequest] Erreur chargement datasets:', error);
      setDatasets([]);
      
      Toast.show({
        type: 'error',
        text1: 'Erreur de chargement',
        text2: 'Impossible de charger vos datasets. Vérifiez votre connexion.'
      });
    } finally {
      setIsLoadingDatasets(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDatasets();
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const selectDataset = (dataset: UploadedDataset) => {
    setSelectedDataset(dataset);
    updateFormData('dataset_id', dataset.id);
    setShowDatasetList(false);
  };

  const handleEditDataset = (dataset: UploadedDataset) => {
    setEditingDataset(dataset);
    setNewFilename(dataset.original_filename);
    setEditModalVisible(true);
  };

  const handleUpdateDataset = async () => {
    if (!editingDataset || !newFilename.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de fichier valide');
      return;
    }

    try {
      setIsLoading(true);
      await authService.updateDataset(editingDataset.id, {
        original_filename: newFilename.trim()
      });

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Dataset mis à jour avec succès'
      });

      setEditModalVisible(false);
      setEditingDataset(null);
      setNewFilename('');
      
      // Recharger la liste des datasets
      await loadDatasets();
      
      // Si le dataset modifié était sélectionné, le mettre à jour
      if (selectedDataset && selectedDataset.id === editingDataset.id) {
        const updatedDataset = { ...selectedDataset, original_filename: newFilename.trim() };
        setSelectedDataset(updatedDataset);
      }

    } catch (error: any) {
      console.error('Erreur mise à jour:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDataset = (dataset: UploadedDataset) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le dataset "${dataset.original_filename}" ?\n\nCette action est irréversible.`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => confirmDeleteDataset(dataset)
        }
      ]
    );
  };

  const confirmDeleteDataset = async (dataset: UploadedDataset) => {
    try {
      setIsLoading(true);
      await authService.deleteDataset(dataset.id);

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Dataset supprimé avec succès'
      });

      // Recharger la liste des datasets
      await loadDatasets();
      
      // Si le dataset supprimé était sélectionné, le désélectionner
      if (selectedDataset && selectedDataset.id === dataset.id) {
        setSelectedDataset(null);
        updateFormData('dataset_id', null);
      }

    } catch (error: any) {
      console.error('Erreur suppression:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Erreur lors de la suppression'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.dataset_id) {
      errors.dataset_id = 'Veuillez sélectionner un dataset';
    }
    
    if (formData.sample_size <= 0 || formData.sample_size > 100000) {
      errors.sample_size = 'La taille doit être entre 1 et 100,000';
    }
    
    if (formData.epochs <= 0 || formData.epochs > 2000) {
      errors.epochs = 'Les époques doivent être entre 1 et 2,000';
    }
    
    if (formData.batch_size <= 0 || formData.batch_size > 10000) {
      errors.batch_size = 'Le batch doit être entre 1 et 10,000';
    }
    
    if (formData.learning_rate <= 0 || formData.learning_rate > 1) {
      errors.learning_rate = 'Le taux doit être entre 0.0001 et 1';
    }
    
    if (formData.optimization_method !== 'none' && (formData.n_trials <= 0 || formData.n_trials > 100)) {
      errors.n_trials = 'Les essais doivent être entre 1 et 100';
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Erreurs de validation',
        text2: 'Veuillez corriger les champs en erreur'
      });
      return false;
    }
    
    return true;
  };

    const handleSubmit = async () => {
      if (!validateForm()) return;

      try {
        setIsLoading(true);

        const requestData = {
          request: {
            request_name: `Génération ${selectedDataset?.original_filename || 'Dataset'} - ${new Date().toLocaleDateString('fr-FR')}`,
            dataset_name: selectedDataset?.original_filename || 'Unknown Dataset'
          },
          params: {
            model_type: formData.model_type,
            sample_size: formData.sample_size,
            epochs: formData.epochs,
            batch_size: formData.batch_size,
            learning_rate: formData.learning_rate,
            optimization_enabled: formData.optimization_method !== 'none',
            optimization_method: formData.optimization_method,
            optimization_n_trials: formData.n_trials,
            hyperparameters: formData.optimization_method !== 'none' ? ['epochs', 'batch_size'] : []
          }
        };

        console.log('🚀 [NewRequest] Création requête:', requestData);
        
        // Tester d'abord la connectivité du backend
        
        // Utiliser authService pour créer la requête avec une meilleure gestion des erreurs
        try {
          const result = await authService.createRequest(requestData);
          console.log('✅ [NewRequest] Requête créée:', result);

          Toast.show({
            type: 'success',
            text1: 'Requête créée !',
            text2: 'Configurez les détails avant de générer'
          });

          // Rediriger vers la page de détails de la requête
          router.replace(`/requests/${result.id}`);
          
        } catch (apiError: any) {
          console.error('❌ [NewRequest] Erreur API:', apiError);
          
          // Si authService n'a pas la méthode, utiliser fetch avec plus de debugging
          if (apiError.message?.includes('createRequest')) {
            console.log('🔄 [NewRequest] Fallback vers fetch direct...');

            const response = await authService.createRequest(requestData);
            console.log('📡 [NewRequest] Response status:', response.status);
           
            Toast.show({
              type: 'success',
              text1: 'Requête créée !',
              text2: 'Configurez les détails avant de générer'
            });

            router.replace(`/requests/${response.id}`);
          } else {
            throw apiError;
          }
        }

      } catch (error: any) {
        console.error('❌ [NewRequest] Erreur création:', error);
        
        let errorMessage = 'Une erreur est survenue lors de la création';
        
        if (error.message?.includes('Network request failed')) {
          errorMessage = 'Erreur réseau - Vérifiez votre connexion et que le backend est démarré';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Timeout - Le serveur met trop de temps à répondre';
        } else if (error.message?.includes('Backend not accessible')) {
          errorMessage = 'Le serveur backend n\'est pas accessible';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Toast.show({
          type: 'error',
          text1: 'Erreur de création',
          text2: errorMessage
        });
      } finally {
        setIsLoading(false);
      }
    };

  const handleUploadSuccess = (uploadedFile: any) => {
    // Recharger la liste des datasets après un upload réussi
    loadDatasets();
    Toast.show({
      type: 'success',
      text1: 'Upload réussi',
      text2: `${uploadedFile.filename} a été ajouté à vos datasets`
    });
  };

  if (isLoadingDatasets && datasets.length === 0) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="mt-4 text-center" style={{ color: theme.colors.onSurfaceVariant }}>
          Chargement de vos datasets...
        </Text>
        <Text className="mt-2 text-sm text-center" style={{ color: theme.colors.outline }}>
          Veuillez patienter un instant
        </Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <ScrollView
        className="flex-1 mt-2 px-4"
        style={{ backgroundColor: theme.colors.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Header avec titre et description */}
        <View className="mb-6 pt-6 pb-4">
          <Text variant="headlineMedium" className="font-bold mb-2" style={{ color: theme.colors.onBackground }}>
            Nouvelle Génération
          </Text>
          <Text className="text-base" style={{ color: theme.colors.onSurfaceVariant }}>
            Créez des données synthétiques à partir de vos datasets avec l&apos;IA
          </Text>
        </View>

        {/* File Upload Component */}
    
          {/* <FileUploadComponent 
            onUploadSuccess={handleUploadSuccess}
            disabled={isLoading}
          />
         */}
        {/* Dataset Selection */}
        <Card className="mb-6" style={{ backgroundColor: theme.colors.surface }} elevation={2}>
          <Card.Content className="py-5">
            <View className="flex-row items-center mb-3">
              <Text className="text-lg font-bold flex-1" style={{ color: theme.colors.onSurface }}>
                Sélection du Dataset
              </Text>
              {selectedDataset && (
                <Text className="text-xs px-2 py-1 rounded-full" 
                      style={{ 
                        color: theme.colors.primary, 
                        backgroundColor: theme.colors.primaryContainer, 
                      }}>
                  ✓ Sélectionné
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              onPress={() => setShowDatasetList(!showDatasetList)}
              className="p-4 border-2 rounded-xl text-black"
              style={{
                backgroundColor: selectedDataset 
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                borderColor: selectedDataset 
                  ? "black" 
                  : "black",
                borderStyle: selectedDataset ? 'solid' : 'dashed'
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  {isLoadingDatasets ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text className="ml-2" style={{ color: theme.colors.onSurfaceVariant }}>
                        Chargement...
                      </Text>
                    </View>
                  ) : selectedDataset ? (
                    <View >
                      <Text className="font-medium text-base" style={{ color: theme.colors.primary }}>
                        {selectedDataset.original_filename}
                      </Text>
                      <Text className="text-sm mt-1" style={{ color: theme.colors.onSurfaceVariant }}>
                        {selectedDataset.n_rows || selectedDataset.analysis_results?.num_rows} lignes × {' '}
                        {selectedDataset.n_columns || selectedDataset.analysis_results?.num_columns} colonnes
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text className="font-medium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Sélectionner un dataset...
                      </Text>
                      <Text className="text-sm mt-1" style={{ color: theme.colors.outline }}>
                        Appuyez pour voir vos datasets disponibles
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xl ml-2" style={{ color: theme.colors.outline }}>
                  {showDatasetList ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {showDatasetList && (
              <View className="mt-4 space-y-3">
                {datasets.map((dataset) => (
                  <Card 
                    key={dataset.id}
                    className="border"
                    style={{
                      backgroundColor: selectedDataset?.id === dataset.id 
                        ? theme.colors.primaryContainer 
                        : theme.colors.surface,
                      borderColor: selectedDataset?.id === dataset.id 
                        ? theme.colors.primary 
                        : theme.colors.outline,
                    }}
                    elevation={1}
                    onPress={() => selectDataset(dataset)}
                  >
                    <Card.Content className="py-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="font-semibold text-base" style={{ color: theme.colors.onSurface }}>
                            {dataset.original_filename}
                          </Text>
                          <View className="flex-row items-center mt-2 space-x-4">
                            <Text className="text-sm" style={{ color: theme.colors.onSurfaceVariant }}>
                              📊 {dataset.n_rows || dataset.analysis_results?.num_rows} lignes
                            </Text>
                            <Text className="text-sm" style={{ color: theme.colors.onSurfaceVariant }}>
                              📋 {dataset.n_columns || dataset.analysis_results?.num_columns} colonnes
                            </Text>
                          </View>
                          <Text className="text-xs mt-1" style={{ color: theme.colors.outline }}>
                            Uploadé le {new Date(dataset.created_at).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>
                        
                        {selectedDataset?.id === dataset.id && (
                          <View className="ml-3">
                            <Text className="text-lg" style={{ color: theme.colors.primary }}>✓</Text>
                          </View>
                        )}
                      </View>
                      
                      {/* Action buttons */}
                      <View className="flex-row justify-end mt-3 pt-3 space-x-4" 
                            style={{ borderTopColor: theme.colors.outlineVariant, borderTopWidth: 1 }}>
                        <TouchableOpacity
                          onPress={() => handleEditDataset(dataset)}
                          className="flex-row items-center px-3 py-1"
                        >
                          <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                            ✏️ 
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDeleteDataset(dataset)}
                          className="flex-row items-center px-3 py-1"
                        >
                          <Text className="text-sm font-medium" style={{ color: theme.colors.error }}>
                            🗑️
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
                
                {datasets && datasets.length === 0 && (
                  <View className="text-center py-8 rounded-xl border-2" 
                        style={{ 
                          backgroundColor: "lightgray",
                          borderColor: theme.colors.outline,
                          borderStyle: 'dashed'
                        }}>
                    <Text className="text-base font-medium" style={{ color: "gray" }}>
                      📁 Aucun dataset trouvé
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: theme.colors.outline }}>
                      Uploadez d&apos;abord un dataset pour commencer
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Model Configuration */}
        <Card className="mb-6" style={{ backgroundColor: theme.colors.surface }} elevation={2}>
          <Card.Content className="py-5">
            <Text className="text-lg font-bold mb-4" style={{ color: theme.colors.onSurface }}>
              🤖 Configuration du Modèle
            </Text>
            
            <View className="mb-4">
              <Text className="font-medium mb-3" style={{ color: theme.colors.onSurface }}>
                Type de Modèle IA:
              </Text>
              <RadioButton.Group 
                onValueChange={(value) => updateFormData('model_type', value)}
                value={formData.model_type}
              >
                {modelTypes.map((type) => (
                  <View key={type.value} className="mb-2">
                    <RadioButton.Item 
                      label={type.label} 
                      value={type.value}
                      labelStyle={{ fontSize: 16, fontWeight: '500', color: theme.colors.onSurface }}
                    />
                    <Text className="text-sm ml-10 -mt-1" style={{ color: theme.colors.onSurfaceVariant }}>
                      {type.description}
                    </Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            <Divider className="my-5" />
            
            <Text className="font-bold text-center mb-4" style={{ color: theme.colors.onSurface }}>
              Paramètres de Génération:
            </Text>
            <View className="space-y-4">
              <View>
                <Text className="font-medium mb-1" style={{ color: theme.colors.onSurface }}>
                   Taille de l&apos;échantillon (lignes à générer)
                </Text>
                <TextInput
                  textColor='#414a4c'
                  value={formData.sample_size.toString()}
                  onChangeText={(text) => updateFormData('sample_size', parseInt(text) || 1000)}
                  keyboardType="numeric"
                  mode="flat"
                  error={!!validationErrors.sample_size}
                  className="mb-1 "
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: 8,
                    elevation: 1  
                  }}
                />
                {validationErrors.sample_size && (
                  <Text className="text-xs ml-1" style={{ color: theme.colors.error }}>
                    {validationErrors.sample_size}
                  </Text>
                )}
              </View>

              <View>
                 <Text className="font-medium mb-1" style={{ color: theme.colors.onSurface }}>
                   Nombre d&apos;époques (entraînement)
                </Text>
                <TextInput
                  textColor='#414a4c'
                  value={formData.epochs.toString()}
                  onChangeText={(text) => updateFormData('epochs', parseInt(text) || 100)}
                  keyboardType="numeric"
                  mode="flat"
                  error={!!validationErrors.epochs}
                  className="mb-1"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: 8,
                    elevation: 1
                  }}
                />
                {validationErrors.epochs && (
                  <Text className="text-xs ml-1" style={{ color: theme.colors.error }}>
                    {validationErrors.epochs}
                  </Text>
                )}
              </View>

              <View>
                <Text className="font-medium mb-1" style={{ color: theme.colors.onSurface }}>
                  Taille du batch
                </Text>
                <TextInput
                  textColor='#414a4c'
                  value={formData.batch_size.toString()}
                  onChangeText={(text) => updateFormData('batch_size', parseInt(text) || 500)}
                  keyboardType="numeric"
                  mode="flat"
                  error={!!validationErrors.batch_size}
                  className="mb-1"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: 8,
                    elevation: 1
                  }}
                />
                {validationErrors.batch_size && (
                  <Text className="text-xs ml-1" style={{ color: theme.colors.error }}>
                    {validationErrors.batch_size}
                  </Text>
                )}
              </View>

              <View>
                <Text className="font-medium mb-1" style={{ color: theme.colors.onSurface }}>
                  Taux d&apos;apprentissage
                </Text>
                <TextInput
                  textColor='#414a4c'
                  value={formData.learning_rate.toString()}
                  onChangeText={(text) => updateFormData('learning_rate', parseFloat(text) || 0.002)}
                  keyboardType="numeric"
                  mode="flat"
                  error={!!validationErrors.learning_rate}
                  className="mb-1"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: 8,
                    elevation: 1
                  }}
                />
                {validationErrors.learning_rate && (
                  <Text className="text-xs ml-1" style={{ color: theme.colors.error }}>
                    {validationErrors.learning_rate}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Optimization */}
        <Card className="mb-6" style={{ backgroundColor: theme.colors.surface }} elevation={2}>
          <Card.Content className="py-5">
            <Text className="text-lg font-bold mb-4" style={{ color: theme.colors.onSurface }}>
              ⚡ Optimisation des Hyperparamètres
            </Text>
            
            <View className="mb-4">
              <Text className="font-medium mb-3" style={{ color: theme.colors.onSurface }}>
                Méthode d&apos;optimisation:
              </Text>
              <RadioButton.Group 
                onValueChange={(value) => updateFormData('optimization_method', value)}
                value={formData.optimization_method}
              >
                {optimizationMethods.map((method) => (
                  <View key={method.value} className="mb-2">
                    <RadioButton.Item 
                      label={method.label} 
                      value={method.value}
                      labelStyle={{ fontSize: 16, fontWeight: '500', color: theme.colors.onSurface }}
                    />
                    <Text className="text-sm ml-10 -mt-1" style={{ color: theme.colors.onSurfaceVariant }}>
                      {method.description}
                    </Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            {formData.optimization_method !== 'none' && (
              <View className="mt-4 p-4 rounded-xl border bg-slate-400" >
                <Text className="font-bold text-black">
                   Configuration Avancée
                </Text>
                <Text className="text-sm mb-2" style={{ color: theme.colors.onSurfaceVariant }}>
                  nombre d&apos;essais pour l&apos;optimisation
                </Text>
                <TextInput
                  textColor='#414a4c'
                  value={formData.n_trials.toString()}
                  onChangeText={(text) => updateFormData('n_trials', parseInt(text) || 20)}
                  keyboardType="numeric"
                  mode="flat"
                  error={!!validationErrors.n_trials}
                  className="mb-1"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: 8,
                    elevation: 1
                  }}
                />
                {validationErrors.n_trials && (
                  <Text className="text-xs ml-1" style={{ color: theme.colors.error }}>
                    {validationErrors.n_trials}
                  </Text>
                )}
                <Text className="text-xs mt-2" style={{ color: theme.colors.onTertiaryContainer }}>
                  💡 Plus d&apos;essais = meilleure optimisation mais plus long
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-8 space-x-3">
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            className="flex-1 rounded-xl py-1 "
            labelStyle={{ fontSize: 16, fontWeight: '600' , color:"#FFFFFF" }}
            icon="arrow-left"
             style={{ 
              backgroundColor:"#000000",
              elevation: 2
            }}
          >
            Annuler
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !formData.dataset_id}
            className="flex-1 rounded-xl py-1"
            labelStyle={{ fontSize: 16, fontWeight: '600' , color: '#FFFFFF' }}
            style={{ 
              backgroundColor:"#000000",
              elevation: 2
            }}
          >
            {isLoading ? 'Création...' : 'Créer la Requête'}
          </Button>
        </View>

        {/* Status/Info Section */}
        {/* {selectedDataset && (
          <Card className="mb-4" 
                style={{ 
                  backgroundColor: theme.colors.secondaryContainer,
                  borderColor: theme.colors.secondary,
                  borderWidth: 1
                }} 
                elevation={1}>
            <Card.Content className="py-4">
              <View className="flex-row items-center">
                <Text className="text-base font-medium flex-1" style={{ color: theme.colors.onSecondaryContainer }}>
                  ✅ Prêt pour la génération
                </Text>
                <Text className="text-sm" style={{ color: theme.colors.onSecondaryContainer }}>
                  {formData.sample_size} échantillons
                </Text>
              </View>
              <Text className="text-sm mt-1" style={{ color: theme.colors.onSecondaryContainer }}>
                Modèle: {formData.model_type.toUpperCase()} | 
                Optimisation: {formData.optimization_method === 'none' ? 'Désactivée' : formData.optimization_method}
              </Text>
            </Card.Content>
          </Card>
        )} */}
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            margin: 20,
            borderRadius: 12,
            elevation: 3,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <Text className="text-lg font-bold mb-4" style={{ color: theme.colors.onSurface }}>
            Modifier le Dataset
          </Text>
          
          <Text className="mb-2" style={{ color: theme.colors.onSurface }}>Nom du fichier:</Text>
          <TextInput
            value={newFilename}
            onChangeText={setNewFilename}
            mode="flat"
            placeholder="Nouveau nom de fichier"
            className="mb-4"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.95)', 
              borderRadius: 8,
              elevation: 1
            }}
          />
          
          <View className="flex-row justify-end">
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              className="mr-2 rounded-lg"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateDataset}
              disabled={isLoading || !newFilename.trim()}
              className="rounded-lg"
            >
              Sauvegarder
            </Button>
          </View>
        </Modal>
      </Portal>
    </PaperProvider>
  );
}
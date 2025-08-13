import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Card,
} from 'react-native-paper';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

// Import de nos nouveaux composants
import GenerationConfigComponent from '@/components/GenerationConfigComponent';
import { authService } from '@/services/api/authService';
import type { GenerationConfig } from '@/components/GenerationConfigComponent';
import { dataService } from '@/services/api/dataService';

interface Dataset {
  id: number;
  filename: string;
  file_size: number;
  created_at: string;
  n_rows?: number;
  n_columns?: number;
}


export default function GenerateScreen() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fonctions pour créer une demande
  const createRequest = async (config: GenerationConfig) => {
    try {
      setIsGenerating(true);
      
      // Trouver le dataset sélectionné
      const selectedDataset = datasets.find(d => d.id === config.dataset_id);
      
      // Créer les données de la requête
      const requestData = {
        request: {
          request_name: `Demande ${selectedDataset?.filename || 'Dataset'} - ${new Date().toLocaleDateString('fr-FR')}`,
          dataset_name: selectedDataset?.filename || 'Unknown Dataset'
        },
        params: {
          model_type: config.model_type,
          sample_size: config.sample_size,
          epochs: config.epochs,
          batch_size: config.batch_size,
          learning_rate: config.learning_rate,
          optimization_enabled: config.optimization_method !== 'none',
          optimization_method: config.optimization_method,
          optimization_n_trials: config.n_trials,
          hyperparameters: config.optimization_method !== 'none' ? ['epochs', 'batch_size'] : []
        }
      };

      console.log('🚀 Création demande avec paramètres:', requestData);
      const response = await authService.createRequest(requestData);
      console.log('✅ Demande créée:', response);
      
      return response.id;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la demande:', error);
      setIsGenerating(false);
      throw error;
    }
  };

  // Charger la liste des datasets disponibles
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setIsLoadingDatasets(true);

       const response = await dataService.getUploadedDatasets();
      // Mapper les données pour correspondre à notre interface
      const mappedDatasets = response.map(dataset => ({
        id: dataset.id,
        filename: dataset.filename || dataset.original_filename,
        file_size: dataset.file_size,
        created_at: dataset.created_at,
        n_rows: dataset.n_rows,
        n_columns: dataset.n_columns
      }));
      setDatasets(mappedDatasets);
      
    } catch (error) {
      console.error('Erreur lors du chargement des datasets:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les datasets',
      });
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const handleStartGeneration = async (generationConfig: GenerationConfig) => {
    try {
      console.log('🚀 Création de la demande avec config:', generationConfig);
      
      // Valider la configuration
      const errors = [];
      if (!generationConfig.dataset_id) errors.push('Dataset requis');
      if (!generationConfig.sample_size || generationConfig.sample_size < 100) errors.push('Taille échantillon invalide');
      
      if (errors.length > 0) {
        Alert.alert(
          'Configuration invalide',
          errors.join('\n'),
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Confirmation avant soumission
      Alert.alert(
        'Confirmer la demande',
        'Votre demande sera soumise à un administrateur pour approbation. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Soumettre',
            onPress: async () => {
              try {
                const requestId = await createRequest(generationConfig);
                if (requestId) {
                  setIsGenerating(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Demande soumise !',
                    text2: 'Votre demande est en attente d\'approbation'
                  });
                  
                  // Rediriger vers les requêtes
                  router.push('/requests');
                }
              } catch (error) {
                console.error('Erreur lors de la création de la demande:', error);
                setIsGenerating(false);
                Toast.show({
                  type: 'error',
                  text1: 'Erreur',
                  text2: 'Impossible de créer la demande'
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la soumission de la demande:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de soumettre la demande',
      });
    }
  };

  const handleViewRequests = () => {
    router.push('/requests');
  };

  if (isLoadingDatasets) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-gray-600">Chargement des datasets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white mt-12 px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Nouvelle Demande</Text>
        <Text className="text-gray-600 mt-1">
          Soumettez une demande de génération qui sera examinée par un administrateur
        </Text>
      </View>

      <ScrollView className="mb-12 flex-1">
        <View className="p-6">
          {/* Information sur le processus */}
          <Card className="mb-6" style={{ backgroundColor: '#e3f2fd', borderColor: '#2196f3', borderWidth: 1 }}>
            <Card.Content className="py-4">
              <View className="flex-row items-center mb-2">
                <Text className="text-lg font-bold" style={{ color: '#1976d2' }}>
                  📋 Processus d&apos;approbation
                </Text>
              </View>
              <Text className="text-base" style={{ color: '#0d47a1', lineHeight: 20 }}>
                Votre demande sera examinée par un administrateur avant d&apos;être traitée. 
                Vous recevrez une notification dès qu&apos;elle sera approuvée et pourrez alors lancer la génération.
              </Text>
            </Card.Content>
          </Card>

          {/* Statistiques rapides */}
          {/* <View className="flex-row justify-between mb-6">
            <Card className="flex-1 mr-2 bg-blue-50">
              <Card.Content className="items-center py-4">
                <Text className="text-2xl font-bold text-blue-600">{datasets.length}</Text>
                <Text className="text-blue-800 text-sm">Datasets</Text>
              </Card.Content>
            </Card>
            <Card className="flex-1 mx-2 bg-green-50">
              <Card.Content className="items-center py-4">
                <Text className="text-2xl font-bold text-green-600">2</Text>
                <Text className="text-green-800 text-sm">Modèles IA</Text>
              </Card.Content>
            </Card>
            <Card className="flex-1 ml-2 bg-purple-50">
              <Card.Content className="items-center py-4">
                <Text className="text-2xl font-bold text-purple-600">3</Text>
                <Text className="text-purple-800 text-sm">Méthodes</Text>
              </Card.Content>
            </Card>
          </View> */}

          {/* Sélection de dataset */}
          <Card className="mb-6">
            <Card.Content>
              <Text className="text-lg font-semibold mb-4 text-gray-900">
                Sélectionner un dataset
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {datasets.map((dataset) => (
                  <TouchableOpacity
                    key={dataset.id}
                    className={`mr-4 p-4 rounded-lg border-2 min-w-[200px] ${
                      selectedDatasetId === dataset.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onPress={() => setSelectedDatasetId(dataset.id)}
                  >
                    <Text className={`font-medium ${
                      selectedDatasetId === dataset.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {dataset.filename}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      Taille: {dataset.file_size} octets • Créé: {new Date(dataset.created_at).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card.Content>
          </Card>

          {/* Composant principal de configuration */}
          {selectedDatasetId && (
            <GenerationConfigComponent
              datasetId={selectedDatasetId}
              onStartGeneration={handleStartGeneration}
              disabled={isGenerating}
            />
          )}

          {/* Bouton pour voir les requêtes */}
          <Card className="mt-6">
            <Card.Content className="p-4">
              <Button
                mode="outlined"
                onPress={handleViewRequests}
                className="w-full"
                icon="format-list-bulleted"
              >
                Voir mes requêtes de génération
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

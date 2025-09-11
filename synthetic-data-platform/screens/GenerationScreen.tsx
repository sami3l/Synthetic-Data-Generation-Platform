/**
 * Exemple d'écran complet utilisant les nouveaux composants de génération avec optimisation
 */
import React from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import GenerationConfigComponent, { GenerationConfig } from '@/components/GenerationConfigComponent';
import { useGeneration } from '@/hooks/useGenerationWithOptimization';

interface GenerationScreenProps {
  datasetId: number;
  datasetName: string;
}

const GenerationScreen: React.FC<GenerationScreenProps> = ({
  datasetId,
  datasetName
}) => {
  const {
    isGenerating,
    currentRequest,
    error,
    progress,
    startGeneration,
    cancelGeneration,
    downloadResults,
    resetError
  } = useGeneration();

  const handleStartGeneration = async (config: GenerationConfig) => {
    try {
      Alert.alert(
        'Confirmer la génération',
        `Êtes-vous sûr de vouloir démarrer la génération de ${config.sample_size.toLocaleString()} échantillons avec le modèle ${config.model_type.toUpperCase()}?`,
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Démarrer',
            onPress: () => startGeneration(config)
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
    }
  };

  const handleCancelGeneration = () => {
    if (currentRequest) {
      Alert.alert(
        'Annuler la génération',
        'Êtes-vous sûr de vouloir annuler la génération en cours?',
        [
          {
            text: 'Non',
            style: 'cancel'
          },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: () => cancelGeneration(currentRequest.id)
          }
        ]
      );
    }
  };

  const handleDownload = () => {
    if (currentRequest) {
      downloadResults(currentRequest.id);
    }
  };

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-red-50">
        <Text className="text-lg font-bold text-red-800 mb-2">
          ❌ Erreur
        </Text>
        <Text className="text-red-700 text-center mb-4">
          {error}
        </Text>
        <TouchableOpacity
          className="bg-red-600 px-6 py-3 rounded-lg"
          onPress={resetError}
        >
          <Text className="text-white font-medium">
            Réessayer
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isGenerating) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        {/* En-tête */}
        <View className="p-4 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            🔄 Génération en cours...
          </Text>
          <Text className="text-gray-600">
            Dataset: {datasetName}
          </Text>
        </View>

        {/* Progression */}
        <View className="p-4 bg-white">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-gray-800">
              Progression
            </Text>
            <Text className="text-blue-600 font-bold">
              {Math.round(progress)}%
            </Text>
          </View>
          
          <View className="bg-gray-200 h-3 rounded-full overflow-hidden">
            <View 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </View>
          
          <Text className="text-sm text-gray-600 mt-2">
            {currentRequest?.status === 'processing' 
              ? 'Génération des données synthétiques...'
              : 'Initialisation...'
            }
          </Text>
        </View>

        {/* Détails de la requête */}
        {currentRequest && (
          <View className="p-4 bg-white border-t border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              📋 Détails de la génération
            </Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">ID de requête:</Text>
                <Text className="text-gray-800 font-medium">#{currentRequest.id}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Modèle:</Text>
                <Text className="text-gray-800 font-medium">
                  {currentRequest.config.model_type.toUpperCase()}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Mode:</Text>
                <Text className="text-gray-800 font-medium">
                  {currentRequest.config.mode === 'optimization' ? 'Optimisation' : 'Simple'}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Échantillons:</Text>
                <Text className="text-gray-800 font-medium">
                  {currentRequest.config.sample_size.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bouton d'annulation */}
        <View className="p-4">
          <TouchableOpacity
            className="bg-red-600 py-3 px-6 rounded-lg items-center"
            onPress={handleCancelGeneration}
          >
            <Text className="text-white font-bold">
              ❌ Annuler la génération
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (currentRequest?.status === 'completed') {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        {/* Succès */}
        <View className="p-4 bg-green-50 border-b border-green-200">
          <Text className="text-xl font-bold text-green-800 mb-2">
            ✅ Génération terminée!
          </Text>
          <Text className="text-green-700">
            Vos données synthétiques sont prêtes à être téléchargées.
          </Text>
        </View>

        {/* Statistiques */}
        <View className="p-4 bg-white">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            📊 Résultats
          </Text>
          
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Lignes générées:</Text>
              <Text className="text-gray-800 font-bold">
                {currentRequest.config.sample_size.toLocaleString()}
              </Text>
            </View>
            
            {currentRequest.config.mode === 'optimization' && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Optimisation:</Text>
                <Text className="text-green-600 font-bold">
                  ✓ Paramètres optimisés
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="p-4">
          <TouchableOpacity
            className="bg-blue-600 py-4 px-6 rounded-lg items-center mb-3"
            onPress={handleDownload}
          >
            <Text className="text-white font-bold text-lg">
              📥 Télécharger les données
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-gray-200 py-3 px-6 rounded-lg items-center"
            onPress={() => {
              // Reset pour recommencer
              resetError();
            }}
          >
            <Text className="text-gray-700 font-medium">
              🔄 Nouvelle génération
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Interface de configuration par défaut
  return (
    <View className="flex-1 bg-gray-50">
      {/* En-tête */}
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">
          🤖 Génération de données synthétiques
        </Text>
        <Text className="text-gray-600">
          Dataset: {datasetName}
        </Text>
      </View>

      {/* Composant de configuration */}
      <GenerationConfigComponent
        datasetId={datasetId}
        onStartGeneration={handleStartGeneration}
        disabled={isGenerating}
      />
    </View>
  );
};

export default GenerationScreen;

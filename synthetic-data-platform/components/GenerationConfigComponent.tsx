/**
 * Composant principal pour la configuration de génération avec optimisation
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import HyperparameterSelector from './HyperparameterSelector';
import SampleSizeSelector from './SampleSizeSelector';

interface GenerationConfigProps {
  datasetId: number;
  onStartGeneration: (config: GenerationConfig) => void;
  disabled?: boolean;
}

export interface GenerationConfig {
  // Paramètres de base
  dataset_id: number;
  model_type: 'ctgan' | 'tvae';
  sample_size: number;
  
  // Paramètres avancés
  epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  
  // Configuration d'optimisation
  optimization_method: 'none' | 'grid' | 'random' | 'bayesian';
  n_trials?: number;
  hyperparameters?: string[];
  
  // Mode de génération
  mode: 'simple' | 'optimization';
}

const GenerationConfigComponent: React.FC<GenerationConfigProps> = ({
  datasetId,
  onStartGeneration,
  disabled = false
}) => {
  // États principaux
  const [modelType, setModelType] = useState<'ctgan' | 'tvae'>('ctgan');
  const [sampleSize, setSampleSize] = useState<number>(2000);
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState<boolean>(false);
  
  // Paramètres d'optimisation
  const [optimizationMethod, setOptimizationMethod] = useState<'grid' | 'random' | 'bayesian'>('bayesian');
  const [nTrials] = useState<number>(10); // TODO: Ajouter UI pour modifier
  const [selectedHyperparameters, setSelectedHyperparameters] = useState<string[]>(['epochs', 'batch_size']);
  
  // Paramètres manuels (pour mode simple)
  const [manualEpochs] = useState<number>(300); // TODO: Ajouter slider
  const [manualBatchSize] = useState<number>(500); // TODO: Ajouter slider
  const [manualLearningRate, setManualLearningRate] = useState<number>(0.0002);

  const handleModelTypeChange = (newModelType: 'ctgan' | 'tvae') => {
    setModelType(newModelType);
    // Réinitialiser les hyperparamètres sélectionnés selon le modèle
    if (newModelType === 'ctgan') {
      setSelectedHyperparameters(['epochs', 'batch_size']);
      setManualLearningRate(0.0002);
    } else {
      setSelectedHyperparameters(['epochs', 'batch_size']);
      setManualLearningRate(0.001);
    }
  };

  const handleStartGeneration = () => {
    // Validation
    if (isOptimizationEnabled && selectedHyperparameters.length === 0) {
      Alert.alert(
        'Configuration incomplète',
        'Veuillez sélectionner au moins un hyperparamètre à optimiser.'
      );
      return;
    }

    if (sampleSize < 100 || sampleSize > 100000) {
      Alert.alert(
        'Taille invalide',
        'La taille d\'échantillons doit être entre 100 et 100,000.'
      );
      return;
    }

    // Construire la configuration
    const config: GenerationConfig = {
      dataset_id: datasetId,
      model_type: modelType,
      sample_size: sampleSize,
      mode: isOptimizationEnabled ? 'optimization' : 'simple',
      optimization_method: isOptimizationEnabled ? optimizationMethod : 'none',
    };

    if (isOptimizationEnabled) {
      config.n_trials = nTrials;
      config.hyperparameters = selectedHyperparameters;
    } else {
      config.epochs = manualEpochs;
      config.batch_size = manualBatchSize;
      config.learning_rate = manualLearningRate;
    }

    onStartGeneration(config);
  };

  const getEstimatedTimeTotal = (): string => {
    const baseTime = sampleSize <= 2000 ? 5 : sampleSize <= 10000 ? 15 : 30;
    
    if (isOptimizationEnabled) {
      const optimizationMultiplier = nTrials * 0.8; // Chaque trial prend ~80% du temps de base
      return `~${Math.ceil(baseTime * optimizationMultiplier)} minutes`;
    }
    
    return `~${baseTime} minutes`;
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* En-tête */}
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800 mb-2">
          Configuration de génération
        </Text>
        <Text className="text-sm text-gray-600">
          Configurez les paramètres pour votre demande de génération de données synthétiques
        </Text>
      </View>

      {/* Sélection du modèle */}
      <View className="p-4 bg-white border-b border-gray-100">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Modèle d&apos;IA
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            className={`
              flex-1 p-4 rounded-lg border-2
              ${modelType === 'ctgan' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
              ${disabled ? 'opacity-60' : ''}
            `}
            onPress={() => handleModelTypeChange('ctgan')}
            disabled={disabled}
          >
            <Text className={`font-bold text-center ${modelType === 'ctgan' ? 'text-blue-600' : 'text-gray-800'}`}>
              CTGAN
            </Text>
            <Text className={`text-xs text-center mt-1 ${modelType === 'ctgan' ? 'text-blue-600' : 'text-gray-600'}`}>
              Générateur Adversarial
            </Text>
            <Text className={`text-xs text-center mt-1 ${modelType === 'ctgan' ? 'text-blue-500' : 'text-gray-500'}`}>
              Recommandé pour la plupart des cas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`
              flex-1 p-4 rounded-lg border-2
              ${modelType === 'tvae' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
              ${disabled ? 'opacity-60' : ''}
            `}
            onPress={() => handleModelTypeChange('tvae')}
            disabled={disabled}
          >
            <Text className={`font-bold text-center ${modelType === 'tvae' ? 'text-blue-600' : 'text-gray-800'}`}>
              TVAE
            </Text>
            <Text className={`text-xs text-center mt-1 ${modelType === 'tvae' ? 'text-blue-600' : 'text-gray-600'}`}>
              Auto-Encodeur Variationnel
            </Text>
            <Text className={`text-xs text-center mt-1 ${modelType === 'tvae' ? 'text-blue-500' : 'text-gray-500'}`}>
              Bon pour données complexes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode de génération */}
      <View className="p-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              Optimisation automatique
            </Text>
            <Text className="text-sm text-gray-600">
              Laisser l&apos;IA trouver les meilleurs paramètres
            </Text>
          </View>
          <Switch
            value={isOptimizationEnabled}
            onValueChange={setIsOptimizationEnabled}
            disabled={disabled}
            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
            thumbColor={isOptimizationEnabled ? '#ffffff' : '#ffffff'}
          />
        </View>

        {isOptimizationEnabled && (
          <View className="mt-4 p-3 bg-blue-50 rounded-lg">
            <Text className="text-sm text-blue-800 font-medium mb-2">
              🔬 Mode optimisation activé
            </Text>
            <Text className="text-xs text-blue-700">
              L&apos;IA testera automatiquement différentes combinaisons de paramètres pour 
              trouver la configuration optimale pour vos données.
            </Text>
          </View>
        )}
      </View>

      {/* Configuration d'optimisation */}
      {isOptimizationEnabled && (
        <>
          <View className="p-4 bg-white border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Méthode d&apos;optimisation
            </Text>
            <View className="space-y-2">
              {[
                { key: 'bayesian', label: 'Bayésienne', desc: 'Intelligente - Recommandée' },
                { key: 'random', label: 'Aléatoire', desc: 'Rapide - Exploration large' },
                { key: 'grid', label: 'Grille', desc: 'Exhaustive - Plus lente' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.key}
                  className={`
                    p-3 rounded-lg border
                    ${optimizationMethod === method.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                  `}
                  onPress={() => setOptimizationMethod(method.key as any)}
                  disabled={disabled}
                >
                  <Text className={`font-medium ${optimizationMethod === method.key ? 'text-blue-600' : 'text-gray-800'}`}>
                    {method.label}
                  </Text>
                  <Text className={`text-sm ${optimizationMethod === method.key ? 'text-blue-600' : 'text-gray-600'}`}>
                    {method.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <HyperparameterSelector
            modelType={modelType}
            selectedHyperparameters={selectedHyperparameters}
            onSelectionChange={setSelectedHyperparameters}
            disabled={disabled}
          />
        </>
      )}

      {/* Paramètres manuels (mode simple) */}
      {!isOptimizationEnabled && (
        <View className="p-4 bg-white border-b border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Paramètres manuels
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Utilisez les valeurs par défaut ou ajustez selon vos besoins
          </Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Époques: {manualEpochs}</Text>
              <View className="bg-gray-200 h-1 rounded-full">
                <View 
                  className="bg-blue-500 h-1 rounded-full" 
                  style={{ width: `${(manualEpochs / 500) * 100}%` }}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1">100 - 500 (défaut: 300)</Text>
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Taille de batch: {manualBatchSize}</Text>
              <View className="bg-gray-200 h-1 rounded-full">
                <View 
                  className="bg-blue-500 h-1 rounded-full" 
                  style={{ width: `${((manualBatchSize - 250) / 750) * 100}%` }}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1">250 - 1000 (défaut: 500)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Sélection de la taille */}
      <SampleSizeSelector
        selectedSize={sampleSize}
        onSizeChange={setSampleSize}
        disabled={disabled}
      />

      {/* Résumé et bouton de lancement */}
      <View className="p-4 bg-white border-t border-gray-200">
        <View className="bg-gray-50 p-4 rounded-lg mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            📋 Résumé de la configuration
          </Text>
          <View className="space-y-1">
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Modèle:</Text> {modelType.toUpperCase()}
            </Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Mode:</Text> {isOptimizationEnabled ? 'Optimisation automatique' : 'Configuration manuelle'}
            </Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Échantillons:</Text> {sampleSize.toLocaleString()} lignes
            </Text>
            {isOptimizationEnabled && (
              <>
                <Text className="text-sm text-gray-700">
                  <Text className="font-medium">Méthode:</Text> {optimizationMethod}
                </Text>
                <Text className="text-sm text-gray-700">
                  <Text className="font-medium">Hyperparamètres:</Text> {selectedHyperparameters.join(', ') || 'Aucun'}
                </Text>
              </>
            )}
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Temps estimé:</Text> {getEstimatedTimeTotal()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className={`
            py-4 px-6 rounded-lg items-center
            ${disabled || (isOptimizationEnabled && selectedHyperparameters.length === 0)
              ? 'bg-gray-300'
              : 'bg-blue-600'
            }
          `}
          onPress={handleStartGeneration}
          disabled={disabled || (isOptimizationEnabled && selectedHyperparameters.length === 0)}
        >
          <Text className={`
            font-bold text-lg
            ${disabled || (isOptimizationEnabled && selectedHyperparameters.length === 0)
              ? 'text-gray-500'
              : 'text-white'
            }
          `}>
            � Soumettre la demande
          </Text>
          <Text className={`
            text-sm mt-1
            ${disabled || (isOptimizationEnabled && selectedHyperparameters.length === 0)
              ? 'text-gray-500'
              : 'text-blue-100'
            }
          `}>
            {isOptimizationEnabled ? 'Avec optimisation' : 'Configuration simple'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default GenerationConfigComponent;

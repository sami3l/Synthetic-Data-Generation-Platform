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
  model_type: 'ctgan' | 'tvae' | 'gaussian_copula';
  sample_size: number;
  
  // Paramètres avancés communs
  epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  
  // Paramètres spécifiques à Gaussian Copula
  distribution?: 'parametric' | 'bounded' | 'truncated';
  categorical_transformer?: 'one_hot' | 'categorical';
  default_distribution?: 'norm' | 'uniform' | 'truncnorm';
  
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
  const [modelType, setModelType] = useState<'ctgan' | 'tvae' | 'gaussian_copula'>('ctgan');
  const [sampleSize, setSampleSize] = useState<number>(2000);
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState<boolean>(false);
  
  // Paramètres d'optimisation
  const [optimizationMethod, setOptimizationMethod] = useState<'grid' | 'random' | 'bayesian'>('bayesian');
  const [nTrials] = useState<number>(10); // TODO: Ajouter UI pour modifier
  const [selectedHyperparameters, setSelectedHyperparameters] = useState<string[]>(['epochs', 'batch_size']);
  
  // Paramètres manuels (pour mode simple)
  const [manualEpochs, setManualEpochs] = useState<number>(300);
  const [manualBatchSize, setManualBatchSize] = useState<number>(500);
  const [manualLearningRate, setManualLearningRate] = useState<number>(0.0002);

  // Paramètres manuels pour Gaussian Copula
  const [gaussianDistribution, setGaussianDistribution] = useState<'parametric' | 'bounded' | 'truncated'>('parametric');
  const [gaussianCategoricalTransformer, setGaussianCategoricalTransformer] = useState<'one_hot' | 'categorical'>('one_hot');
  const [gaussianDefaultDistribution, setGaussianDefaultDistribution] = useState<'norm' | 'uniform' | 'truncnorm'>('norm');

  const handleModelTypeChange = (newModelType: 'ctgan' | 'tvae' | 'gaussian_copula') => {
    setModelType(newModelType);
    // Réinitialiser les hyperparamètres sélectionnés selon le modèle
    if (newModelType === 'ctgan') {
      setSelectedHyperparameters(['epochs', 'batch_size']);
      setManualLearningRate(0.0002);
    } else if (newModelType === 'tvae') {
      setSelectedHyperparameters(['epochs', 'batch_size']);
      setManualLearningRate(0.001);
    } else if (newModelType === 'gaussian_copula') {
      setSelectedHyperparameters(['distribution', 'categorical_transformer']);
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
      // Paramètres pour mode simple selon le type de modèle
      if (modelType === 'gaussian_copula') {
        config.distribution = gaussianDistribution;
        config.categorical_transformer = gaussianCategoricalTransformer;
        config.default_distribution = gaussianDefaultDistribution;
      } else {
        config.epochs = manualEpochs;
        config.batch_size = manualBatchSize;
        config.learning_rate = manualLearningRate;
      }
    }

    onStartGeneration(config);
  };

  const getEstimatedTimeTotal = (): string => {
    let baseTime = sampleSize <= 2000 ? 5 : sampleSize <= 10000 ? 15 : 30;
    
    // Ajuster selon le type de modèle
    if (modelType === 'gaussian_copula') {
      baseTime *= 0.6; // Gaussian Copula est généralement plus rapide
    }
    
    if (isOptimizationEnabled) {
      const optimizationMultiplier = nTrials * 0.8; // Chaque trial prend ~80% du temps de base
      return `~${Math.ceil(baseTime * optimizationMultiplier)} minutes`;
    }
    
    return `~${Math.ceil(baseTime)} minutes`;
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

          <TouchableOpacity
            className={`
              flex-1 p-4 rounded-lg border-2
              ${modelType === 'gaussian_copula' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
              ${disabled ? 'opacity-60' : ''}
            `}
            onPress={() => handleModelTypeChange('gaussian_copula')}
            disabled={disabled}
          >
            <Text className={`font-bold text-center ${modelType === 'gaussian_copula' ? 'text-blue-600' : 'text-gray-800'}`}>
              Gaussian Copula
            </Text>
            <Text className={`text-xs text-center mt-1 ${modelType === 'gaussian_copula' ? 'text-blue-600' : 'text-gray-600'}`}>
              Couplage Gaussien
            </Text>
            <Text className={`text-xs text-center mt-1 ${modelType === 'gaussian_copula' ? 'text-blue-500' : 'text-gray-500'}`}>
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
              Choose your optimization settings
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
            Ajustez les paramètres selon vos besoins et contraintes
          </Text>
          {/* Paramètres pour CTGAN/TVAE */}
          {(modelType === 'ctgan' || modelType === 'tvae') && (
            <View className="space-y-4">
              {/* Époques */}
              <View className='mb-4'>
                <Text className="text-base font-medium text-gray-700 mb-2">
                  Nombre d&apos;époques : 
                </Text>
                <View className="flex-row gap-2 mb-2">
                  {[100, 200, 300, 500, 1000].map((epochs) => (
                    <TouchableOpacity
                      key={epochs}
                      className={`
                        flex-1 p-2 rounded-lg border
                        ${manualEpochs === epochs ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                      `}
                      onPress={() => setManualEpochs(epochs)}
                      disabled={disabled}
                    >
                      <Text className={`font-medium text-center text-xs ${manualEpochs === epochs ? 'text-blue-600' : 'text-gray-800'}`}>
                        {epochs}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className='bg-gray-100 p-2 rounded-full min-w-min '>
                  <Text className="text-xs text-center text-gray-500">Plage recommandée: 100-1000 (défaut: 300)</Text>
                </View>
              </View>
              
              {/* Taille de batch */}
              <View className='mb-4'>
                <Text className="text-base font-medium text-gray-700 mb-2">
                  Taille de batch :
                </Text>
                <View className="flex-row gap-2 mb-2">
                  {[250, 500, 1000, 1500, 2000].map((batch) => (
                    <TouchableOpacity
                      key={batch}
                      className={`
                        flex-1 p-2 rounded-lg border
                        ${manualBatchSize === batch ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                      `}
                      onPress={() => setManualBatchSize(batch)}
                      disabled={disabled}
                    >
                      <Text className={`font-medium text-center text-xs ${manualBatchSize === batch ? 'text-blue-600' : 'text-gray-800'}`}>
                        {batch}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                 <View className='bg-gray-100 p-2 rounded-full min-w-min '>
                <Text className="text-xs text-center text-gray-500">Plage recommandée: 250-2000 (défaut: 500)</Text>
                </View>
              </View>

              {/* Learning Rate */}
              <View className='mb-4'>
                <Text className="text-base font-medium text-gray-700 mb-2">
                  Taux d&apos;apprentissage :
                </Text>

                <View className="flex-row gap-2 mb-2">
                  {[0.0001, 0.0002, 0.0005, 0.001, 0.002].map((lr) => (
                    <TouchableOpacity
                      key={lr}
                      className={`
                        flex-1 p-2 rounded-lg border
                        ${manualLearningRate === lr ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                      `}
                      onPress={() => setManualLearningRate(lr)}
                      disabled={disabled}
                    >
                      <Text className={`font-medium text-center text-xs ${manualLearningRate === lr ? 'text-blue-600' : 'text-gray-800'}`}>
                        {lr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                 <View className='bg-gray-100 p-2 rounded-full min-w-min '>
                <Text className="text-xs text-center text-gray-500">
                  Défaut: {modelType === 'ctgan' ? '0.0002' : '0.001'}
                </Text>
                </View>
              </View>
            </View>
          )}

          {/* Paramètres pour Gaussian Copula */}
          {modelType === 'gaussian_copula' && (
            <View className="space-y-4">
              {/* Distribution Type */}
              <View className='mb-4'>
                <Text className="text-lg font-medium text-gray-700 mb-2">
                  Type de distribution
                </Text>
                <Text className="text-xs text-gray-500 mb-3">
                  Méthode pour modéliser les variables numériques
                </Text>
                <View className="space-y-2">
                  {[
                    { value: 'parametric', label: 'Paramétrique', desc: 'Distributions standard (recommandé)' },
                    { value: 'bounded', label: 'Bornée', desc: 'Pour données avec limites strictes' },
                    { value: 'truncated', label: 'Tronquée', desc: 'Distributions coupées' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`
                        p-3 rounded-lg border mb-3
                        ${gaussianDistribution === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                      `}
                      onPress={() => setGaussianDistribution(option.value as any)}
                      disabled={disabled}
                    >
                      <Text className={`font-medium ${gaussianDistribution === option.value ? 'text-blue-600' : 'text-gray-800'}`}>
                        {option.label}
                      </Text>
                      <Text className={`text-xs ${gaussianDistribution === option.value ? 'text-blue-600' : 'text-gray-600'}`}>
                        {option.desc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Categorical Transformer */}
              <View className='mb-4'>
                <Text className="text-lg font-medium text-gray-700 mb-2">
                  Encodage catégoriel
                </Text>
                <Text className="text-xs text-gray-500 mb-3">
                  Méthode de transformation des colonnes catégorielles
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={`
                      flex-1 p-3 rounded-lg border
                      ${gaussianCategoricalTransformer === 'one_hot' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                    `}
                    onPress={() => setGaussianCategoricalTransformer('one_hot')}
                    disabled={disabled}
                  >
                    <Text className={`font-medium text-center ${gaussianCategoricalTransformer === 'one_hot' ? 'text-blue-600' : 'text-gray-800'}`}>
                      One-Hot
                    </Text>
                    <Text className={`text-xs text-center ${gaussianCategoricalTransformer === 'one_hot' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Recommandé
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`
                      flex-1 p-3 rounded-lg border
                      ${gaussianCategoricalTransformer === 'categorical' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                    `}
                    onPress={() => setGaussianCategoricalTransformer('categorical')}
                    disabled={disabled}
                  >
                    <Text className={`font-medium text-center ${gaussianCategoricalTransformer === 'categorical' ? 'text-blue-600' : 'text-gray-800'}`}>
                      Catégoriel
                    </Text>
                    <Text className={`text-xs text-center ${gaussianCategoricalTransformer === 'categorical' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Compact
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Default Distribution */}
              <View>
                <Text className="text-lg font-medium text-gray-700 mb-2">
                  Distribution de fallback
                </Text>
                <Text className="text-xs text-gray-500 mb-3">
                  Utilisée si l&apos;estimation automatique échoue
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { value: 'norm', label: 'Normale' },
                    { value: 'uniform', label: 'Uniforme' },
                    { value: 'truncnorm', label: 'Normale tronquée' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`
                        flex-1 p-3 rounded-lg border
                        ${gaussianDefaultDistribution === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                      `}
                      onPress={() => setGaussianDefaultDistribution(option.value as any)}
                      disabled={disabled}
                    >
                      <Text className={`font-medium text-center text-xs ${gaussianDefaultDistribution === option.value ? 'text-blue-600' : 'text-gray-800'}`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
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
            {!isOptimizationEnabled && (
              <>
                {modelType === 'gaussian_copula' ? (
                  <>
                    <Text className="text-sm text-gray-700">
                      <Text className="font-medium">Distribution:</Text> {gaussianDistribution}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      <Text className="font-medium">Encodage:</Text> {gaussianCategoricalTransformer}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      <Text className="font-medium">Fallback:</Text> {gaussianDefaultDistribution}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-sm text-gray-700">
                      <Text className="font-medium">Époques:</Text> {manualEpochs}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      <Text className="font-medium">Batch size:</Text> {manualBatchSize}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      <Text className="font-medium">Learning rate:</Text> {manualLearningRate}
                    </Text>
                  </>
                )}
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
           Soumettre la demande
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

/**
 * Composant pour la sélection de la taille d'échantillons à générer
 */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';

interface SampleSizeSelectorProps {
  selectedSize: number;
  onSizeChange: (size: number) => void;
  disabled?: boolean;
  maxSize?: number;
  minSize?: number;
}

const PRESET_SIZES = [
  { value: 1000, label: '1K', description: 'Rapide - Idéal pour les tests' },
  { value: 2000, label: '2K', description: 'Équilibré - Usage général' },
  { value: 5000, label: '5K', description: 'Détaillé - Analyses avancées' },
  { value: 10000, label: '10K', description: 'Large - Production' },
  { value: 20000, label: '20K', description: 'Très large - Big Data' },
  { value: 50000, label: '50K', description: 'Massive - Recherche' },
];

const SampleSizeSelector: React.FC<SampleSizeSelectorProps> = ({
  selectedSize,
  onSizeChange,
  disabled = false,
  maxSize = 100000,
  minSize = 100
}) => {
  const [customSize, setCustomSize] = React.useState<string>(selectedSize.toString());
  const [isCustomMode, setIsCustomMode] = React.useState<boolean>(
    !PRESET_SIZES.some(preset => preset.value === selectedSize)
  );

  const handlePresetSelect = (size: number) => {
    if (disabled) return;
    
    onSizeChange(size);
    setCustomSize(size.toString());
    setIsCustomMode(false);
  };

  const handleCustomSizeChange = (text: string) => {
    setCustomSize(text);
    
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= minSize && numValue <= maxSize) {
      onSizeChange(numValue);
    }
  };

  const validateAndApplyCustomSize = () => {
    const numValue = parseInt(customSize, 10);
    
    if (isNaN(numValue)) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre valide');
      setCustomSize(selectedSize.toString());
      return;
    }
    
    if (numValue < minSize) {
      Alert.alert('Erreur', `La taille minimale est ${minSize.toLocaleString()}`);
      setCustomSize(minSize.toString());
      onSizeChange(minSize);
      return;
    }
    
    if (numValue > maxSize) {
      Alert.alert('Erreur', `La taille maximale est ${maxSize.toLocaleString()}`);
      setCustomSize(maxSize.toString());
      onSizeChange(maxSize);
      return;
    }
    
    onSizeChange(numValue);
  };

  const getEstimatedTime = (size: number): string => {
    // Estimation basée sur la taille (très approximative)
    if (size <= 1000) return '~2-5 min';
    if (size <= 5000) return '~5-15 min';
    if (size <= 10000) return '~15-30 min';
    if (size <= 20000) return '~30-60 min';
    if (size <= 50000) return '~1-2 heures';
    return '~2+ heures';
  };

  const getMemoryEstimate = (size: number): string => {
    // Estimation mémoire approximative (dépend des colonnes)
    const mbEstimate = Math.ceil((size * 0.001)); // ~1KB par ligne
    if (mbEstimate < 1) return '< 1 MB';
    if (mbEstimate < 1000) return `~${mbEstimate} MB`;
    return `~${(mbEstimate / 1000).toFixed(1)} GB`;
  };

  return (
    <View className="bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 mb-1">
          Taille d&apos;échantillons à générer
        </Text>
        <Text className="text-sm text-gray-600">
          Choisissez le nombre de lignes de données synthétiques à créer
        </Text>
      </View>

      {/* Tailles prédéfinies */}
      <View className="p-4 bg-white">
        <Text className="text-base font-medium text-gray-700 mb-3">
          Tailles recommandées
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PRESET_SIZES.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              className={`
                flex-1 min-w-[120px] p-3 rounded-lg border-2
                ${selectedSize === preset.value && !isCustomMode
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
                }
                ${disabled ? 'opacity-60' : ''}
              `}
              onPress={() => handlePresetSelect(preset.value)}
              disabled={disabled}
            >
              <Text className={`
                text-center font-bold text-lg
                ${selectedSize === preset.value && !isCustomMode
                  ? 'text-blue-600'
                  : 'text-gray-800'
                }
              `}>
                {preset.label}
              </Text>
              <Text className={`
                text-center text-xs mt-1
                ${selectedSize === preset.value && !isCustomMode
                  ? 'text-blue-600'
                  : 'text-gray-600'
                }
              `}>
                {preset.value.toLocaleString()} lignes
              </Text>
              <Text className={`
                text-center text-xs mt-1
                ${selectedSize === preset.value && !isCustomMode
                  ? 'text-blue-500'
                  : 'text-gray-500'
                }
              `}>
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mode personnalisé */}
      <View className="p-4 bg-white border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-medium text-gray-700">
            Taille personnalisée
          </Text>
          <TouchableOpacity
            className={`
              px-3 py-1 rounded-full border
              ${isCustomMode
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
              }
            `}
            onPress={() => setIsCustomMode(!isCustomMode)}
            disabled={disabled}
          >
            <Text className={`text-sm ${isCustomMode ? 'text-blue-600' : 'text-gray-600'}`}>
              {isCustomMode ? 'Activé' : 'Activer'}
            </Text>
          </TouchableOpacity>
        </View>

        {isCustomMode && (
          <View className="space-y-3">
            <View className="flex-row items-center space-x-2">
              <TextInput
                className={`
                  flex-1 px-3 py-2 border rounded-lg bg-white
                  ${disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300'}
                `}
                value={customSize}
                onChangeText={handleCustomSizeChange}
                onBlur={validateAndApplyCustomSize}
                placeholder={`Entre ${minSize.toLocaleString()} et ${maxSize.toLocaleString()}`}
                keyboardType="numeric"
                editable={!disabled}
              />
              <Text className="text-sm text-gray-600 w-16">lignes</Text>
            </View>
            
            <Text className="text-xs text-gray-500">
              Limite: {minSize.toLocaleString()} - {maxSize.toLocaleString()} lignes
            </Text>
          </View>
        )}
      </View>

      {/* Informations sur la sélection */}
      <View className="p-4 bg-blue-50 border-t border-blue-100">
        <Text className="text-base font-semibold text-blue-800 mb-2">
          Sélection actuelle: {selectedSize.toLocaleString()} lignes
        </Text>
        
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-sm text-blue-700 font-medium">
              ⏱️ Temps estimé
            </Text>
            <Text className="text-sm text-blue-600">
              {getEstimatedTime(selectedSize)}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-sm text-blue-700 font-medium">
              💾 Mémoire approx.
            </Text>
            <Text className="text-sm text-blue-600">
              {getMemoryEstimate(selectedSize)}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-sm text-blue-700 font-medium">
              📊 Qualité attendue
            </Text>
            <Text className="text-sm text-blue-600">
              {selectedSize >= 10000 ? 'Excellente' : 
               selectedSize >= 5000 ? 'Très bonne' : 
               selectedSize >= 2000 ? 'Bonne' : 'Correcte'}
            </Text>
          </View>
        </View>

        {selectedSize > 20000 && (
          <View className="mt-3 p-2 bg-yellow-100 rounded-lg border border-yellow-200">
            <Text className="text-xs text-yellow-800">
              ⚠️ Génération large: Assurez-vous d&apos;avoir suffisamment de temps et de ressources
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default SampleSizeSelector;

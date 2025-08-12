/**
 * Composant pour la sélection des hyperparamètres à optimiser
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { 
  HyperparameterOption, 
  AVAILABLE_HYPERPARAMETERS 
} from '@/services/api/syntheticDataGenerationService';

interface HyperparameterSelectorProps {
  modelType: 'ctgan' | 'tvae';
  selectedHyperparameters: string[];
  onSelectionChange: (selected: string[]) => void;
  disabled?: boolean;
}

const HyperparameterSelector: React.FC<HyperparameterSelectorProps> = ({
  modelType,
  selectedHyperparameters,
  onSelectionChange,
  disabled = false
}) => {
  const availableHyperparameters = AVAILABLE_HYPERPARAMETERS[modelType];

  const toggleHyperparameter = (hyperparamName: string) => {
    if (disabled) return;

    const isSelected = selectedHyperparameters.includes(hyperparamName);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedHyperparameters.filter(h => h !== hyperparamName);
    } else {
      newSelection = [...selectedHyperparameters, hyperparamName];
    }

    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    if (disabled) return;
    onSelectionChange(availableHyperparameters.map(h => h.name));
  };

  const selectNone = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const selectRecommended = () => {
    if (disabled) return;
    // Sélectionner epochs et batch_size par défaut comme recommandés
    const recommended = ['epochs', 'batch_size'];
    onSelectionChange(recommended.filter(h => 
      availableHyperparameters.some(ah => ah.name === h)
    ));
  };

  const renderHyperparameterItem = (hyperparam: HyperparameterOption) => {
    const isSelected = selectedHyperparameters.includes(hyperparam.name);
    
    return (
      <TouchableOpacity
        key={hyperparam.name}
        className={`
          bg-white mx-4 my-1 rounded-lg p-3 border
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          ${disabled ? 'opacity-60' : ''}
        `}
        onPress={() => toggleHyperparameter(hyperparam.name)}
        disabled={disabled}
      >
        <View className="flex-row items-start">
          <TouchableOpacity
            className={`
              w-5 h-5 border-2 rounded mr-3 items-center justify-center
              ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
            `}
            onPress={() => toggleHyperparameter(hyperparam.name)}
            disabled={disabled}
          >
            {isSelected && <Text className="text-white text-sm font-bold">✓</Text>}
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={`text-base font-semibold mb-1 ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
              {hyperparam.label}
            </Text>
            <Text className={`text-sm mb-2 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {hyperparam.description}
            </Text>
          </View>
        </View>
        
        <View className="mt-2 pt-2 border-t border-gray-100">
          <Text className={`text-xs mb-0.5 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            Type: {hyperparam.type}
          </Text>
          <Text className={`text-xs mb-0.5 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            Défaut: {hyperparam.default_value}
          </Text>
          
          {hyperparam.range && (
            <Text className={`text-xs mb-0.5 ${disabled ? 'text-gray-400' : 'text-green-600'}`}>
              Plage: {hyperparam.range.min} - {hyperparam.range.max}
              {hyperparam.range.step && ` (pas: ${hyperparam.range.step})`}
            </Text>
          )}
          
          {hyperparam.choices && (
            <Text className={`text-xs ${disabled ? 'text-gray-400' : 'text-yellow-600'}`}>
              Options: {hyperparam.choices.join(', ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 mb-1">
          Hyperparamètres à optimiser ({modelType.toUpperCase()})
        </Text>
        <Text className="text-sm text-gray-600">
          Sélectionnez les paramètres que vous souhaitez optimiser
        </Text>
      </View>

      <View className="flex-row p-4 bg-white border-b border-gray-200 gap-2">
        <TouchableOpacity 
          className={`flex-1 py-2 px-3 rounded-md items-center ${disabled ? 'bg-gray-50' : 'bg-blue-50'}`}
          onPress={selectRecommended}
          disabled={disabled}
        >
          <Text className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-blue-600'}`}>
            Recommandés
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-2 px-3 rounded-md items-center ${disabled ? 'bg-gray-50' : 'bg-blue-50'}`}
          onPress={selectAll}
          disabled={disabled}
        >
          <Text className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-blue-600'}`}>
            Tout sélectionner
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`flex-1 py-2 px-3 rounded-md items-center ${disabled ? 'bg-gray-50' : 'bg-blue-50'}`}
          onPress={selectNone}
          disabled={disabled}
        >
          <Text className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-blue-600'}`}>
            Aucun
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {availableHyperparameters.map(renderHyperparameterItem)}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <Text className="text-sm font-semibold text-gray-800 mb-1">
          {selectedHyperparameters.length} hyperparamètre(s) sélectionné(s)
        </Text>
        {selectedHyperparameters.length > 0 && (
          <Text className="text-xs text-gray-600 italic">
            {selectedHyperparameters.join(', ')}
          </Text>
        )}
      </View>
    </View>
  );
};

export default HyperparameterSelector;

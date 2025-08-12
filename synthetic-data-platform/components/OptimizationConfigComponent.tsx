import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Button, TextInput, Chip, Switch } from 'react-native-paper';
import { OptimizationConfig, SearchSpace } from '@/types/type';

interface OptimizationConfigProps {
  requestId: number;
  onConfigCreate: (config: OptimizationConfig) => void;
  onCancel: () => void;
}

export const OptimizationConfigComponent: React.FC<OptimizationConfigProps> = ({
  requestId,
  onConfigCreate,
  onCancel
}) => {
  const [optimizationType, setOptimizationType] = useState<'bayesian' | 'grid' | 'random'>('bayesian');
  const [maxEvaluations, setMaxEvaluations] = useState('50');
  const [timeoutMinutes, setTimeoutMinutes] = useState('60');
  const [acquisitionFunction, setAcquisitionFunction] = useState<'expected_improvement' | 'upper_confidence_bound' | 'probability_improvement'>('expected_improvement');
  
  // Search space configuration
  const [epochsMin, setEpochsMin] = useState('100');
  const [epochsMax, setEpochsMax] = useState('1000');
  const [batchSizes, setBatchSizes] = useState(['32', '64', '128', '256', '512']);
  const [enableAdvanced, setEnableAdvanced] = useState(false);

  const handleCreateConfig = () => {
    const searchSpace: SearchSpace = {
      epochs: {
        min_value: parseInt(epochsMin),
        max_value: parseInt(epochsMax),
        step: 50
      },
      batch_size: {
        choices: batchSizes.map(b => parseInt(b))
      }
    };

    if (enableAdvanced) {
      searchSpace.generator_lr = {
        min_value: 0.00001,
        max_value: 0.01,
        scale: 'log'
      };
      searchSpace.discriminator_lr = {
        min_value: 0.00001,
        max_value: 0.01,
        scale: 'log'
      };
    }

    const config: OptimizationConfig = {
      request_id: requestId,
      optimization_type: optimizationType,
      max_evaluations: parseInt(maxEvaluations),
      timeout_minutes: parseInt(timeoutMinutes),
      search_space: searchSpace,
      acquisition_function: acquisitionFunction
    };

    onConfigCreate(config);
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Card className="mb-4">
        <Card.Content className="p-5">
          <Text className="text-lg font-bold mb-4">Optimization Configuration</Text>
          
          {/* Type d'optimisation */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Optimization Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {['bayesian', 'grid', 'random'].map((type) => (
                <Chip
                  key={type}
                  selected={optimizationType === type}
                  onPress={() => setOptimizationType(type as any)}
                  mode={optimizationType === type ? 'flat' : 'outlined'}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>
          </View>

          {/* Paramètres généraux */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Max Evaluations</Text>
            <TextInput
              mode="outlined"
              value={maxEvaluations}
              onChangeText={setMaxEvaluations}
              keyboardType="numeric"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Timeout (minutes)</Text>
            <TextInput
              mode="outlined"
              value={timeoutMinutes}
              onChangeText={setTimeoutMinutes}
              keyboardType="numeric"
            />
          </View>

          {/* Fonction d'acquisition pour Bayésien */}
          {optimizationType === 'bayesian' && (
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2">Acquisition Function</Text>
              <View className="flex-row flex-wrap gap-2">
                {['expected_improvement', 'upper_confidence_bound', 'probability_improvement'].map((func) => (
                  <Chip
                    key={func}
                    selected={acquisitionFunction === func}
                    onPress={() => setAcquisitionFunction(func as 'expected_improvement' | 'upper_confidence_bound' | 'probability_improvement')}
                    mode={acquisitionFunction === func ? 'flat' : 'outlined'}
                  >
                    {func.replace('_', ' ').toUpperCase()}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Search Space Configuration */}
      <Card className="mb-4">
        <Card.Content className="p-5">
          <Text className="text-lg font-bold mb-4">Search Space</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Epochs Range</Text>
            <View className="flex-row gap-2">
              <TextInput
                mode="outlined"
                label="Min"
                value={epochsMin}
                onChangeText={setEpochsMin}
                keyboardType="numeric"
                className="flex-1"
              />
              <TextInput
                mode="outlined"
                label="Max"
                value={epochsMax}
                onChangeText={setEpochsMax}
                keyboardType="numeric"
                className="flex-1"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Batch Sizes</Text>
            <View className="flex-row flex-wrap gap-2">
              {['32', '64', '128', '256', '512'].map((size) => (
                <Chip
                  key={size}
                  selected={batchSizes.includes(size)}
                  onPress={() => {
                    if (batchSizes.includes(size)) {
                      setBatchSizes(batchSizes.filter(b => b !== size));
                    } else {
                      setBatchSizes([...batchSizes, size]);
                    }
                  }}
                  mode={batchSizes.includes(size) ? 'flat' : 'outlined'}
                >
                  {size}
                </Chip>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-sm font-medium">Advanced Parameters</Text>
            <Switch
              value={enableAdvanced}
              onValueChange={setEnableAdvanced}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View className="flex-row gap-3">
        <Button 
          mode="outlined" 
          onPress={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleCreateConfig}
          className="flex-1"
        >
          Start Optimization
        </Button>
      </View>
    </ScrollView>
  );
};
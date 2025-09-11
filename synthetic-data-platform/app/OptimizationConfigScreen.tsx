import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, TextInput, Chip } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/api/authService';
import HyperparameterSelector from '@/components/HyperparameterSelector';
import SampleSizeSelector from '@/components/SampleSizeSelector';

export default function OptimizationConfigScreen() {
  const { requestId } = useLocalSearchParams();
  const [optimizationType, setOptimizationType] = useState<'bayesian' | 'grid' | 'random'>('bayesian');
  const [maxEvaluations, setMaxEvaluations] = useState('50');
  const [timeoutMinutes, setTimeoutMinutes] = useState('60');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedHyperparameters, setSelectedHyperparameters] = useState<string[]>(['epochs', 'batch_size']);
  const [sampleSize, setSampleSize] = useState(2000);
  const [modelType] = useState<'ctgan' | 'tvae'>('ctgan'); // Pour l'exemple

  const handleCreateConfig = async () => {
    try {
      setIsCreating(true);
      
      const config = {
        request_id: Number(requestId),
        optimization_type: optimizationType,
        max_evaluations: parseInt(maxEvaluations),
        timeout_minutes: parseInt(timeoutMinutes),
        search_space: {
          epochs: {
            min_value: 100,
            max_value: 1000,
            step: 50
          },
          batch_size: {
            choices: [32, 64, 128, 256, 512]
          }
        }
      };

      await authService.generateWithOptimization(Number(requestId), config);
      
      Alert.alert('Success', 'Optimization started successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start optimization');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Card className="mb-4">
        <Card.Content className="p-5">
          <Text className="text-lg font-bold mb-4">Configuration d&apos;optimisation avancée</Text>
          
          {/* Sélection des hyperparamètres */}
          <View className="mb-6">
            <Text className="text-base font-medium mb-3">Hyperparamètres à optimiser</Text>
            <HyperparameterSelector
              modelType={modelType}
              selectedHyperparameters={selectedHyperparameters}
              onSelectionChange={setSelectedHyperparameters}
            />
          </View>

          {/* Taille d'échantillon */}
          <View className="mb-6">
            <Text className="text-base font-medium mb-3">Taille d&apos;échantillon</Text>
            <SampleSizeSelector
              selectedSize={sampleSize}
              onSizeChange={setSampleSize}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Méthode d&apos;optimisation</Text>
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

          <TextInput
            mode="outlined"
            label="Nombre d'évaluations max"
            value={maxEvaluations}
            onChangeText={setMaxEvaluations}
            keyboardType="numeric"
            className="mb-4"
          />

          <TextInput
            mode="outlined"
            label="Timeout (minutes)"
            value={timeoutMinutes}
            onChangeText={setTimeoutMinutes}
            keyboardType="numeric"
            className="mb-4"
          />

          <View className="flex-row gap-3">
            <Button 
              mode="outlined" 
              onPress={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleCreateConfig}
              loading={isCreating}
              className="flex-1"
            >
              Start Optimization
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
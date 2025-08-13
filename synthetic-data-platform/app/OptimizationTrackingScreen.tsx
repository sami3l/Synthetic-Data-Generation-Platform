import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Card, Text, ProgressBar, Chip, DataTable } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/api/authService';
import { OptimizationConfig, OptimizationTrial } from '@/types/type';

export default function OptimizationTrackingScreen() {
  const { configId } = useLocalSearchParams();
  const [config, setConfig] = useState<OptimizationConfig | null>(null);
  const [trials, setTrials] = useState<OptimizationTrial[]>([]);
  const [bestParams, setBestParams] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [configData, trialsData] = await Promise.all([
        authService.getOptimizationConfig(Number(configId)),
        authService.getOptimizationTrials(Number(configId))
      ]);
      
      setConfig(configData);
      setTrials(trialsData);

      if (trialsData.length > 0) {
        const bestParamsData = await authService.getBestParameters(Number(configId));
        setBestParams(bestParamsData);
      }
    } catch (error) {
      console.error('Error fetching optimization data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Polling pour les mises à jour en temps réel
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [configId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading || !config) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading optimization data...</Text>
      </View>
    );
  }

  const progress = config.max_evaluations;

  return (
    <ScrollView 
      className="flex-1 p-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Card */}
      <Card className="mb-4">
        <Card.Content className="p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Optimization Status</Text>
            <Chip 
              mode="flat"
              style={{ 
                backgroundColor: config.status === 'completed' ? '#10b981' : 
                               config.status === 'running' ? '#3b82f6' : '#f59e0b' 
              }}
            >
              {(config?.status ?? '').toUpperCase()}
            </Chip>
          </View>
          
          <Text className="text-sm text-gray-600 mb-2">
            Progress: {config.total_evaluations} / {config.max_evaluations} evaluations
          </Text>
          <ProgressBar progress={progress} />
          
          {config.best_score && (
            <Text className="text-sm mt-2">
              Best Score: {config.best_score.toFixed(4)}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Best Parameters Card */}
      {bestParams && (
        <Card className="mb-4">
          <Card.Content className="p-5">
            <Text className="text-lg font-bold mb-4">Best Parameters Found</Text>
            <View className="space-y-2">
              {Object.entries(bestParams.best_parameters).map(([key, value]) => (
                <View key={key} className="flex-row justify-between">
                  <Text className="text-gray-600">{key}:</Text>
                  <Text className="font-medium">{String(value)}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Trials Table */}
      <Card>
        <Card.Content className="p-5">
          <Text className="text-lg font-bold mb-4">Trial History</Text>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Trial</DataTable.Title>
              <DataTable.Title numeric>Score</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>

            {trials.slice(0, 10).map((trial) => (
              <DataTable.Row key={trial.id}>
                <DataTable.Cell>#{trial.trial_number}</DataTable.Cell>
                <DataTable.Cell numeric>
                  {trial.quality_score ? trial.quality_score.toFixed(4) : '-'}
                </DataTable.Cell>
                <DataTable.Cell>
                  <Chip 
                    compact 
                    mode="outlined"
                    style={{ 
                      borderColor: trial.status === 'completed' ? '#10b981' : 
                                  trial.status === 'running' ? '#3b82f6' : '#ef4444' 
                    }}
                  >
                    {trial.status}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
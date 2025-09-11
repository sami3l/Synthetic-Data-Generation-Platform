import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Text, Icon, Chip, Divider, Card, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/api/authService';

interface DataRequest {
  id: number;
  user_id: number;
  request_name: string;
  dataset_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  parameters?: {
    model_type?: string;
    epochs?: number;
    batch_size?: number;
    learning_rate?: number;
    optimization_enabled?: boolean;
    optimization_method?: string;
    optimization_n_trials?: number;
    request_id?: number;
  };
  results?: {
    quality_score?: number;
    output_path?: string;
    optimized?: boolean;
    final_parameters?: {
      epochs: number;
      batch_size: number;
      learning_rate: number;
      model_type: string;
    };
    download_url?: string;
  };
  logs?: string[];
  error_message?: string;
}

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<DataRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Request Details',
    });
  }, [navigation]);

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getRequestById(Number(id));
      setRequest(response);
    } catch (error: any) {
      console.error('Error fetching request details:', error);
      if (error.response?.status === 401 || error.message?.includes('Session expired')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load request details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequestDetails();
    setRefreshing(false);
  };

  const handleGenerateData = async () => {
    if (!request?.id) return;

    Alert.alert(
      'Generate Data',
      'Are you sure you want to generate synthetic data for this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setIsGenerating(true);
              const generationResult = await authService.generateData(request.id);
              
              // Update the request with new results
              setRequest(prev => ({
                ...prev!,
                status: 'completed',
                results: {
                  ...prev?.results,
                  quality_score: generationResult.quality_score,
                  output_path: generationResult.output_path,
                  optimized: generationResult.optimized,
                  final_parameters: generationResult.final_parameters,
                  download_url: generationResult.output_path // Assuming output_path is downloadable
                },
                updated_at: new Date().toISOString()
              }));

              Alert.alert(
                'Success', 
                `Data generated successfully with quality score: ${generationResult.quality_score.toFixed(3)}`
              );
            } catch (error: any) {
              console.error('Generation error:', error);
              Alert.alert('Error', error.message || 'Failed to generate data');
            } finally {
              setIsGenerating(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadData = () => {
    if (!request?.results?.output_path) return;
    Alert.alert('Download', 'Data download functionality would go here');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'processing': return 'progress-clock';
      case 'failed': return 'alert-circle';
      default: return 'clock';
    }
  };

  const handleDeleteRequest = () => {
    if (!request || !request.id) {
      Alert.alert('Error', 'Unable to delete request. Request not found.');
      return;
    }

    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteRequest(request.id);
              Alert.alert('Success', 'Request deleted successfully.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              console.error('Delete request error:', error);
              Alert.alert(
                'Error', 
                error.message || 'Failed to delete request. Please try again.'
              );
            }
          }
        }
      ]
    );
  };

  const handleOptimizedGeneration = () => {
    if (!request?.id) return;
    
    // Navigation vers l'écran de configuration d'optimisation
    router.push(`/optimization/config/${request.id}` as any);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600">Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Icon source="alert-circle" size={48} color="#ef4444" />
        <Text className="mt-4 text-gray-600">Request not found</Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 bg-indigo-600 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Icon source="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text variant="titleLarge" className="font-bold text-gray-900 ml-4 flex-1">
          Request Details
        </Text>
        <TouchableOpacity onPress={handleDeleteRequest}>
          <Icon source="delete" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="px-5 py-4"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Main Info Card */}
        <Card className="mb-4">
          <Card.Content className="p-5">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-xl font-bold text-gray-900 flex-1">
                {request.request_name}
              </Text>
              <Chip
                mode="outlined"
                textStyle={{ color: getStatusColor(request.status) }}
                style={{ borderColor: getStatusColor(request.status) }}
                icon={getStatusIcon(request.status)}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Chip>
            </View>

            <View className="flex-row items-center mb-4">
              <Icon source="file-document" size={20} color="#6b7280" />
              <Text className="text-gray-700 ml-2 text-base">
                {request.dataset_name}
              </Text>
            </View>

            <Divider className="my-4" />

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Request ID</Text>
                <Text className="text-gray-900 font-medium">#{request.id}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-500">Created</Text>
                <Text className="text-gray-900 font-medium">
                  {formatDate(request.created_at)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-500">Last Updated</Text>
                <Text className="text-gray-900 font-medium">
                  {formatDate(request.updated_at)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Parameters Card */}
        {request.parameters && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Parameters
              </Text>

              <View className="space-y-3">
                {request.parameters.model_type && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Model Type</Text>
                    <Text className="text-gray-900 font-medium">
                      {request.parameters.model_type}
                    </Text>
                  </View>
                )}

                {request.parameters.epochs && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Epochs</Text>
                    <Text className="text-gray-900 font-medium">
                      {request.parameters.epochs}
                    </Text>
                  </View>
                )}

                {request.parameters.batch_size && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Batch Size</Text>
                    <Text className="text-gray-900 font-medium">
                      {request.parameters.batch_size}
                    </Text>
                  </View>
                )}

                {request.parameters.learning_rate && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Learning Rate</Text>
                    <Text className="text-gray-900 font-medium">
                      {request.parameters.learning_rate}
                    </Text>
                  </View>
                )}

                {request.parameters.optimization_enabled && (
                  <>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500">Optimization</Text>
                      <Text className="text-gray-900 font-medium">Enabled</Text>
                    </View>

                    {request.parameters.optimization_method && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Search Type</Text>
                        <Text className="text-gray-900 font-medium">
                          {request.parameters.optimization_method}
                        </Text>
                      </View>
                    )}

                    {request.parameters.optimization_n_trials && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Trials</Text>
                        <Text className="text-gray-900 font-medium">
                          {request.parameters.optimization_n_trials}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Results Card */}
        {request.status === 'completed' && request.results && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Generation Results
              </Text>

              <View className="space-y-3">
                {request.results.quality_score && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Quality Score</Text>
                    <Text className="text-gray-900 font-medium">
                      {request.results.quality_score.toFixed(3)}
                    </Text>
                  </View>
                )}

                {request.results.optimized !== undefined && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Optimized</Text>
                    <Text className="text-gray-900 font-medium">
                      {request.results.optimized ? 'Yes' : 'No'}
                    </Text>
                  </View>
                )}

                {request.results.final_parameters && (
                  <>
                    <Text className="text-md font-semibold text-gray-700 mt-2 mb-1">
                      Final Parameters
                    </Text>
                    <View className="pl-2 space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Model Type</Text>
                        <Text className="text-gray-900 font-medium">
                          {request.results.final_parameters.model_type}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Epochs</Text>
                        <Text className="text-gray-900 font-medium">
                          {request.results.final_parameters.epochs}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Batch Size</Text>
                        <Text className="text-gray-900 font-medium">
                          {request.results.final_parameters.batch_size}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-gray-500">Learning Rate</Text>
                        <Text className="text-gray-900 font-medium">
                          {request.results.final_parameters.learning_rate}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {request.results.output_path && (
                  <View className="mt-4">
                    <Button
                      mode="contained"
                      onPress={handleDownloadData}
                      icon="download"
                      loading={isGenerating}
                      disabled={isGenerating}
                    >
                      Download Synthetic Data
                    </Button>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Generate Data Button (for pending requests) */}
        {request.status === 'pending' && (
          <>
            <Card className="mb-4">
              <Card.Content className="p-5">
                <Button
                  mode="contained"
                  onPress={handleGenerateData}
                  icon="robot"
                  loading={isGenerating}
                  disabled={isGenerating}
                  className="py-2 mb-3"
                >
                  {isGenerating ? 'Generating...' : 'Generate Synthetic Data'}
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleOptimizedGeneration}
                  icon="tune"
                  disabled={isGenerating}
                  className="py-2"
                >
                  Generate with Optimization
                </Button>
              </Card.Content>
            </Card>
          </>
        )}

        {/* Error Card */}
        {request.status === 'failed' && request.error_message && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-red-600 mb-4">
                Error Details
              </Text>
              <View className="bg-red-50 p-4 rounded-lg">
                <Text className="text-red-800">
                  {request.error_message}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Logs Card */}
        {(request.status === 'processing' || request.status === 'completed') && request.logs && (
          <Card className="mb-4">
            <Card.Content className="p-5">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Generation Logs
              </Text>
              <View className="bg-gray-100 p-4 rounded-lg max-h-60">
                <ScrollView nestedScrollEnabled>
                  {request.logs.map((log, index) => (
                    <Text key={index} className="text-sm text-gray-700 mb-1 font-mono">
                      {log}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
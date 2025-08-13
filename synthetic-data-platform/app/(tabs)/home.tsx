import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, RefreshControl, View, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';

import { authService } from '@/services/api/authService';

interface DataRequest {
  id: number;
  request_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  dataset_name: string;
}

export default function HomeScreen() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasAttemptedLoad = useRef(false);

  const fetchRequests = async () => {
    // Éviter les chargements multiples
    if (isLoading && hasAttemptedLoad.current) {
      console.log('📋 Home: Chargement déjà en cours, ignoré');
      return;
    }

    try {
      hasAttemptedLoad.current = true;
      const response = await authService.getRequests();
      setRequests(response);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hasAttemptedLoad.current) {
      fetchRequests();
    }
  }, []); // Pas de dépendances pour éviter les re-exécutions

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'processing': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 mt-12 bg-gray-50 px-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="pt-6 pb-4">
        <Text variant="headlineMedium" className="font-bold text-gray-900">
          Data Requests
        </Text>
        <Text className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Stats Summary */}
      <View className="flex-row justify-between mb-6">
        <View className="items-center">
          <Text className="text-2xl font-bold">{requests.length}</Text>
          <Text className="text-gray-500">Total</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold">
            {requests.filter(r => r.status === 'completed').length}
          </Text>
          <Text className="text-gray-500">Completed</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold">
            {requests.filter(r => r.status === 'processing').length}
          </Text>
          <Text className="text-gray-500">Processing</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold">
            {requests.filter(r => r.status === 'pending').length}
          </Text>
          <Text className="text-gray-500">Pending</Text>
        </View>
      </View>

      {/* Create New Button */}
      <Button
        mode="contained"
        onPress={() => router.push('/new-request')}
        className="mb-6 rounded-lg py-2"
        icon="plus"
      >
        Create New Request
      </Button>

      {/* Recent Requests */}
      <Text className="text-lg font-bold text-gray-900 mb-3">Recent Requests</Text>
      {requests.slice(0, 5).map(request => (
        <Card 
          key={request.id} 
          className="mb-3"
          onPress={() => router.push(`/requests/${request.id}` as any)}
        >
          <Card.Content className="flex-row justify-between items-center py-3">
            <View className="flex-1">
              <Text className="font-medium">{request.request_name}</Text>
              <Text className="text-gray-500 text-sm">
                {request.dataset_name} • {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: getStatusColor(request.status) }}
              />
              <Text className="capitalize">{request.status}</Text>
            </View>
          </Card.Content>
        </Card>
      ))}

      {requests.length > 5 && (
        <Button
          mode="outlined"
          onPress={() => router.push('/(tabs)/requests')}
          className="mt-2 rounded-lg"
        >
          View All Requests
        </Button>
      )}
    </ScrollView>
  );
}
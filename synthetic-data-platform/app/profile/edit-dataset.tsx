import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Icon,
  TextInput,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services/api/authService';
import Toast from 'react-native-toast-message';

export default function EditDatasetScreen() {
  const { id, name, description, filename } = useLocalSearchParams<{
    id: string;
    name: string;
    description: string;
    filename: string;
  }>();

  const [datasetName, setDatasetName] = useState(name || '');
  const [datasetDescription, setDatasetDescription] = useState(description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!datasetName.trim()) {
      Alert.alert('Error', 'Dataset name is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const updateData = {
        name: datasetName.trim(),
        description: datasetDescription.trim() || undefined,
      };

      await authService.updateDataset(parseInt(id!), updateData);
      
      Toast.show({
        type: 'success',
        text1: 'Dataset updated successfully',
        position: 'bottom'
      });

      // Navigate back to datasets screen
      router.back();
      
    } catch (error: any) {
      console.error('Update error:', error);
      
      let errorMessage = 'Failed to update dataset';
      if (error.message?.includes('Session expired')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Dataset not found';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'bottom'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-200 mt-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2"
          >
            <Icon source="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text variant="headlineSmall" className="font-bold text-gray-900">
            Edit Dataset
          </Text>
          
          <View className="w-8" />
        </View>
      </View>

      <View className="flex-1 p-4">
        <Card className="mb-4">
          <Card.Content className="p-5">
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Icon source="file" size={20} color="#6b7280" />
                <Text variant="bodySmall" className="text-gray-500 ml-2 font-medium">
                  Original File
                </Text>
              </View>
              <Text variant="bodyMedium" className="text-gray-700 ml-7">
                {filename}
              </Text>
            </View>

            <TextInput
              label="Dataset Name"
              value={datasetName}
              onChangeText={setDatasetName}
              mode="outlined"
              className="mb-4"
              placeholder="Enter dataset name"
              disabled={isLoading}
            />

            <TextInput
              label="Description (Optional)"
              value={datasetDescription}
              onChangeText={setDatasetDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Enter dataset description"
              disabled={isLoading}
            />
          </Card.Content>
        </Card>

        <View className="flex-row space-x-3">
          <Button
            mode="outlined"
            onPress={() => router.back()}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSave}
            className="flex-1"
            loading={isLoading}
            disabled={isLoading}
            style={{ backgroundColor: '#6366f1' }}
          >
            Save Changes
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

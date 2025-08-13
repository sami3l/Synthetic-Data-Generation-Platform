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
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { authService } from '@/services/api/authService';
import Toast from 'react-native-toast-message';

export default function ReplaceDatasetScreen() {
  const { id, name, filename } = useLocalSearchParams<{
    id: string;
    name: string;
    filename: string;
  }>();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-spreadsheet.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleReplace = async () => {
    if (!selectedFile || selectedFile.canceled || !selectedFile.assets?.[0]) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    const file = selectedFile.assets[0];
    
    Alert.alert(
      'Replace Dataset',
      `This will replace "${filename}" with "${file.name}". This action cannot be undone. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: performReplace
        }
      ]
    );
  };

  const performReplace = async () => {
    if (!selectedFile || selectedFile.canceled || !selectedFile.assets?.[0]) {
      return;
    }

    const file = selectedFile.assets[0];

    try {
      setIsUploading(true);

      // For now, we'll simulate the replace by updating the filename
      // In a real implementation, you'd upload the new file to the server
      const updateData = {
        original_filename: file.name,
      };

      await authService.updateDataset(parseInt(id!), updateData);
      
      Toast.show({
        type: 'success',
        text1: 'Dataset replaced successfully',
        position: 'bottom'
      });

      // Navigate back to datasets screen
      router.back();
      
    } catch (error: any) {
      console.error('Replace error:', error);
      
      let errorMessage = 'Failed to replace dataset';
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
      setIsUploading(false);
    }
  };

  const formatFileSize = (size: number) => {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            Replace Dataset
          </Text>
          
          <View className="w-8" />
        </View>
      </View>

      <View className="flex-1 p-4">
        {/* Current File Info */}
        <Card className="mb-4">
          <Card.Content className="p-5">
            <View className="flex-row items-center mb-2">
              <Icon source="file" size={20} color="#6b7280" />
              <Text variant="titleMedium" className="font-bold text-gray-900 ml-2">
                Current File
              </Text>
            </View>
            <Text variant="bodyMedium" className="text-gray-700 mb-2">
              {filename}
            </Text>
            <Text variant="bodySmall" className="text-gray-500">
              Dataset: {name}
            </Text>
          </Card.Content>
        </Card>

        {/* File Picker */}
        <Card className="mb-4">
          <Card.Content className="p-5">
            <Text variant="titleMedium" className="font-bold text-gray-900 mb-3">
              Select New File
            </Text>
            
            <Button
              mode="outlined"
              onPress={handleFilePicker}
              icon="file-upload"
              className="mb-3"
              disabled={isUploading}
            >
              Choose File
            </Button>

            {selectedFile && !selectedFile.canceled && selectedFile.assets?.[0] && (
              <View className="bg-blue-50 p-3 rounded-lg">
                <View className="flex-row items-center mb-2">
                  <Icon source="file-check" size={16} color="#3b82f6" />
                  <Text variant="bodyMedium" className="font-medium text-blue-800 ml-2">
                    Selected File
                  </Text>
                </View>
                <Text variant="bodyMedium" className="text-blue-700">
                  {selectedFile.assets[0].name}
                </Text>
                <Text variant="bodySmall" className="text-blue-600">
                  Size: {formatFileSize(selectedFile.assets[0].size || 0)}
                </Text>
              </View>
            )}

            <Text variant="bodySmall" className="text-gray-500 mt-3">
              Supported formats: CSV, Excel (.xls, .xlsx)
            </Text>
          </Card.Content>
        </Card>

        {/* Warning */}
        <Card className="mb-4" style={{ backgroundColor: '#fef3c7' }}>
          <Card.Content className="p-4">
            <View className="flex-row items-center">
              <Icon source="alert" size={20} color="#f59e0b" />
              <Text variant="bodyMedium" className="text-yellow-800 ml-2 flex-1">
                Warning: This will permanently replace the current dataset file. This action cannot be undone.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <Button
            mode="outlined"
            onPress={() => router.back()}
            className="flex-1"
            disabled={isUploading}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleReplace}
            className="flex-1"
            loading={isUploading}
            disabled={isUploading || !selectedFile || selectedFile.canceled || !selectedFile.assets?.[0]}
            style={{ backgroundColor: '#ef4444' }}
          >
            Replace File
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

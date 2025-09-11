import React, { useState } from 'react';
import {
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { fileUploadService, FileUploadResult } from '@/services/api/fileUploadService';

interface FileUploadComponentProps {
  onUploadSuccess?: (file: FileUploadResult) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export default function FileUploadComponent({
  onUploadSuccess,
  onUploadError,
  disabled = false,
}: FileUploadComponentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    uri: string;
  } | null>(null);

  const handleFileSelection = async () => {
    try {
      console.log('🔄 Sélection de fichier via FileUploadService...');
      
      // Utiliser le service unifié pour la sélection
      const result = await fileUploadService.selectFile();
      
      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        console.log('❌ Sélection annulée ou aucun fichier');
        return;
      }

      const file = result.assets[0];
      console.log('📁 Fichier sélectionné:', file);

      setSelectedFile({
        name: file.name || 'Fichier sans nom',
        size: file.size || 0,
        type: file.mimeType || 'application/octet-stream',
        uri: file.uri,
      });

      Toast.show({
        type: 'success',
        text1: 'Fichier sélectionné',
        text2: file.name || 'Fichier prêt pour l\'upload',
      });

    } catch (error: any) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Aucun fichier', 'Veuillez d\'abord sélectionner un fichier');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

    try {
      // Utiliser le service d'upload unifié
      const result = await fileUploadService.uploadFile(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.type || 'application/octet-stream',
        (progress) => {
          setUploadProgress({
            loaded: progress.loaded,
            total: progress.total,
            percentage: progress.percentage
          });
        }
      );

      console.log('✅ Upload réussi:', result);
      
      Toast.show({
        type: 'success',
        text1: 'Upload réussi',
        text2: `${selectedFile.name} a été uploadé avec succès`,
      });

      // Réinitialiser
      setSelectedFile(null);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

    } catch (error: any) {
      console.error('Erreur upload:', error);
      const errorMessage = error.message || 'Erreur lors de l\'upload';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'upload',
        text2: errorMessage,
      });

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <View className="bg-slate-500 rounded-lg p-4 mb-4">
      <View className="flex-row rounded-lg items-center mb-2">
        <Text className="text-lg font-semibold text-gray-900 ml-2">
          📁 Upload de Dataset
        </Text>
      </View>

      <Text className="text-sm text-gray-500 mb-4">
        Sélectionnez un fichier CSV ou Excel depuis votre appareil
      </Text>

      {selectedFile && (
        <View className=" bg-white p-3 rounded-lg mb-4">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">📄</Text>
            <View className="flex-1">
              <Text className="font-medium text-white">
                {selectedFile.name}
              </Text>
              <Text className="text-xs text-gray-300">
                {formatFileSize(selectedFile.size)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {uploadProgress && (
        <View className="mb-4">
          <Text className="text-center text-sm text-gray-300 mb-2">
            Upload en cours: {Math.round(uploadProgress.percentage)}%
          </Text>
          <View className="bg-gray-600 rounded-full h-2">
            <View 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </View>
        </View>
      )}

      <View className="flex-row mb-4">
        <TouchableOpacity
          onPress={handleFileSelection}
          disabled={disabled || isUploading}
          className={`flex-1 bg-gray-600 border border-gray-500 rounded-lg p-3 mr-2 ${
            disabled || isUploading ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-center text-white font-medium">
            📂 Sélectionner...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={!selectedFile || disabled || isUploading}
          className={`flex-1 rounded-lg p-3 ml-2 ${
            !selectedFile || disabled || isUploading 
              ? 'opacity-50 bg-gray-500' 
              : 'bg-gray-500'
          }`}
        >
          <Text className="text-center text-white font-medium">
            ⬆️ Uploader
          </Text>
        </TouchableOpacity>
      </View>

      <View className="items-center">
        <Text className="text-xs text-gray-400 text-center">
          Formats supportés: CSV, Excel (.xls, .xlsx)
        </Text>
        <Text className="text-xs text-gray-400 text-center">
          Taille maximum: 50MB
        </Text>
      </View>
    </View>
  );
}

/**
 * Service pour l'upload de fichiers vers Supabase
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { axiosInstance } from './axios.config';
import { authService } from './authService';
import { Alert } from 'react-native';

export interface FileUploadResult {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  upload_path: string;
  analysis_results: {
    num_rows: number;
    num_columns: number;
    column_types: Record<string, string>;
    missing_values: Record<string, number>;
    data_preview: any[];
  };
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadFileInfo {
  uri: string;
  name: string;
  type: string;
  size: number;
}

class FileUploadService {
  /**
   * Sélectionne un fichier depuis l'appareil
   */
  async selectFile(): Promise<DocumentPicker.DocumentPickerResult | null> {
    try {
      console.log('🔄 Début de la sélection de fichier...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values', 
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-spreadsheet.sheet',
          '*/*' // Fallback pour tous les types
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('📄 Résultat de la sélection:', result);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('❌ Sélection annulée ou aucun fichier');
        return null;
      }

      const file = result.assets[0];
      console.log('📁 Fichier sélectionné:', {
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: file.uri
      });
      
      // Vérifier l'extension du fichier (validation flexible)
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.csv', '.xls', '.xlsx'];
      const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidExtension) {
        console.warn('❌ Extension non valide:', fileName);
        Alert.alert(
          'Format non supporté',
          `Le fichier "${file.name}" n'est pas supporté.\n\nFormats acceptés: CSV, Excel (.xls, .xlsx)`
        );
        return null;
      }
      
      // Vérifier la taille du fichier (limite à 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size && file.size > MAX_FILE_SIZE) {
        console.warn('❌ Fichier trop volumineux:', file.size);
        Alert.alert(
          'Fichier trop volumineux',
          `Le fichier "${file.name}" fait ${this.formatFileSize(file.size)}.\n\nTaille maximum: 50MB`
        );
        return null;
      }

      console.log('✅ Fichier valide sélectionné');
      return result;
    } catch (error) {
      console.error('Erreur lors de la sélection de fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
      return null;
    }
  }

  /**
   * Upload un fichier vers le backend
   */
  async uploadFile(
    fileUri: string,
    fileName: string,
    fileType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult> {
    try {
      console.log('🔄 Début de l\'upload...');
      console.log('📁 Fichier:', { fileUri, fileName, fileType });

      // Vérifier d'abord si un fichier avec ce nom existe déjà
      try {
        const checkResult = await authService.checkFilenameExists(fileName);
        if (checkResult.exists) {
          console.warn('❌ Fichier déjà existant:', fileName);
          Alert.alert(
            'Fichier déjà existant',
            `Un dataset avec le nom "${fileName}" existe déjà.\n\nVeuillez:\n• Choisir un autre fichier\n• Renommer votre fichier\n• Supprimer l'ancien dataset depuis la page de gestion`,
            [
              { text: 'OK', style: 'default' }
            ]
          );
          throw new Error(`Le fichier "${fileName}" existe déjà`);
        }
      } catch (checkError: any) {
        if (checkError.message.includes('existe déjà')) {
          throw checkError; // Re-lancer l'erreur de doublon
        }
        console.warn('Impossible de vérifier l\'existence du fichier, continuation...', checkError);
      }
      
      // Test de connectivité avec un endpoint qui existe
      try {
        await axiosInstance.get('/datasets/');
        console.log('✅ Serveur accessible');
      } catch (error) {
        console.error('❌ Serveur inaccessible:', error);
        throw new Error('Impossible de contacter le serveur');
      }

      // Lire le fichier
      const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
      if (!fileInfo.exists) {
        throw new Error('Le fichier n\'existe pas');
      }

      // Créer FormData
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      // Upload avec suivi de progression
      const response = await axiosInstance.post('/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            };
            onProgress(progress);
          }
        },
      });

      console.log('✅ Upload réussi:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload:', error);
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        throw new Error('Impossible de contacter le serveur');
      } else if (error.response) {
        throw new Error(error.response.data.detail || 'Erreur lors de l\'upload');
      } else if (error.request) {
        throw new Error('Pas de réponse du serveur');
      } else {
        throw new Error('Erreur de configuration de la requête');
      }
    }
  }

  /**
   * Upload un fichier avec sélection et progression
   */
  async selectAndUploadFile(
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResult | null> {
    try {
      // Sélectionner le fichier
      const fileResult = await this.selectFile();
      if (!fileResult || fileResult.canceled) {
        return null;
      }

      const file = fileResult.assets[0];
      
      // Upload le fichier
      const uploadResult = await this.uploadFile(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        onProgress
      );

      return uploadResult;
    } catch (error) {
      console.error('Erreur lors de l\'upload avec sélection:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des fichiers uploadés
   */
  async getUploadedFiles(): Promise<FileUploadResult[]> {
    try {
      console.log('🔄 Récupération des fichiers uploadés via FileUploadService...');
      
      const response = await axiosInstance.get('/datasets/datasets');
      console.log('✅ Réponse reçue:', response.data);
      
      // S'assurer que la réponse est un tableau
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.datasets)) {
        return data.datasets;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('Format de réponse inattendu:', data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des fichiers:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.response?.status === 500) {
        throw new Error('Erreur serveur lors du chargement des datasets.');
      } else if (!error.response) {
        throw new Error('Impossible de contacter le serveur.');
      } else {
        throw new Error(`Erreur de chargement: ${error.response?.data?.detail || error.message}`);
      }
    }
  }

  /**
   * Supprime un fichier uploadé
   */
  async deleteFile(fileId: number): Promise<void> {
    try {
      await axiosInstance.delete(`/datasets/datasets/${fileId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Impossible de supprimer le fichier');
    }
  }

  /**
   * Valide le format de fichier
   */
  isValidFileType(mimeType: string): boolean {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-spreadsheet.sheet',
      'text/plain',
    ];
    return validTypes.includes(mimeType);
  }

  /**
   * Convertit les bytes en format lisible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileUploadService = new FileUploadService();

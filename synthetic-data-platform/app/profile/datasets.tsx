import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Icon,
  Menu,
  Divider,
  Chip,
  Modal,
  Portal,
  TextInput,
} from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '@/services/api/authService';
import FileUploadComponent from '@/components/FileUploadComponentV2';
import Toast from 'react-native-toast-message';

// TypeScript interfaces
interface Dataset {
  id: number;
  name: string;
  filename: string;
  file_size: number;
  upload_date: string;
  status: 'processing' | 'ready' | 'error';
  description?: string;
  rows_count?: number;
  columns_count?: number;
}

export default function DatasetsScreen() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // États pour l'upload et la gestion des modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [newFilename, setNewFilename] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);


  const loadDatasets = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await authService.getDatasets();
      console.log('API Response:', response);
      
      // Handle the API response structure: {"datasets": [...]}
      const datasetsArray = (response as any).datasets || response || []; 
      
      // Transform API data to match our interface
      const transformedDatasets = datasetsArray.map((item: any) => ({
        id: item.id,
        name: item.original_filename?.replace(/\.[^/.]+$/, "") || `Dataset ${item.id}`, // Remove extension for display name
        filename: item.original_filename || 'Unknown file',
        file_size: item.file_size || 0,
        upload_date: item.created_at || new Date().toISOString(),
        status: item.is_valid ? 'ready' : 'error' as 'processing' | 'ready' | 'error',
        description: `Dataset with ${item.n_rows || 0} rows and ${item.n_columns || 0} columns`,
        rows_count: item.n_rows || 0,
        columns_count: item.n_columns || 0
      }));
      
      setDatasets(transformedDatasets);
      
    } catch (error: any) {
      console.error('Error loading datasets:', error);
      
      if (error.response?.status === 401 || error.message?.includes('Session expired')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        // Mock data for development
        const mockDatasets: Dataset[] = [
          {
            id: 1,
            name: 'Customer Data 2024',
            filename: 'customers_2024.csv',
            file_size: 2500000,
            upload_date: new Date().toISOString(),
            status: 'ready',
            description: 'Customer information dataset',
            rows_count: 1500,
            columns_count: 12
          },
          {
            id: 2,
            name: 'Sales Analytics',
            filename: 'sales_data.xlsx',
            file_size: 4200000,
            upload_date: new Date(Date.now() - 86400000).toISOString(),
            status: 'processing',
            rows_count: 2300,
            columns_count: 8
          },
          {
            id: 3,
            name: 'Product Inventory',
            filename: 'inventory.csv',
            file_size: 1800000,
            upload_date: new Date(Date.now() - 172800000).toISOString(),
            status: 'error',
            description: 'Product inventory with stock levels',
            rows_count: 890,
            columns_count: 15
          }
        ];
        setDatasets(mockDatasets);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  

  const handleDeleteDataset = async (dataset: Dataset) => {
    Alert.alert(
      'Delete Dataset',
      `Are you sure you want to delete "${dataset.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(dataset.id)
        }
      ]
    );
  };

  const performDelete = async (datasetId: number) => {
    try {
      setActionLoading(datasetId);
      await authService.deleteDataset(datasetId);
      
      setDatasets(prev => prev.filter(d => d.id !== datasetId));
      
      Toast.show({
        type: 'success',
        text1: 'Dataset deleted successfully',
        position: 'bottom'
      });
      
    } catch (error) {
      console.error('Delete error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete dataset',
        position: 'bottom'
      });
    } finally {
      setActionLoading(null);
      setMenuVisible(null);
    }
  };

  const handleUpdateDataset = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setNewFilename(dataset.filename);
    setEditModalVisible(true);
  };

  const handleUploadSuccess = (uploadedFile: any) => {
    // Recharger la liste des datasets après un upload réussi
    loadDatasets();
    Toast.show({
      type: 'success',
      text1: 'Upload réussi',
      text2: `${uploadedFile.original_filename || uploadedFile.filename} a été ajouté à vos datasets`,
      position: 'bottom'
    });
  };

  const confirmUpdateDataset = async () => {
    if (!editingDataset || !newFilename.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de fichier valide');
      return;
    }

    try {
      setActionLoading(editingDataset.id);
      await authService.updateDataset(editingDataset.id, {
        original_filename: newFilename.trim()
      });

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Dataset mis à jour avec succès',
        position: 'bottom'
      });

      setEditModalVisible(false);
      setEditingDataset(null);
      setNewFilename('');
      
      // Recharger la liste des datasets
      await loadDatasets();

    } catch (error: any) {
      console.error('Erreur mise à jour:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Erreur lors de la mise à jour',
        position: 'bottom'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplaceDataset = (dataset: Dataset) => {
   
    Alert.alert(
      'Remplacer le fichier',
      `Remplacer le fichier "${dataset.filename}" - Fonctionnalité à venir !`,
      [{ text: 'OK' }]
    );
    setMenuVisible(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#10b981';
      case 'processing': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return 'check-circle';
      case 'processing': return 'clock';
      case 'error': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-4 text-gray-600">Loading datasets...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          
          <Text variant="headlineSmall" className="font-bold text-center text-gray-900">
            My Datasets
          </Text>
          
          {/* <Button
            mode="contained"
            compact
            onPress={() => Alert.alert('Upload Dataset', 'Feature coming soon!')}
            icon="plus"
            style={{ backgroundColor: '#6366f1' }}
          >
            Upload
          </Button> */}
        </View>
        
        <Text variant="bodySmall" className="text-gray-500 mt-2">
          {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDatasets(true)}
            tintColor="#6366f1"
          />
        }
      >
        {/* Section d'upload de nouveaux datasets */}
      
            <FileUploadComponent 
              onUploadSuccess={handleUploadSuccess}
            />
         

        {datasets.length === 0 ? (
          <Card className="mt-4">
            <Card.Content className="items-center py-12">
              <Icon source="database-off" size={64} color="#9ca3af" />
              <Text variant="titleLarge" className="text-gray-800 font-bold mt-4 mb-2">
                No datasets found
              </Text>
              <Text variant="bodyMedium" className="text-gray-600 text-center mb-6">
                Upload your first dataset to get started{'\n'}
                with synthetic data generation.
              </Text>
              <Button
                mode="contained"
                onPress={() => Alert.alert('Upload Dataset', 'Feature coming soon!')}
                icon="upload"
                style={{ backgroundColor: '#6366f1' }}
              >
                Upload Dataset
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View className="py-4">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="mb-4 bg-white">
                <Card.Content className="p-5">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text variant="titleMedium" className="font-bold text-gray-900 mb-1">
                        {dataset.name}
                      </Text>
                      <Text variant="bodySmall" className="text-gray-500">
                        {dataset.filename}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Chip
                        mode="flat"
                        textStyle={{ 
                          fontSize: 11, 
                          color: getStatusColor(dataset.status),
                          fontWeight: '600'
                        }}
                        style={{ 
                          backgroundColor: `${getStatusColor(dataset.status)}15`,
                          height: 28
                        }}
                        icon={() => (
                          <Icon 
                            source={getStatusIcon(dataset.status)} 
                            size={14} 
                            color={getStatusColor(dataset.status)} 
                          />
                        )}
                      >
                        {dataset.status.toUpperCase()}
                      </Chip>
                      
                      <Menu
                        visible={menuVisible === dataset.id}
                        onDismiss={() => setMenuVisible(null)}
                        anchor={
                          <TouchableOpacity
                            onPress={() => setMenuVisible(dataset.id)}
                            className="p-2 ml-2"
                          >
                            <Icon source="dots-vertical" size={20} color="#6b7280" />
                          </TouchableOpacity>
                        }
                      >
                        <Menu.Item
                          onPress={() => handleUpdateDataset(dataset)}
                          title="Edit"
                          leadingIcon="pencil"
                        />
                        {/* <Menu.Item
                          onPress={() => handleReplaceDataset(dataset)}
                          title="Replace File"
                          leadingIcon="upload"
                        /> */}
                        <Divider />
                        <Menu.Item
                          onPress={() => handleDeleteDataset(dataset)}
                          title="Delete"
                          leadingIcon="delete"
                          titleStyle={{ color: '#ef4444' }}
                        />
                      </Menu>
                    </View>
                  </View>

                  {dataset.description && (
                    <Text variant="bodyMedium" className="text-gray-700 mb-3">
                      {dataset.description}
                    </Text>
                  )}

                  <Divider className="my-3" />

                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text variant="bodySmall" className="text-gray-500">Size</Text>
                      <Text variant="bodyMedium" className="font-medium text-gray-900">
                        {formatFileSize(dataset.file_size)}
                      </Text>
                    </View>
                    
                    {dataset.rows_count && (
                      <View className="flex-1">
                        <Text variant="bodySmall" className="text-gray-500">Rows</Text>
                        <Text variant="bodyMedium" className="font-medium text-gray-900">
                          {dataset.rows_count.toLocaleString()}
                        </Text>
                      </View>
                    )}
                    
                    {dataset.columns_count && (
                      <View className="flex-1">
                        <Text variant="bodySmall" className="text-gray-500">Columns</Text>
                        <Text variant="bodyMedium" className="font-medium text-gray-900">
                          {dataset.columns_count}
                        </Text>
                      </View>
                    )}
                    
                    <View className="flex-1">
                      <Text variant="bodySmall" className="text-gray-500">Uploaded</Text>
                      <Text variant="bodyMedium" className="font-medium text-gray-900">
                        {formatDate(dataset.upload_date)}
                      </Text>
                    </View>
                  </View>

                  {actionLoading === dataset.id && (
                    <View className="absolute inset-0 bg-white bg-opacity-75 items-center justify-center rounded-lg">
                      <ActivityIndicator size="small" color="#6366f1" />
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal d'édition du dataset */}
      <Portal>
        <Modal 
          visible={editModalVisible} 
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            padding: 20,
            margin: 20,
            borderRadius: 10
          }}
        >
          <Text variant="titleLarge" className="mb-4">
            Modifier le dataset
          </Text>
          
          <TextInput
            label="Nom du fichier"
            value={newFilename}
            onChangeText={setNewFilename}
            mode="outlined"
            style={{ marginBottom: 20 }}
            placeholder="Entrez le nouveau nom du fichier"
          />
          
          <View className="flex-row justify-end">
            <Button 
              mode="text" 
              onPress={() => setEditModalVisible(false)}
              style={{ marginRight: 10 }}
            >
              Annuler
            </Button>
            <Button 
              mode="contained" 
              onPress={confirmUpdateDataset}
              loading={actionLoading === editingDataset?.id}
              disabled={!newFilename.trim()}
            >
              Confirmer
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, TextInput } from 'react-native';
import { Card, Button, IconButton, Modal, Portal, Provider as PaperProvider } from 'react-native-paper';
import { authService } from '../services/api/authService';
import Toast from 'react-native-toast-message';

interface Dataset {
  id: number;
  original_filename: string;
  file_size: number;
  n_rows: number;
  n_columns: number;
  created_at: string;
  is_valid: boolean;
}

interface DatasetManagerV2Props {
  onDatasetDeleted?: () => void;
  onDatasetUpdated?: () => void;
}

export default function DatasetManagerV2({ onDatasetDeleted, onDatasetUpdated }: DatasetManagerV2Props) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [newFilename, setNewFilename] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await authService.getDatasets();
      setDatasets(data || []);
    } catch (error: any) {
      console.error('Erreur chargement datasets:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger les datasets'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setNewFilename(dataset.original_filename);
    setEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingDataset || !newFilename.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom de fichier valide');
      return;
    }

    try {
      setLoading(true);
      await authService.updateDataset(editingDataset.id, {
        original_filename: newFilename.trim()
      });

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Dataset mis à jour avec succès'
      });

      setEditModalVisible(false);
      setEditingDataset(null);
      setNewFilename('');
      await loadDatasets();
      onDatasetUpdated?.();

    } catch (error: any) {
      console.error('Erreur mise à jour:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (dataset: Dataset) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer le dataset "${dataset.original_filename}" ?\n\nCette action est irréversible.`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => confirmDelete(dataset)
        }
      ]
    );
  };

  const confirmDelete = async (dataset: Dataset) => {
    try {
      setLoading(true);
      await authService.deleteDataset(dataset.id);

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Dataset supprimé avec succès'
      });

      await loadDatasets();
      onDatasetDeleted?.();

    } catch (error: any) {
      console.error('Erreur suppression:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Erreur lors de la suppression'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <PaperProvider>
      <View style={{ flex: 1 }}>
        <Card style={{ margin: 16 }}>
          <Card.Title 
            title="Gestion des Datasets" 
            subtitle={`${datasets.length} dataset(s) disponible(s)`}
            right={(props) => (
              <IconButton 
                {...props} 
                icon="refresh" 
                onPress={loadDatasets}
                disabled={loading}
              />
            )}
          />
          <Card.Content>
            {loading && (
              <Text style={{ textAlign: 'center', padding: 16 }}>
                Chargement...
              </Text>
            )}
            
            {!loading && datasets.length === 0 && (
              <Text style={{ textAlign: 'center', color: '#666', padding: 16 }}>
                Aucun dataset disponible
              </Text>
            )}
            
            <ScrollView style={{ maxHeight: 400 }}>
              {datasets.map((dataset) => (
                <Card key={dataset.id} style={{ marginBottom: 8, backgroundColor: '#f8f9fa' }}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                          {dataset.original_filename}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>
                          {dataset.n_rows} lignes × {dataset.n_columns} colonnes
                        </Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>
                          {formatFileSize(dataset.file_size)} • {formatDate(dataset.created_at)}
                        </Text>
                        <Text style={{ 
                          color: dataset.is_valid ? '#28a745' : '#dc3545', 
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {dataset.is_valid ? '✓ Valide' : '✗ Invalide'}
                        </Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => handleEdit(dataset)}
                          disabled={loading}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#dc3545"
                          onPress={() => handleDelete(dataset)}
                          disabled={loading}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Modal de modification */}
        <Portal>
          <Modal
            visible={editModalVisible}
            onDismiss={() => setEditModalVisible(false)}
            contentContainerStyle={{
              backgroundColor: 'white',
              padding: 20,
              margin: 20,
              borderRadius: 8
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Modifier le Dataset
            </Text>
            
            <Text style={{ marginBottom: 8 }}>Nom du fichier:</Text>
            <TextInput
              value={newFilename}
              onChangeText={setNewFilename}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 4,
                padding: 12,
                marginBottom: 16,
                fontSize: 16
              }}
              placeholder="Nouveau nom de fichier"
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={{ marginRight: 8 }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                mode="contained"
                onPress={handleUpdate}
                disabled={loading || !newFilename.trim()}
              >
                Sauvegarder
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
}

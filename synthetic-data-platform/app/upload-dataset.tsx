
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatasetManagerV2 from '../components/DatasetManagerV2';
import FileUploadComponent from '../components/FileUploadComponent';
import Toast from 'react-native-toast-message';

export default function UploadDatasetScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // Rafraîchir la liste des datasets après un upload réussi
    setRefreshKey(prev => prev + 1);
    Toast.show({
      type: 'success',
      text1: 'Succès',
      text2: 'Dataset uploadé avec succès!'
    });
  };

  const handleDatasetChange = () => {
    // Rafraîchir la liste après modification/suppression
    setRefreshKey(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Gestion des Datasets
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Uploadez et gérez vos fichiers de données
          </Text>
        </View>

        {/* Section Upload */}
        <Card style={styles.section}>
          <Card.Title title="Upload de Dataset" />
          <Card.Content>
            <Text style={styles.description}>
              Uploadez vos fichiers CSV ou Excel pour créer des données synthétiques.
            </Text>
            <FileUploadComponent 
              onUploadSuccess={handleUploadSuccess}
              key={`upload-${refreshKey}`}
            />
          </Card.Content>
        </Card>

        {/* Section Gestion */}
        <DatasetManagerV2 
          onDatasetDeleted={handleDatasetChange}
          onDatasetUpdated={handleDatasetChange}
          key={`manager-${refreshKey}`}
        />

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Formats supportés: CSV, XLS, XLSX (max 50MB)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    textAlign: 'center',
  },
});
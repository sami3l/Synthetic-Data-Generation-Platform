import React, { useState } from 'react';
import { datasetService } from '@/services/api/datasetService';

export default function DatasetManager() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateDataset = async () => {
    try {
      setLoading(true);
      const newDataset = await datasetService.createDataset();
      setDatasets([...datasets, newDataset]);
      alert('Dataset created successfully!');
    } catch (error) {
      console.error('Error creating dataset:', error);
      alert('Failed to create dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDataset = async (datasetId: number) => {
    try {
      const downloadUrl = await datasetService.downloadDataset(datasetId);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `dataset_${datasetId}.csv`;
      link.click();
    } catch (error) {
      console.error('Error downloading dataset:', error);
      alert('Failed to download dataset.');
    }
  };

  return (
    <div>
      <h1>Dataset Manager</h1>
      <button onClick={handleCreateDataset} disabled={loading}>
        {loading ? 'Creating...' : 'Create Dataset'}
      </button>
      <ul>
        {datasets.map((dataset) => (
          <li key={dataset.id}>
            {dataset.file_name}{' '}
            <button onClick={() => handleDownloadDataset(dataset.id)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
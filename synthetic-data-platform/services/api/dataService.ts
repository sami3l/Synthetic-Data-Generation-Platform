/**
 * Service unifié pour les requêtes de génération de données
 */
import { axiosInstanceLongTimeout , axiosInstance } from './axios.config';


export interface DataRequest {
  id: number;
  user_id: number;
  request_name: string;
  dataset_name: string;
  created_at: string;
  updated_at: string;
  status?: string;
  supabase_url?: string;
  download_url?: string;
  output_file_path?: string;
  quality_score?: number;
  // Relations
  parameters?: RequestParameters;
  uploaded_dataset_id?: number;
}

export interface RequestParameters {
  id: number;
  request_id: number;
  model_type: 'ctgan' | 'tvae' | 'gaussian Coupla';
  epochs: number;
  batch_size: number;
  learning_rate: number;
  optimization_enabled: boolean;
  optimization_method: 'none' | 'grid' | 'random' | 'bayesian';
  optimization_n_trials: number;
  hyperparameters: Record<string, any>;
  created_at: string;
}

export interface DataRequestWithParams {
  request: {
    request_name: string;
    dataset_name: string;
    uploaded_dataset_id?: number;
  };
  params: {
    model_type: string;
    epochs: number;
    batch_size: number;
    learning_rate: number;
    optimization_enabled: boolean;
    optimization_method: string;
    optimization_n_trials: number;
    hyperparameters?: string[];
  };
}

export interface UploadedDataset {
  id: number;
  filename?: string;
  original_filename: string;
  file_size: number;
  file_type?: string;
  upload_path?: string;
  n_rows: number;
  n_columns: number;
  columns?: string[];
  column_info?: Record<string, any>;
  has_nulls?: boolean;
  total_nulls?: number;
  is_valid: boolean;
  created_at: string;
  // Backward compatibility
  analysis_results?: {
    num_rows: number;
    num_columns: number;
    column_types: Record<string, string>;
    missing_values: Record<string, number>;
    data_preview: any[];
  };
}

class DataService {
  /**
   * Créer une nouvelle requête de génération de données
   */
  async createDataRequest(requestData: DataRequestWithParams): Promise<DataRequest> {
    try {
      const response = await axiosInstance.post('/data/requests', requestData);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création de la requête:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la création de la requête');
    }
  }

  /**
   * Récupérer toutes les requêtes de l'utilisateur
   */
  async getDataRequests(): Promise<DataRequest[]> {
    try {
      const response = await axiosInstance.get('/data/requests');
      return response.data || [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des requêtes:', error);
      if (error.response?.status === 404) {
        return []; // Retourner un tableau vide si pas de données
      }
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération des requêtes');
    }
  }

  /**
   * Modifie une requête spécifique
   */
  async updateDataRequest(requestId: number, requestData: Partial<DataRequestWithParams>): Promise<DataRequest> {
    try {
      // Si la requête contient un dataset_id, s'assurer qu'il est inclus dans la mise à jour
      const finalRequestData = { ...requestData };
      
      // Log de debug
      console.log('🔄 [dataService.updateDataRequest] Données à mettre à jour:', finalRequestData);
      
      // Effectuer la requête de mise à jour
      const response = await axiosInstance.put(`/data/requests/${requestId}`, finalRequestData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la modification de la requête:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la modification de la requête');
    }
  }
  /**
   * Récupérer une requête spécifique
   */
  async getDataRequest(requestId: number): Promise<DataRequest> {
    try {
      const response = await axiosInstance.get(`/data/requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la requête:', error);
      throw new Error(error.response?.data?.detail || 'Requête non trouvée');
    }
  }

  /**
   * Démarrer la génération de données synthétiques
   */
  async generateSyntheticData(
    requestId : number,
    generationConfig: {
      dataset_id: number;
      model_type: 'ctgan' | 'tvae' | 'gaussian Coupla';
      sample_size: number;
      mode: 'simple' | 'optimization';
      epochs: number;
      batch_size: number;
      learning_rate: number;
      generator_lr?: number;
      discriminator_lr?: number;
      optimization_method?: 'grid' | 'random' | 'bayesian';
      n_trials?: number;
      hyperparameters?: string[];
    }
  ): Promise<{ message: string; status: string }> {
    try {
      const response = await axiosInstanceLongTimeout.post(`/data/generate/${requestId}`, generationConfig);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du démarrage de la génération:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors du démarrage de la génération');
    }
  }

  /**
   * Récupérer les résultats d'optimisation
   */
  async getOptimizationResults(requestId: number): Promise<{
    request_id: number;
    best_parameters: Record<string, any>;
    quality_score: number;
  }> {
    try {
      const response = await axiosInstance.get(`/data/optimization/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des résultats d\'optimisation:', error);
      throw new Error(error.response?.data?.detail || 'Résultats d\'optimisation non trouvés');
    }
  }

  /**
   * Récupérer les datasets uploadés
   */
  async getUploadedDatasets(filename?: string): Promise<UploadedDataset[]> {
    try {
      console.log('🔄 Récupération des datasets via DataService...');
      
      // Utiliser l'endpoint correct pour récupérer tous les datasets
      const response = await axiosInstance.get('/datasets');
      console.log('✅ Réponse DataService:', response.data);
      
      // Traiter la réponse selon son format
      const data = response.data;
      let datasets: UploadedDataset[] = [];
      
      if (Array.isArray(data)) {
        datasets = data;
      } else if (data && Array.isArray(data.datasets)) {
        datasets = data.datasets;
      } else if (data && Array.isArray(data.data)) {
        datasets = data.data;
      } else {
        console.warn('Format de réponse inattendu dans DataService:', data);
        return [];
      }
      
      // Si un nom de fichier est spécifié, filtrer les datasets correspondants
      if (filename) {
        const lowercaseFilename = filename.toLowerCase();
        return datasets.filter(dataset => 
          dataset.original_filename && 
          dataset.original_filename.toLowerCase().includes(lowercaseFilename)
        );
      }
      
      return datasets;
    } catch (error: any) {
      console.error('❌ Erreur DataService lors de la récupération des datasets:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        return []; // Retourner un tableau vide si pas de données
      } else if (!error.response) {
        throw new Error('Impossible de contacter le serveur.');
      } else {
        throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération des datasets');
      }
    }
  }

  /**
   * Générer avec optimisation
   */
  async generateWithOptimization(
    requestId: number, 
    optimizationConfig: {
      optimization_type: string;
      max_evaluations: number;
      timeout_minutes: number;
      search_space: Record<string, any>;
      acquisition_function: string;
    }
  ): Promise<{
    message: string;
    request_id: number;
    optimization_config_id: number;
  }> {
    try {
      const response = await axiosInstanceLongTimeout.post(
        `/data/generate-with-optimization/${requestId}`,
        optimizationConfig
      );
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la génération avec optimisation:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la génération avec optimisation');
    }
  }

  /**
   * Récupérer l'URL de téléchargement pour les données synthétiques générées
   */
  async getDownloadUrl(requestId: number): Promise<{ download_url: string }> {
    try {
      // Revenir à l'endpoint /data/requests pour utiliser la logique existante
      const response = await axiosInstance.get(`/data/requests/${requestId}/download`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'URL de téléchargement:', error);
      throw new Error(error.response?.data?.detail || 'Impossible de récupérer l\'URL de téléchargement');
    }
  }

  /**
   * Récupérer l'URL de téléchargement direct (via notre backend)
   */
  async getDirectDownloadUrl(requestId: number): Promise<string> {
    try {
      const response = await axiosInstance.get(`/data/requests/${requestId}/download-direct`, {
        responseType: 'blob'
      });
      
      // Créer un blob URL pour le téléchargement
      const blob = new Blob([response.data]);
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error('Erreur lors du téléchargement direct:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors du téléchargement direct');
    }
  }

  /**
   * Obtenir un token de téléchargement temporaire
   */
  async getDownloadToken(requestId: number): Promise<{download_token: string, download_url: string, expires_in_minutes: number}> {
    try {
      const response = await axiosInstance.get(`/data/requests/${requestId}/download-token`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la génération du token de téléchargement:', error);
      throw new Error(error.response?.data?.detail || 'Impossible de générer le token de téléchargement');
    }
  }

  /**
   * Télécharger directement les données synthétiques (pour navigation web)
   */
  async downloadSyntheticData(requestId: number, format: string = 'csv'): Promise<void> {
    try {
      // Revenir à l'endpoint /data/requests pour utiliser la logique existante
      const response = await axiosInstance.get(`/data/requests/${requestId}/download`, {
        params: { format },
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `synthetic_data_${requestId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur lors du téléchargement direct:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors du téléchargement');
    }
  }
}

export const dataService = new DataService();

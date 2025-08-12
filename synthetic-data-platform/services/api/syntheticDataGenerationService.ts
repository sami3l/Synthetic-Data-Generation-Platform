import { axiosInstance } from './axios.config';

// === Types et interfaces ===

export interface GenerationConfigRequest {
  dataset_id: number;
  model_type: 'ctgan' | 'tvae';
  sample_size: number;
  mode: 'simple' | 'optimization';
  
  // Mode simple
  epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  generator_lr?: number;
  discriminator_lr?: number;
  
  // Mode optimisation
  optimization_method?: 'grid' | 'random' | 'bayesian';
  n_trials?: number;
  hyperparameters?: string[];
}

export interface GenerationStartResponse {
  request_id: number;
  message: string;
}

export interface GenerationRequestDetails {
  id: number;
  dataset_id: number;
  model_type: string;
  sample_size: number;
  mode: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Configuration
  epochs?: number;
  batch_size?: number;
  learning_rate?: number;
  generator_lr?: number;
  discriminator_lr?: number;
  
  // Optimisation
  optimization_method?: string;
  n_trials?: number;
  hyperparameters?: string[];
  
  // Résultats
  progress?: number;
  synthetic_data_url?: string;
  model_metrics?: Record<string, any>;
  error_message?: string;
}

export interface GenerationStatusResponse {
  request: GenerationRequestDetails;
  optimization_results?: OptimizationResults;
}

export interface GenerationRequestListResponse {
  requests: GenerationRequestDetails[];
  total: number;
  page: number;
  page_size: number;
}

export interface GenerationDownloadResponse {
  download_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}

export interface OptimizationTrial {
  trial_number: number;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  score: number;
  status: 'running' | 'completed' | 'failed';
  duration: number;
}

export interface OptimizationResults {
  status: 'running' | 'completed' | 'failed';
  method: 'grid' | 'random' | 'bayesian';
  total_trials: number;
  completed_trials: number;
  best_trial?: OptimizationTrial;
  trials: OptimizationTrial[];
  optimization_history: {
    trial: number;
    best_score: number;
    timestamp: string;
  }[];
}

// === Hyperparamètres disponibles ===

export interface HyperparameterOption {
  name: string;
  label: string;
  description: string;
  type: 'integer' | 'float' | 'categorical';
  default_value: number | string | number[];
  range?: {
    min: number;
    max: number;
    step?: number;
  };
  choices?: (string | number | number[])[];
}

export interface ModelHyperparameters {
  ctgan: HyperparameterOption[];
  tvae: HyperparameterOption[];
}

export const AVAILABLE_HYPERPARAMETERS: ModelHyperparameters = {
  ctgan: [
    {
      name: 'epochs',
      label: 'Nombre d\'époques',
      description: 'Nombre d\'itérations d\'entraînement',
      type: 'integer',
      default_value: 300,
      range: { min: 50, max: 1000, step: 50 }
    },
    {
      name: 'batch_size',
      label: 'Taille du batch',
      description: 'Nombre d\'échantillons traités simultanément',
      type: 'categorical',
      default_value: 500,
      choices: [250, 500, 1000]
    },
    {
      name: 'generator_lr',
      label: 'Learning Rate Générateur',
      description: 'Taux d\'apprentissage du générateur',
      type: 'float',
      default_value: 0.0002,
      range: { min: 0.00001, max: 0.001 }
    },
    {
      name: 'discriminator_lr',
      label: 'Learning Rate Discriminateur',
      description: 'Taux d\'apprentissage du discriminateur',
      type: 'float',
      default_value: 0.0002,
      range: { min: 0.00001, max: 0.001 }
    }
  ],
  tvae: [
    {
      name: 'epochs',
      label: 'Nombre d\'époques',
      description: 'Nombre d\'itérations d\'entraînement',
      type: 'integer',
      default_value: 300,
      range: { min: 50, max: 1000, step: 50 }
    },
    {
      name: 'batch_size',
      label: 'Taille du batch',
      description: 'Nombre d\'échantillons traités simultanément',
      type: 'categorical',
      default_value: 500,
      choices: [250, 500, 1000]
    },
    {
      name: 'learning_rate',
      label: 'Learning Rate',
      description: 'Taux d\'apprentissage global',
      type: 'float',
      default_value: 0.001,
      range: { min: 0.0001, max: 0.01 }
    },
    {
      name: 'compress_dims',
      label: 'Dimensions de compression',
      description: 'Architecture des couches de compression',
      type: 'categorical',
      default_value: [128, 128],
      choices: [[64, 64], [128, 128], [256, 256]]
    }
  ]
};

// === Service principal ===

class SyntheticDataGenerationService {
  private readonly baseURL = '/generation/v2';

  /**
   * Démarre une génération avec la nouvelle API v2
   */
  async startGeneration(config: GenerationConfigRequest): Promise<GenerationStartResponse> {
    const response = await axiosInstance.post(`${this.baseURL}/start`, config);
    return response.data;
  }

  /**
   * Récupère le statut d'une génération
   */
  async getGenerationStatus(requestId: number): Promise<GenerationStatusResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/requests/${requestId}/status`);
    return response.data;
  }

  /**
   * Récupère la liste des requêtes de génération
   */
  async getGenerationRequests(page: number = 1, pageSize: number = 20, statusFilter?: string): Promise<GenerationRequestListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (statusFilter) {
      params.append('status_filter', statusFilter);
    }

    const response = await axiosInstance.get(`${this.baseURL}/requests?${params.toString()}`);
    return response.data;
  }

  /**
   * Annule une génération en cours
   */
  async cancelGeneration(requestId: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`${this.baseURL}/requests/${requestId}`);
    return response.data;
  }

  /**
   * Télécharge les données synthétiques générées
   */
  async downloadSyntheticData(requestId: number, format: string = 'csv'): Promise<GenerationDownloadResponse> {
    const response = await axiosInstance.get(`${this.baseURL}/requests/${requestId}/download?format=${format}`);
    return response.data;
  }

  /**
   * Récupère les résultats d'optimisation
   */
  async getOptimizationResults(requestId: number): Promise<OptimizationResults> {
    const response = await axiosInstance.get(`${this.baseURL}/requests/${requestId}/optimization`);
    return response.data;
  }

  /**
   * Polling intelligent du statut avec callback de progression
   */
  async pollGenerationStatus(
    requestId: number, 
    interval: number = 5000,
    onStatusUpdate?: (status: GenerationStatusResponse) => void
  ): Promise<GenerationRequestDetails> {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const statusResponse = await this.getGenerationStatus(requestId);
          
          if (onStatusUpdate) {
            onStatusUpdate(statusResponse);
          }

          const { request } = statusResponse;
          
          if (request.status === 'completed' || request.status === 'failed' || request.status === 'cancelled') {
            resolve(request);
          } else {
            setTimeout(checkStatus, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Valide une configuration avant envoi
   */
  validateConfiguration(config: GenerationConfigRequest): string[] {
    const errors: string[] = [];

    // Validation de base
    if (!config.dataset_id || config.dataset_id <= 0) {
      errors.push('ID de dataset invalide');
    }

    if (!['ctgan', 'tvae'].includes(config.model_type)) {
      errors.push('Type de modèle invalide');
    }

    if (!config.sample_size || config.sample_size < 100 || config.sample_size > 100000) {
      errors.push('Taille d\'échantillons doit être entre 100 et 100,000');
    }

    if (!['simple', 'optimization'].includes(config.mode)) {
      errors.push('Mode invalide');
    }

    // Validation mode simple
    if (config.mode === 'simple') {
      if (!config.epochs || config.epochs < 50 || config.epochs > 1000) {
        errors.push('Nombre d\'époques doit être entre 50 et 1000 en mode simple');
      }
      if (!config.batch_size || config.batch_size < 100 || config.batch_size > 2000) {
        errors.push('Taille de batch doit être entre 100 et 2000 en mode simple');
      }
      if (!config.learning_rate || config.learning_rate < 0.00001 || config.learning_rate > 0.01) {
        errors.push('Learning rate doit être entre 0.00001 et 0.01 en mode simple');
      }
    }

    // Validation mode optimisation
    if (config.mode === 'optimization') {
      if (!config.optimization_method || !['grid', 'random', 'bayesian'].includes(config.optimization_method)) {
        errors.push('Méthode d\'optimisation invalide');
      }
      if (!config.n_trials || config.n_trials < 3 || config.n_trials > 50) {
        errors.push('Nombre d\'essais doit être entre 3 et 50 en mode optimisation');
      }
      if (!config.hyperparameters || config.hyperparameters.length === 0) {
        errors.push('Au moins un hyperparamètre doit être sélectionné en mode optimisation');
      }
    }

    return errors;
  }

  /**
   * Obtient les hyperparamètres disponibles pour un modèle
   */
  getAvailableHyperparameters(modelType: 'ctgan' | 'tvae'): HyperparameterOption[] {
    return AVAILABLE_HYPERPARAMETERS[modelType];
  }

  /**
   * Génère une configuration par défaut
   */
  getDefaultConfiguration(datasetId: number, modelType: 'ctgan' | 'tvae'): GenerationConfigRequest {
    return {
      dataset_id: datasetId,
      model_type: modelType,
      sample_size: 2000,
      mode: 'simple',
      epochs: 300,
      batch_size: 500,
      learning_rate: modelType === 'ctgan' ? 0.0002 : 0.001
    };
  }

  /**
   * Estime le temps de génération
   */
  estimateGenerationTime(config: GenerationConfigRequest): number {
    let baseTime = 5; // 5 minutes de base
    
    // Ajuster selon la taille
    const sizeFactor = config.sample_size / 1000;
    baseTime *= (1 + sizeFactor * 0.3);
    
    // Ajuster selon le mode
    if (config.mode === 'optimization' && config.n_trials) {
      baseTime *= config.n_trials * 0.8;
    }
    
    // Ajuster selon le modèle
    if (config.model_type === 'tvae') {
      baseTime *= 1.2;
    }
    
    return Math.max(2, Math.round(baseTime));
  }
}

export const syntheticDataGenerationService = new SyntheticDataGenerationService();

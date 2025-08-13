/**
 * Hook personnalisé pour la génération de données synthétiques avec optimisation
 */
import { useState, useCallback, useRef } from 'react';
import { 
  syntheticDataGenerationService,
  GenerationStatusResponse 
} from '@/services/api/syntheticDataGenerationService';
import { GenerationConfig } from '@/components/GenerationConfigComponent';

interface GenerationRequest {
  id: number;
  status: string;
  config: GenerationConfig;
  error_message?: string;
}

interface UseGenerationResult {
  // États
  isGenerating: boolean;
  currentRequest: GenerationRequest | null;
  error: string | null;
  progress: number;
  
  // Actions
  startGeneration: (config: GenerationConfig) => Promise<void>;
  checkStatus: (requestId: number) => Promise<GenerationStatusResponse>;
  cancelGeneration: (requestId: number) => Promise<void>;
  downloadResults: (requestId: number) => Promise<void>;
  
  // Utilitaires
  resetError: () => void;
  resetGeneration: () => void;
}

export const useGeneration = (): UseGenerationResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<GenerationRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Référence pour éviter la dépendance circulaire
  const pollGenerationStatusRef = useRef<((requestId: number) => Promise<void>) | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setCurrentRequest(null);
    setError(null);
    setProgress(0);
  }, []);

  const startGeneration = useCallback(async (config: GenerationConfig) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);

      // Mapper la configuration vers les paramètres du service
      const parameters = {
        dataset_id: config.dataset_id,
        model_type: config.model_type,
        sample_size: config.sample_size,
        mode: config.optimization_method === 'none' ? 'simple' as const : 'optimization' as const,
        epochs: config.epochs,
        batch_size: config.batch_size,
        learning_rate: config.learning_rate,
        optimization_method: config.optimization_method === 'none' ? undefined : config.optimization_method,
        n_trials: config.n_trials,
        hyperparameters: config.hyperparameters ? Object.keys(config.hyperparameters) : undefined
      };

      const response = await syntheticDataGenerationService.startGeneration(parameters);
      setCurrentRequest({
        id: response.request_id,
        status: 'pending', // Par défaut car GenerationStartResponse n'a pas de status
        config: config
      });

      // Démarrer le polling du statut
      if (pollGenerationStatusRef.current) {
        pollGenerationStatusRef.current(response.request_id);
      }

    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage de la génération');
      setIsGenerating(false);
      throw err;
    }
  }, []);

  const pollGenerationStatus = useCallback(async (requestId: number) => {
    try {
      const statusResponse = await syntheticDataGenerationService.getGenerationStatus(requestId);
      
      setCurrentRequest(prev => prev ? ({
        ...prev,
        ...statusResponse.request
      }) : null);
      
      // Mettre à jour la progression
      if (statusResponse.request.progress !== undefined) {
        setProgress(statusResponse.request.progress);
      }

      // Vérifier si la génération est terminée
      const { status } = statusResponse.request;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        setIsGenerating(false);
        setProgress(status === 'completed' ? 100 : 0);
        
        if (status === 'failed') {
          setError(statusResponse.request.error_message || 'La génération a échoué');
        }
      } else {
        // Continuer le polling si la génération est en cours
        setTimeout(() => pollGenerationStatusRef.current?.(requestId), 3000);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification du statut');
      setIsGenerating(false);
    }
  }, []);

  // Assigner la fonction à la référence
  pollGenerationStatusRef.current = pollGenerationStatus;

  const checkStatus = useCallback(async (requestId: number): Promise<GenerationStatusResponse> => {
    try {
      const statusResponse = await syntheticDataGenerationService.getGenerationStatus(requestId);
      return statusResponse;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification du statut');
      throw err;
    }
  }, []);

  const cancelGeneration = useCallback(async (requestId: number) => {
    try {
      await syntheticDataGenerationService.cancelGeneration(requestId);
      setIsGenerating(false);
      setCurrentRequest(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
      throw err;
    }
  }, []);

  const downloadResults = useCallback(async (requestId: number) => {
    try {
      const downloadResponse = await syntheticDataGenerationService.downloadSyntheticData(requestId);
      
      // Ouvrir l'URL de téléchargement (React Native)
      if (downloadResponse.download_url) {
        // TODO: Implémenter le téléchargement selon la plateforme
        console.log('URL de téléchargement:', downloadResponse.download_url);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement');
      throw err;
    }
  }, []);

  return {
    // États
    isGenerating,
    currentRequest,
    error,
    progress,
    
    // Actions
    startGeneration,
    checkStatus,
    cancelGeneration,
    downloadResults,
    
    // Utilitaires
    resetError,
    resetGeneration
  };
};

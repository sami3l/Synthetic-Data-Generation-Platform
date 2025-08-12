// /**
//  * Hook personnalisé pour la génération de données synthétiques
//  * Gère à la fois la génération simple et avancée avec optimisation
//  */
// import { useState, useCallback, us  // Fonctions utilitaires simplifiées
//   const getAvailableHyperparameters = useCallback((modelType: 'ctgan' | 'tvae') => {
//     // Retourner les hyperparamètres disponibles de base
//     if (modelType === 'ctgan') {
//       return ['epochs', 'batch_size', 'learning_rate', 'generator_lr', 'discriminator_lr'];
//     } else {
//       return ['epochs', 'batch_size', 'learning_rate'];
//     }
//   }, []);

//   const getSampleSizeOptions = useCallback(() => {
//     return [100, 500, 1000, 2000, 5000, 10000];
//   }, []);

//   const getDefaultParams = useCallback((modelType: 'ctgan' | 'tvae') => {
//     // Paramètres par défaut
//     if (modelType === 'ctgan') {
//       return {
//         epochs: 300,
//         batch_size: 500,
//         learning_rate: 0.0002,
//         generator_lr: 0.0002,
//         discriminator_lr: 0.0002
//       };
//     } else {
//       return {
//         epochs: 300,
//         batch_size: 500,
//         learning_rate: 0.001
//       };
//     }
//   }, []);'react';
// import { 
//   syntheticDataGenerationService,
//   GenerationConfigRequest,
//   GenerationStatusResponse,
//   GenerationStartResponse,
//   GenerationRequestDetails
// } from '@/services/api/syntheticDataGenerationService';

// interface GenerationState {
//   isGenerating: boolean;
//   currentRequest: GenerationRequestDetails | null;
//   progress: number;
//   status: string;
//   error: string | null;
//   estimatedTimeRemaining?: string;
// }

// export const useSyntheticGeneration = () => {
//   const [state, setState] = useState<GenerationState>({
//     isGenerating: false,
//     currentRequest: null,
//     progress: 0,
//     status: 'idle',
//     error: null
//   });

//   const pollingRef = useRef<number | null>(null);

//   // Polling du statut
//   const startStatusPolling = useCallback((requestId: number) => {
//     const poll = async () => {
//       try {
//         const statusResponse = await syntheticDataGenerationService.getGenerationStatus(requestId);
//         const { request } = statusResponse;

//         setState(prev => ({
//           ...prev,
//           currentRequest: request,
//           status: request.status,
//           progress: request.progress || prev.progress,
//           estimatedTimeRemaining: undefined // Pas d'estimation disponible dans l'API actuelle
//         }));

//         // Arrêter le polling si terminé
//         if (['completed', 'failed', 'cancelled'].includes(request.status)) {
//           if (pollingRef.current) {
//             clearInterval(pollingRef.current);
//             pollingRef.current = null;
//           }

//           setState(prev => ({
//             ...prev,
//             isGenerating: false,
//             progress: request.status === 'completed' ? 100 : prev.progress,
//             error: request.status === 'failed' ? (request.error_message || null) : null
//           }));
//         }
//       } catch (error: any) {
//         console.error('Erreur lors du polling:', error);
//         setState(prev => ({
//           ...prev,
//           error: 'Erreur lors de la récupération du statut'
//         }));
//       }
//     };

//     // Poll immédiatement puis toutes les 3 secondes
//     poll();
//     pollingRef.current = window.setInterval(poll, 3000);
//   }, []);

//   // Démarrer génération (simple ou avancée)
//   const startGeneration = useCallback(async (request: GenerationConfigRequest) => {
//     setState(prev => ({
//       ...prev,
//       isGenerating: true,
//       progress: 0,
//       status: 'starting',
//       error: null
//     }));

//     try {
//       const result = await syntheticDataGenerationService.startGeneration(request);
      
//       setState(prev => ({
//         ...prev,
//         status: 'started',
//         progress: 10
//       }));

//       // Démarrer le polling du statut
//       startStatusPolling(result.request_id);
      
//       return result;
//     } catch (error: any) {
//       setState(prev => ({
//         ...prev,
//         isGenerating: false,
//         error: error.message || 'Erreur lors du démarrage de la génération',
//         status: 'error'
//       }));
//       throw error;
//     }
//   }, [startStatusPolling]);

//   // Annuler génération
//   const cancelGeneration = useCallback(async () => {
//     if (!state.currentRequest) return;

//     try {
//       await syntheticDataGenerationService.cancelGeneration(state.currentRequest.id);
      
//       if (pollingRef.current) {
//         clearInterval(pollingRef.current);
//         pollingRef.current = null;
//       }

//       setState(prev => ({
//         ...prev,
//         isGenerating: false,
//         status: 'cancelled',
//         progress: 0
//       }));
//     } catch (error: any) {
//       setState(prev => ({
//         ...prev,
//         error: error.message || 'Erreur lors de l\'annulation'
//       }));
//     }
//   }, [state.currentRequest]);

//   // Télécharger données générées
//   const downloadSyntheticData = useCallback(async () => {
//     if (!state.currentRequest || state.currentRequest.status !== 'completed') {
//       throw new Error('Aucune génération complète à télécharger');
//     }

//     try {
//       const downloadResponse = await syntheticDataGenerationService.downloadSyntheticData(
//         state.currentRequest.id
//       );
      
//       // Ouvrir le lien de téléchargement
//       if (typeof window !== 'undefined') {
//         window.open(downloadResponse.download_url, '_blank');
//       }
      
//       return downloadResponse;
//     } catch (error: any) {
//       setState(prev => ({
//         ...prev,
//         error: error.message || 'Erreur lors du téléchargement'
//       }));
//       throw error;
//     }
//   }, [state.currentRequest]);

//   // Réinitialiser l'état
//   const resetState = useCallback(() => {
//     if (pollingRef.current) {
//       clearInterval(pollingRef.current);
//       pollingRef.current = null;
//     }

//     setState({
//       isGenerating: false,
//       currentRequest: null,
//       progress: 0,
//       status: 'idle',
//       error: null
//     });
//   }, []);

//   // Utilitaires
//   const getAvailableHyperparameters = useCallback((modelType: 'ctgan' | 'tvae'): HyperparameterOption[] => {
//     return syntheticDataGenerationService.getAvailableHyperparameters(modelType);
//   }, []);

//   const getSampleSizeOptions = useCallback(() => {
//     return SAMPLE_SIZE_OPTIONS;
//   }, []);

//   const getDefaultParams = useCallback((modelType: 'ctgan' | 'tvae') => {
//     return syntheticDataGenerationService.getDefaultParams(modelType);
//   }, []);

//   // Nettoyage lors du démontage
//   const cleanup = useCallback(() => {
//     if (pollingRef.current) {
//       clearInterval(pollingRef.current);
//       pollingRef.current = null;
//     }
//   }, []);

//   return {
//     // État
//     ...state,
    
//     // Actions principales
//     startGeneration,
//     cancelGeneration,
//     downloadSyntheticData,
//     resetState,
    
//     // Utilitaires
//     getAvailableHyperparameters,
//     getSampleSizeOptions,
//     getDefaultParams,
    
//     // Nettoyage
//     cleanup
//   };
// };

// export default useSyntheticGeneration;

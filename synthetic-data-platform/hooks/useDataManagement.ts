// /**
//  * Hook personnalisé pour la gestion des requêtes de données
//  * Optimise les appels API et la gestion d'état
//  */
// import { useState, useEffect, useCallback, useRef } from 'react';
// import { authService } from '@/services/api/authService';
// // import { datasetUploadService } from '@/services/api/datasetService';

// export interface DataRequest {
//   id: number;
//   request_name: string;
//   dataset_name: string;
//   status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
//   created_at: string;
//   updated_at: string;
//   user_id: number;
//   request_parameters?: any;
// }

// export interface UseDataRequestsReturn {
//   requests: DataRequest[];
//   isLoading: boolean;
//   isRefreshing: boolean;
//   error: string | null;
//   refreshRequests: () => Promise<void>;
//   createRequest: (requestData: any) => Promise<DataRequest>;
//   deleteRequest: (requestId: number) => Promise<void>;
// }

// export const useDataRequests = (): UseDataRequestsReturn => {
//   const [requests, setRequests] = useState<DataRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const hasAttemptedLoad = useRef(false);

//   const loadRequests = useCallback(async (isRefresh = false) => {
//     // Éviter les chargements multiples simultanés
//     if (!isRefresh && isLoading && hasAttemptedLoad.current) {
//       console.log('📋 Hook useDataRequests: Chargement déjà en cours, ignoré');
//       return;
//     }

//     try {
//       if (isRefresh) {
//         setIsRefreshing(true);
//       } else {
//         setIsLoading(true);
//         hasAttemptedLoad.current = true;
//       }
      
//       setError(null);
//       const data = await authService.getRequests();
//       setRequests(data);
      
//     } catch (err: any) {
//       const errorMessage = err.message || 'Erreur lors du chargement des requêtes';
//       setError(errorMessage);
//       console.error('Error loading requests:', err);
      
//       // Si erreur d'auth, ne pas réessayer automatiquement
//       if (errorMessage.includes('Session expired')) {
//         console.log('🚨 Session expirée dans hook, arrêt des tentatives');
//         setRequests([]);
//       }
//       console.error('Error loading requests:', err);
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }, [isLoading]); // Ajouter isLoading aux dépendances

//   const refreshRequests = useCallback(async () => {
//     await loadRequests(true);
//   }, [loadRequests]);

//   const createRequest = useCallback(async (requestData: any): Promise<DataRequest> => {
//     try {
//       const newRequest = await authService.createRequest(requestData);
//       setRequests(prev => [newRequest, ...prev]);
//       return newRequest;
//     } catch (err: any) {
//       const errorMessage = err.message || 'Erreur lors de la création de la requête';
//       setError(errorMessage);
//       throw err;
//     }
//   }, []);

//   const deleteRequest = useCallback(async (requestId: number): Promise<void> => {
//     try {
//       await authService.deleteRequest(requestId);
//       setRequests(prev => prev.filter(req => req.id !== requestId));
//     } catch (err: any) {
//       const errorMessage = err.message || 'Erreur lors de la suppression de la requête';
//       setError(errorMessage);
//       throw err;
//     }
//   }, []);

//   useEffect(() => {
//     if (!hasAttemptedLoad.current) {
//       loadRequests();
//     }
//   }, [loadRequests]);

//   return {
//     requests,
//     isLoading,
//     isRefreshing,
//     error,
//     refreshRequests,
//     createRequest,
//     deleteRequest,
//   };
// };

// export interface UseDatasetUploadReturn {
//   datasets: any[];
//   isLoading: boolean;
//   error: string | null;
//   uploadDataset: (file: any, filename: string) => Promise<any>;
//   refreshDatasets: () => Promise<void>;
//   deleteDataset: (datasetId: number) => Promise<void>;
// }

// export const useDatasetUpload = (): UseDatasetUploadReturn => {
//   const [datasets, setDatasets] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const loadDatasets = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const data = await datasetUploadService.getUploadedDatasets();
//       setDatasets(data);
//     } catch (err: any) {
//       const errorMessage = err.message || 'Erreur lors du chargement des datasets';
//       setError(errorMessage);
//       console.error('Error loading datasets:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const refreshDatasets = useCallback(async () => {
//     await loadDatasets();
//   }, [loadDatasets]);

//   const uploadDataset = useCallback(async (file: any, filename: string) => {
//     try {
//       setError(null);
//       const result = await datasetUploadService.uploadDataset(file, filename);
//       await loadDatasets(); // Recharger la liste
//       return result;
//     } catch (err: any) {
//       const errorMessage = err.message || 'Erreur lors de l\'upload du dataset';
//       setError(errorMessage);
//       throw err;
//     }
//   }, [loadDatasets]);

//   const deleteDataset = useCallback(async (datasetId: number) => {
//     try {
//       setError(null);
//       await datasetUploadService.deleteDataset(datasetId);
//       setDatasets(prev => prev.filter(ds => ds.id !== datasetId));
//     } catch (err: any) {
//       const errorMessage = err.message || 'Erreur lors de la suppression du dataset';
//       setError(errorMessage);
//       throw err;
//     }
//   }, []);

//   useEffect(() => {
//     loadDatasets();
//   }, [loadDatasets]);

//   return {
//     datasets,
//     isLoading,
//     error,
//     uploadDataset,
//     refreshDatasets,
//     deleteDataset,
//   };
// };

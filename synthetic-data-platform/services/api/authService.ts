// services/api/authService.ts
import { OptimizationConfig, OptimizationTrial } from '@/types/type';
import { axiosInstance } from './axios.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
    // Authentication methods
    async signup(data: { email: string; password: string; username: string }): Promise<{ token: string }> {
        try {
            const response = await axiosInstance.post('/auth/signup', data);
            return response.data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<{ access_token: string; user?: any }> {
        try {
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const response = await axiosInstance.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.data.access_token) {
                await AsyncStorage.setItem('token', response.data.access_token);
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Email ou mot de passe incorrect');
            }
            console.error('Login error:', error);
            throw error;
        }
    }

    // User profile methods
    async getProfile(): Promise<UserProfileResponse> {
        try {
            const response = await axiosInstance.get('/auth/profile');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Get profile error:', error);
            throw new Error('Failed to load profile data');
        }
    }

    async updateProfile(profileData: UserProfileUpdate): Promise<UserProfileResponse> {
        try {
            const response = await axiosInstance.put('/auth/profile', profileData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Update profile error:', error);
            throw new Error('Failed to update profile');
        }
    }

    async logout() {
        try {
            await AsyncStorage.multiRemove(['token', 'user']);
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }

    // Data request methods
    async createRequest(requestData: DataRequestCreate): Promise<DataRequest> {
        try {
            console.log('🚀 [AuthService] Création requête:', requestData);
            const response = await axiosInstance.post('/data/requests', requestData);
            console.log('✅ [AuthService] Requête créée:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ [AuthService] Erreur création requête:', error);
            
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            } else if (error.response?.status === 422) {
                const details = error.response?.data?.detail || [];
                const errorMessages = Array.isArray(details) 
                    ? details.map((d: any) => `${d.loc?.join(' → ')}: ${d.msg}`).join(', ')
                    : error.response?.data?.detail || 'Données invalides';
                throw new Error(`Erreur de validation: ${errorMessages}`);
            } else if (error.response?.status === 404) {
                throw new Error('Endpoint non trouvé. Vérifiez que le backend est à jour.');
            } else if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            } else if (error.message?.includes('Network Error')) {
                throw new Error('Erreur réseau. Vérifiez que le backend est démarré et accessible.');
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error('Connexion refusée. Le serveur backend n\'est pas accessible.');
            } else {
                throw new Error(`Erreur HTTP ${error.response?.status || 'inconnue'}: ${error.message}`);
            }
        }
    }

    async getRequests(): Promise<DataRequest[]> {
        try {
            const response = await axiosInstance.get('/data/requests');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Get requests error:', error);
            throw new Error('Failed to load requests data');
        }
    }

    async getRequestById(requestId: number): Promise<DataRequest> {
        try {
            const response = await axiosInstance.get(`/data/requests/${requestId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            if (error.response?.status === 404) {
                throw new Error('Request not found');
            }
            console.error('Get request by ID error:', error);
            throw new Error('Failed to load request details');
        }
    }

    // async deleteRequest(requestId: number): Promise<void> {
    //     try {
    //         await axiosInstance.delete(`/data/requests/${requestId}`);
    //     } catch (error: any) {
    //         if (error.response?.status === 401) {
    //             throw new Error('Session expired. Please login again.');
    //         }
    //         console.error(`Delete request ${requestId} error:`, error);
    //         throw new Error(`Failed to delete request with ID ${requestId}`);
    //     }
    // }


    async deleteRequest(requestId: number): Promise<void> {
        try {
            const response = await axiosInstance.delete(`/data/requests/${requestId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression de la requête:', error);
            throw error;
        }
    }

    // Dataset methods
    async getDatasets(): Promise<any[]> {
        try {
            console.log('🔄 Récupération des datasets via authService...');
            
            // Récupérer directement les datasets
            const response = await axiosInstance.get('/datasets/');
            console.log('✅ Datasets récupérés:', response.data);
            
            // Traiter la réponse
            const data = response.data;
            if (data && Array.isArray(data.datasets)) {
                return data.datasets;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.warn('Format de réponse inattendu:', data);
                return [];
            }
            
        } catch (error: any) {
            console.error('❌ Erreur lors de la récupération des datasets:', error);
            
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

    async checkFilenameExists(filename: string): Promise<{exists: boolean, dataset_id?: number, message: string}> {
        try {
            const response = await axiosInstance.get(`/datasets/check-filename/${encodeURIComponent(filename)}`);
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la vérification du nom de fichier:', error);
            if (error.response?.status === 401) {
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            throw new Error('Erreur lors de la vérification du nom de fichier');
        }
    }

    async updateDataset(datasetId: number, updateData: {original_filename?: string, name?: string, description?: string}): Promise<any> {
        try {
            const response = await axiosInstance.put(`/datasets/${datasetId}`, updateData);
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour du dataset:', error);
            if (error.response?.status === 401) {
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            if (error.response?.status === 404) {
                throw new Error('Dataset non trouvé');
            }
            if (error.response?.status === 400) {
                throw new Error(error.response.data.detail || 'Erreur de validation');
            }
            throw new Error('Erreur lors de la mise à jour du dataset');
        }
    }

    async deleteDataset(datasetId: number): Promise<any> {
        try {
            const response = await axiosInstance.delete(`/datasets/${datasetId}`);
            return response.data;
        } catch (error: any) {
            console.error('Erreur lors de la suppression du dataset:', error);
            if (error.response?.status === 401) {
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            if (error.response?.status === 404) {
                throw new Error('Dataset non trouvé');
            }
            throw new Error('Erreur lors de la suppression du dataset');
        }
    }

    // Generation methods
    async generateData(requestId: number): Promise<GenerationResult> {
        try {
            const response = await axiosInstance.post(`/data/generate/${requestId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Data generation error:', error);
            throw new Error('Failed to generate data');
        }
    }

    async markAllNotificationsAsRead(): Promise<void> {
        try {
            await axiosInstance.post('/notifications/read-all');
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            }
            console.error('Mark all notifications as read error:', error);
            throw new Error('Failed to mark all notifications as read');
        }
    }

    async markNotificationAsRead(notificationId: number): Promise<void> {
        try {
            await axiosInstance.post(`/notifications/${notificationId}/read`);
            console.log(`✅ Notification ${notificationId} marked as read`);
        } catch (error: any) {
            console.error('❌ Error marking notification as read:', error);
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please login again.');
            } else if (error.response?.status === 404) {
                throw new Error('Notification not found');
            } else {
                throw new Error('Failed to mark notification as read');
            }
        }
    }

    // Nouvelles méthodes d'optimisation
    async createOptimizationConfig(config: OptimizationConfig): Promise<OptimizationConfig> {
        const response = await axiosInstance.post('/optimization/config', config);
        return response.data;
    }

    async startOptimization(configId: number): Promise<{ message: string; config_id: number }> {
        const response = await axiosInstance.post(`/optimization/start/${configId}`);
        return response.data;
    }

    async getOptimizationConfig(configId: number): Promise<OptimizationConfig> {
        const response = await axiosInstance.get(`/optimization/config/${configId}`);
        return response.data;
    }

    async getOptimizationTrials(configId: number): Promise<OptimizationTrial[]> {
        const response = await axiosInstance.get(`/optimization/trials/${configId}`);
        return response.data;
    }

    async getBestParameters(configId: number): Promise<{
        config_id: number;
        best_parameters: Record<string, any>;
        best_score: number;
        trial_number: number;
    }> {
        const response = await axiosInstance.get(`/optimization/best-parameters/${configId}`);
        return response.data;
    }

    async generateWithOptimization(
        requestId: number, 
        optimizationConfig: OptimizationConfig
    ): Promise<{ message: string; request_id: number; optimization_config_id: number }> {
        const response = await axiosInstance.post(
          `/data/generate-with-optimization/${requestId}`, 
          optimizationConfig
        );
        return response.data;
    }

    async stopOptimization(configId: number): Promise<{ message: string }> {
        const response = await axiosInstance.delete(`/optimization/config/${configId}`);
        return response.data;
    }

}

export const authService = new AuthService();

// Interfaces
interface UserProfileResponse {
    id: number;
    user_id: number;
    full_name?: string;
    organization?: string;
    usage_purpose?: string;
    created_at?: string;
    updated_at?: string;
}

interface UserProfileUpdate {
    full_name?: string;
    organization?: string;
    usage_purpose?: string;
}

interface DataRequest {
    id: number;
    user_id: number;
    request_name: string;
    dataset_name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    parameters: {
        model_type: string;
        epochs: number;
        batch_size: number;
        learning_rate: number;
        optimization_enabled: boolean;
        optimization_search_type: string;
        optimization_n_trials: number;
        request_id: number;
    };
}

interface DataRequestCreate {
    request: {
        request_name: string;
        dataset_name: string;
    };
    params: {
        model_type: string;
        sample_size: number;
        epochs?: number;
        batch_size?: number;
        learning_rate?: number;
        optimization_enabled?: boolean;
        optimization_search_type?: string;
        optimization_n_trials?: number;
    };
}

interface GenerationResult {
    request_id: number;
    quality_score: number;
    output_path: string;
    optimized: boolean;
    final_parameters: {
        epochs: number;
        batch_size: number;
        learning_rate: number;
        model_type: string;
    };
    notification_created: boolean;
}
import { axiosInstance } from './axios.config';

export interface SignupData {
    email: string;
    password: string;
    username?: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: {
        id: number;
        email: string;
        username?: string;
    };
}
export interface Request {
  id: number;
  name: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  model: 'CTGAN' | 'TVAE';
  created_at: string;
  completed_at: string | null;
}

export interface RequestDetails extends Request {
  parameters: {
    epochs: number;
    batch_size: number;
    learning_rate: number;
    optimization_enabled: boolean;
  };
  optimization_results?: {
    best_params: {
      epochs: number;
      batch_size: number;
    };
    score: number;
  };
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
  read: boolean;
  created_at: string;
}

export interface RequestFormData {
  name: string;
  model: 'CTGAN' | 'TVAE';
  epochs: string;
  batchSize: string;
  learningRate: string;
  optimizationEnabled: boolean;
}

export const authService = {
    async signup(data: SignupData) {
        try {
            const response = await axiosInstance.post('/auth/signup', data);
            return response.data;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            // Créer URLSearchParams pour le format x-www-form-urlencoded
            const params = new URLSearchParams();
            params.append('username', email);
            params.append('password', password);

            const response = await axiosInstance.post<LoginResponse>('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            // Stocker le token dans les headers par défaut pour les futures requêtes
            if (response.data.access_token) {
                axiosInstance.defaults.headers.common['Authorization'] = 
                    `Bearer ${response.data.access_token}`;
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Email ou mot de passe incorrect');
            }
            console.error('Login error:', error);
            throw error;
        }
    },

    async logout() {
        // Supprimer le token des headers
        delete axiosInstance.defaults.headers.common['Authorization'];
    }
};
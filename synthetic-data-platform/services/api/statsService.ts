/**
 * Service API pour les statistiques et analytics
 */
import { axiosInstance } from './axios.config';

export interface DashboardStats {
  requests: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    success_rate: number;
  };
  datasets: {
    total: number;
  };
  recent_requests: {
    id: number;
    model_type: string;
    status: string;
    created_at: string;
    sample_size: number;
  }[];
  activity_chart: {
    date: string;
    requests: number;
  }[];
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
  };
  requests: {
    total: number;
    completed: number;
    processing: number;
    success_rate: number;
  };
  model_usage: {
    model_type: string;
    count: number;
  }[];
  monthly_activity: {
    date: string;
    requests: number;
  }[];
}

export interface PerformanceStats {
  performance_by_model: Record<string, {
    avg_duration: number;
    min_duration: number;
    max_duration: number;
    count: number;
  }>;
  total_completed: number;
}

export interface UserDataExport {
  user_info: {
    id: number;
    email: string;
    created_at: string;
  };
  requests: {
    id: number;
    status: string;
    parameters: Record<string, any>;
    created_at: string;
    completed_at?: string;
    error_message?: string;
  }[];
  datasets: {
    id: number;
    filename: string;
    file_size: number;
    analysis_results: Record<string, any>;
    uploaded_at: string;
  }[];
  notifications: {
    id: number;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
  }[];
}

class StatsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await axiosInstance.get('/stats/dashboard');
    return response.data;
  }

  async getSystemStats(): Promise<SystemStats> {
    const response = await axiosInstance.get('/stats/system');
    return response.data;
  }

  async getPerformanceStats(): Promise<PerformanceStats> {
    const response = await axiosInstance.get('/stats/performance');
    return response.data;
  }

  async exportUserData(): Promise<UserDataExport> {
    const response = await axiosInstance.get('/stats/export');
    return response.data;
  }

  // Helper method to format duration
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  // Helper method to calculate success rate percentage
  calculateSuccessRate(completed: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((completed / total) * 100)}%`;
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Green
      case 'processing':
        return '#2196F3'; // Blue
      case 'pending':
        return '#FF9800'; // Orange
      case 'failed':
        return '#F44336'; // Red
      case 'cancelled':
        return '#9E9E9E'; // Grey
      default:
        return '#9E9E9E';
    }
  }

  // Helper method to get model type display name
  getModelDisplayName(modelType: string): string {
    switch (modelType) {
      case 'ctgan':
        return 'CTGAN';
      case 'tvae':
        return 'TVAE';
      default:
        return modelType.toUpperCase();
    }
  }
}

export const statsService = new StatsService();

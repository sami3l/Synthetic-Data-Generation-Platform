import { axiosInstance } from './axios.config';

// Types pour l'administration
export interface User {
  id: number;
  email: string;
  role: string;
  username: string | null;
  is_active: boolean;
}

export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string | null;
  organization: string | null;
  usage_purpose: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AdminActionLog {
  id: number;
  admin_id: number;
  action: string;
  target_user_id: number | null;
  details: string | null;
  created_at: string;
}

export interface DataRequest {
  id: number;
  user_id: number;
  request_name: string;
  dataset_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Paramètres de requête
export interface ListUsersParams {
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface ListRequestsParams {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
}

// Service d'administration
export const adminService = {
  // Gestion des utilisateurs
  async getUsers(params: ListUsersParams = {}): Promise<User[]> {
    const response = await axiosInstance.get('/admin/users', { params });
    return response.data;
  },

  async getUserDetail(userId: number): Promise<User> {
    const response = await axiosInstance.get(`/admin/users/${userId}`);
    return response.data;
  },

  async getUserProfile(userId: number): Promise<UserProfile> {
    const response = await axiosInstance.get(`/admin/users/${userId}/profile`);
    return response.data;
  },

  async updateUserActive(userId: number, isActive: boolean): Promise<User> {
    const response = await axiosInstance.patch(`/admin/users/${userId}/active`, {
      is_active: isActive
    });
    return response.data;
  },

  async updateUserRole(userId: number, role: string): Promise<User> {
    const response = await axiosInstance.patch(`/admin/users/${userId}/role`, {
      role: role
    });
    return response.data;
  },

  async deleteUser(userId: number): Promise<void> {
    await axiosInstance.delete(`/admin/users/${userId}`);
  },

  // Gestion des requêtes
  async getRequests(params: ListRequestsParams = {}): Promise<DataRequest[]> {
    const response = await axiosInstance.get('/admin/requests', { params });
    return response.data;
  },

  async getRequestDetail(requestId: number): Promise<DataRequest> {
    const response = await axiosInstance.get(`/admin/requests/${requestId}`);
    return response.data;
  },

  async approveRequest(requestId: number): Promise<DataRequest> {
    const response = await axiosInstance.put(`/admin/requests/${requestId}/approve`);
    return response.data;
  },

  async rejectRequest(requestId: number, rejectionReason: string): Promise<DataRequest> {
    const response = await axiosInstance.put(`/admin/requests/${requestId}/reject?rejection_reason=${encodeURIComponent(rejectionReason)}`);
    return response.data;
  },

  async deleteRequest(requestId: number): Promise<void> {
    await axiosInstance.delete(`/admin/requests/${requestId}`);
  },

  // Logs d'action admin
  async getAdminActionLogs(skip: number = 0, limit: number = 50): Promise<AdminActionLog[]> {
    const response = await axiosInstance.get('/admin/admin-action-logs', {
      params: { skip, limit }
    });
    return response.data;
  },

  //TODO 
  async getAdminActionLogDetail(logId: number): Promise<AdminActionLog> {
    const response = await axiosInstance.get(`/admin/admin-action-logs/${logId}`);
    return response.data;
  },
};

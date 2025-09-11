import { axiosInstance } from './axios.config';

export const datasetService = {
  async createDataset(): Promise<any> {
    const response = await axiosInstance.post('/synthetic/');
    return response.data;
  },

  async downloadDataset(datasetId: number): Promise<string> {
    const response = await axiosInstance.get(`/synthetic/${datasetId}/download`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
  async datasetUploadService(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/synthetic/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
import apiClient from './apiClient';

export const reportsService = {
  downloadReport: async (endpoint: string, type: 'excel' | 'pdf', params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get(`${endpoint}/${type}`, {
      params,
      responseType: 'blob'
    });
    return response;
  }
};

export default reportsService;

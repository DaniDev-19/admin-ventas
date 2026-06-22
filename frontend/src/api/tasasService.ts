import apiClient from './apiClient';

export const tasasService = {
  getLatest: async () => {
    const response = await apiClient.get('/tasas/latest');
    return response.data; // Espera { status, data: { id, tasa_usd, tasa_euro, created_at } }
  },

  refresh: async () => {
    const response = await apiClient.post('/tasas/refresh');
    return response.data;
  }
};

export default tasasService;

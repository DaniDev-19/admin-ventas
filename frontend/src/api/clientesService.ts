import apiClient from './apiClient';

export interface ClientePayload {
  nombre: string;
  cedula: string;
  telefono: string | null;
  email: string | null;
  status: string;
}

export const clientesService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await apiClient.get('/clients', { params });
    return response.data.data; // Espera { items, total, page, limit, pages }
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data.data;
  },

  create: async (data: ClientePayload) => {
    const response = await apiClient.post('/clients', data);
    return response.data.data;
  },

  update: async (id: number, data: ClientePayload) => {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data;
  }
};

export default clientesService;

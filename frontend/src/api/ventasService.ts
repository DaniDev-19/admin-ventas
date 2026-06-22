import apiClient from './apiClient';

export interface VentaPayload {
  clientes_id: number;
  productos_id: number;
  tasa_moneda_id: number;
  cantidad: number;
  precio_unitario: number;
  idempotency_key?: string;
}

export const ventasService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await apiClient.get('/ventas', { params });
    return response.data; // Espera { status, data, meta }
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/ventas/${id}`);
    return response.data.data;
  },

  create: async (data: VentaPayload) => {
    const response = await apiClient.post('/ventas', data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/ventas/${id}`);
    return response.data;
  },

  deleteNoRestore: async (id: number) => {
    const response = await apiClient.delete(`/ventas/${id}/no-restore`);
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await apiClient.put(`/ventas/${id}`, { status });
    return response.data.data;
  }
};

export default ventasService;

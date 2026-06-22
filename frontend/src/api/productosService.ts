import apiClient from './apiClient';

export interface ProductoPayload {
  nombre: string;
  categoria: string;
  precio_usd: number;
  stock: number;
  status: string;
}

export const productosService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string; categoria?: string }) => {
    const response = await apiClient.get('/product', { params });
    return response.data.data; // Espera { items, total, page, limit, pages }
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/product/${id}`);
    return response.data.data;
  },

  create: async (data: ProductoPayload) => {
    const response = await apiClient.post('/product', data);
    return response.data.data;
  },

  update: async (id: number, data: ProductoPayload) => {
    const response = await apiClient.put(`/product/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/product/${id}`);
    return response.data;
  }
};

export default productosService;

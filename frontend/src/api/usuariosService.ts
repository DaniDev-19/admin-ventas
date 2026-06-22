import apiClient from './apiClient';

export interface Usuario {
  id: number;
  username: string;
  nombre: string | null;
  rol: string;
  status: string;
  created_at?: string;
}

export interface UsuarioPayload {
  username: string;
  password?: string | null;
  nombre?: string | null;
  rol: string;
  status?: string;
}

export const usuariosService = {
  getAll: async (): Promise<Usuario[]> => {
    const response = await apiClient.get('/usuarios');
    return response.data.data;
  },

  create: async (data: UsuarioPayload): Promise<Usuario> => {
    const response = await apiClient.post('/usuarios', data);
    return response.data.data;
  },

  update: async (id: number, data: UsuarioPayload): Promise<Usuario> => {
    const response = await apiClient.put(`/usuarios/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<{ status: string; message: string }> => {
    const response = await apiClient.delete(`/usuarios/${id}`);
    return response.data;
  }
};

export default usuariosService;

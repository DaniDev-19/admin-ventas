import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';

interface User {
  id: number;
  username: string;
  nombre?: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerUser: (username: string, password: string, nombre?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión de forma segura utilizando cookies SameSite
    const storedToken = getCookie('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      // Limpiar inconsistencias
      removeCookie('token');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token: receivedToken, user: receivedUser } = response.data.data;

      // Almacenamiento seguro del token en Cookie con SameSite=Strict
      setCookie('token', receivedToken, 7); // Expiración en 7 días
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (username: string, password: string, nombre?: string) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', { username, password, nombre });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Eliminación de credenciales
    removeCookie('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

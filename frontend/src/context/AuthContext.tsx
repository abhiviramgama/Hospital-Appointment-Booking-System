import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('carepulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('carepulse_access_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me/');
      setUser(res.data);
      localStorage.setItem('carepulse_user', JSON.stringify(res.data));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }

    const handleGlobalLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:logout', handleGlobalLogout);
    return () => window.removeEventListener('auth:logout', handleGlobalLogout);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login/', { email, password });
      const { access, refresh, user: loggedUser } = res.data;
      localStorage.setItem('carepulse_access_token', access);
      localStorage.setItem('carepulse_refresh_token', refresh);
      localStorage.setItem('carepulse_user', JSON.stringify(loggedUser));
      setToken(access);
      setUser(loggedUser);
      return { success: true };
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password. Please try again.';
      return { success: false, error: message };
    }
  };

  const register = async (data: Record<string, unknown>) => {
    try {
      await api.post('/auth/register/', data);
      return { success: true };
    } catch (err: any) {
      const dataErrors = err.response?.data;
      let errorMsg = 'Registration failed. Please check the provided information.';
      if (dataErrors) {
        if (typeof dataErrors === 'string') {
          errorMsg = dataErrors;
        } else if (typeof dataErrors === 'object') {
          const firstKey = Object.keys(dataErrors)[0];
          const val = dataErrors[firstKey];
          errorMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('carepulse_access_token');
    localStorage.removeItem('carepulse_refresh_token');
    localStorage.removeItem('carepulse_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await api.patch('/patients/me/', data);
      setUser(res.data);
      localStorage.setItem('carepulse_user', JSON.stringify(res.data));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Failed to update profile.'
      };
    }
  };

  const isAdmin = user?.role === 'admin' || user?.is_staff === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshCurrentUser: fetchCurrentUser,
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

import { useState, useEffect, useCallback } from 'react';
import { apiClient, setAuthToken } from '../lib/apiClient';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(requiredRole?: string) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('medisync_token');
    const userStr = localStorage.getItem('medisync_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuthToken(token);
        setState({ user, token, isLoading: false, isAuthenticated: true });
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { accessToken, user } = res.data.data;
    setAuthToken(accessToken);
    localStorage.setItem('medisync_user', JSON.stringify(user));
    setState({ user, token: accessToken, isLoading: false, isAuthenticated: true });
    return user;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem('medisync_user');
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    window.location.href = '/login';
  }, []);

  const register = useCallback(async (data: { fullName: string; email: string; password: string; role: string; phoneNumber?: string }) => {
    const res = await apiClient.post('/auth/register', data);
    const { accessToken, user } = res.data.data;
    setAuthToken(accessToken);
    localStorage.setItem('medisync_user', JSON.stringify(user));
    setState({ user, token: accessToken, isLoading: false, isAuthenticated: true });
    return user;
  }, []);

  return { ...state, login, logout, register, requiredRole };
}

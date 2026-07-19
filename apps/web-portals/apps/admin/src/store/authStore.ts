import { create } from 'zustand';
import { setAuthToken } from '@medisync/ui';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';
  phoneNumber?: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    setAuthToken(token);
    localStorage.setItem('medisync_token', token);
    localStorage.setItem('medisync_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('medisync_token');
    localStorage.removeItem('medisync_user');
    set({ user: null, token: null });
  },
  initialize: () => {
    const token = localStorage.getItem('medisync_token');
    const userStr = localStorage.getItem('medisync_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuthToken(token);
        set({ user, token });
      } catch {
        localStorage.removeItem('medisync_token');
        localStorage.removeItem('medisync_user');
      }
    }
  }
}));

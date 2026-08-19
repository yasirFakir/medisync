import { create } from 'zustand';
import { setAuthToken } from '../../packages/ui/src/lib/apiClient';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN';
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  // Doctor profile fields
  designation?: string | null;
  specialty?: string | null;
  degrees?: string | null;
  clinicLocation?: string | null;
  area?: string | null;
  city?: string | null;
  experienceYears?: number | null;
  consultationFee?: number | null;
  bio?: string | null;
  // Pharmacy profile fields
  storeName?: string | null;
  licenseNumber?: string | null;
  streetAddress?: string | null;
  pharmacyCity?: string | null;
  isVerified?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

const getInitialAuthState = (): { token: string | null; user: User | null } => {
  const token = localStorage.getItem('medisync_token');
  const userStr = localStorage.getItem('medisync_user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      setAuthToken(token);
      return { token, user };
    } catch {
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
    }
  }
  return { token: null, user: null };
};

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
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
    const { token, user } = getInitialAuthState();
    if (token && user) {
      set({ user, token });
    }
  }
}));

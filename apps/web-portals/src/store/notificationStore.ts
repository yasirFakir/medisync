import { create } from 'zustand';

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REQUEST'
  | 'EHR_RECORD_ADDED'
  | 'MEDICATION_REMINDER'
  | 'LOW_STOCK_ALERT'
  | 'NEW_USER_REGISTERED'
  | 'NEW_PHARMACY_REGISTERED'
  | 'GENERAL';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => {
    const notif: AppNotification = { ...n, read: false };
    set((state) => ({
      notifications: [notif, ...state.notifications].slice(0, 50), // keep max 50
      unreadCount: state.unreadCount + 1,
    }));
  },
  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id)?.read ? 0 : 1)),
    }));
  },
  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

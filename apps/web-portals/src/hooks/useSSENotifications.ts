import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

const API_BASE = 'http://localhost:3001';

export const useSSENotifications = () => {
  const token = useAuthStore((s) => s.token);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    // EventSource doesn't support custom headers natively.
    // We pass the token as a query param - the backend authenticate middleware
    // should support ?token= fallback.
    const url = `${API_BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.id && data?.type && data?.title) {
          addNotification(data);
        }
      } catch {
        // ignore malformed frames
      }
    };

    es.onerror = () => {
      // SSE auto-reconnects on error; no action needed
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [token, addNotification]);
};

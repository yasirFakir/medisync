import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationStore, AppNotification } from '../store/notificationStore';

const typeIcon: Record<string, string> = {
  APPOINTMENT_CONFIRMED: '✅',
  APPOINTMENT_CANCELLED: '❌',
  APPOINTMENT_REQUEST: '📅',
  EHR_RECORD_ADDED: '📋',
  MEDICATION_REMINDER: '💊',
  LOW_STOCK_ALERT: '⚠️',
  NEW_USER_REGISTERED: '👤',
  NEW_PHARMACY_REGISTERED: '🏪',
  GENERAL: '🔔',
};

const typeColor: Record<string, string> = {
  APPOINTMENT_CONFIRMED: '#00685f',
  APPOINTMENT_CANCELLED: '#ba1a1a',
  APPOINTMENT_REQUEST: '#006492',
  EHR_RECORD_ADDED: '#0D9488',
  MEDICATION_REMINDER: '#825100',
  LOW_STOCK_ALERT: '#F59E0B',
  NEW_USER_REGISTERED: '#8b5cf6',
  NEW_PHARMACY_REGISTERED: '#8b5cf6',
  GENERAL: '#64748b',
};

const NotificationItem: React.FC<{ notif: AppNotification; onRead: (id: string) => void }> = ({ notif, onRead }) => (
  <div
    onClick={() => onRead(notif.id)}
    style={{
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      background: notif.read ? '#f9f9ff' : '#f0fdf4',
      cursor: 'pointer',
      transition: 'background 0.15s',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
    }}
  >
    <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1.4 }}>
      {typeIcon[notif.type] || '🔔'}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: notif.read ? 500 : 700, fontSize: '13px', color: typeColor[notif.type] || '#1e293b', marginBottom: '2px' }}>
        {notif.title}
      </div>
      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {notif.message}
      </div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
    {!notif.read && (
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00685f', flexShrink: 0, marginTop: '4px' }} />
    )}
  </div>
);

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '6px',
          borderRadius: '50%',
          color: '#3d4947',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        title="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#ba1a1a',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: '-8px',
          width: '360px',
          maxHeight: '480px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f9f9ff',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111c2d' }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#00685f' }}>({unreadCount})</span>}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00685f', padding: '4px' }}
                >
                  <CheckCheck size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Clear all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                <Bell size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notif={n} onRead={markRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

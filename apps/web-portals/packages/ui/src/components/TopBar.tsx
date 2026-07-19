import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Avatar } from './Avatar';

interface TopBarProps {
  title: string;
  subtitle?: string;
  user?: { fullName: string; role: string } | null;
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, user, actions, showSearch, onSearch }) => (
  <header style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 28px',
    borderBottom: '1px solid var(--border-default)',
    background: 'var(--bg-surface)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    gap: 16,
  }}>
    <div>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
      {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
      {showSearch && (
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search…"
            style={{ paddingLeft: 34, width: 220, height: 36 }}
            onChange={e => onSearch?.(e.target.value)}
          />
        </div>
      )}
      {actions}
      <button className="btn btn-ghost btn-sm" style={{ position: 'relative', padding: 8 }}>
        <Bell size={18} />
        <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--color-danger)', border: '1.5px solid var(--bg-surface)' }} />
      </button>
      {user && <Avatar name={user.fullName} size={34} />}
    </div>
  </header>
);

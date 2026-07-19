import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { Avatar } from './Avatar';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  user: { fullName: string; email: string; role: string } | null;
  onLogout: () => void;
  logo?: React.ReactNode;
  accentColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, user, onLogout, logo, accentColor = 'var(--color-brand-500)' }) => {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-default)' }}>
        {logo || (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${accentColor}, var(--color-accent-500))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>M</div>
            <span style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>MediSync<span style={{ color: accentColor }}> AI</span></span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? accentColor : 'var(--text-secondary)',
              background: isActive ? `${accentColor}15` : 'transparent',
              border: isActive ? `1px solid ${accentColor}25` : '1px solid transparent',
              transition: 'all 0.15s ease',
            })}
            onMouseEnter={e => { if (!(e.currentTarget as HTMLAnchorElement).classList.contains('active')) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { if (!(e.currentTarget as HTMLAnchorElement).classList.contains('active')) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <span style={{ flexShrink: 0, opacity: 0.85 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={user.fullName} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--color-danger)', padding: '8px 10px' }}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
};

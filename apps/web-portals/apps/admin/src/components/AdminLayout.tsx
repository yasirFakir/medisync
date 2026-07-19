import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, TopBar } from '@medisync/ui';
import { LayoutDashboard, Users, Pill, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { label: 'System Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'User Directory', path: '/users', icon: <Users size={18} /> },
    { label: 'Drug Catalogue', path: '/drugs', icon: <Pill size={18} /> },
    { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'System Overview', subtitle: 'Global server state and registration logs' };
      case '/users':
        return { title: 'User Management', subtitle: 'Edit and manage user accounts' };
      case '/drugs':
        return { title: 'Drug Catalogue', subtitle: 'Manage drug master listings' };
      case '/profile':
        return { title: 'Admin Details', subtitle: 'System administrator coordinates' };
      default:
        return { title: 'Admin Console', subtitle: 'MediSync Administrative Workspace' };
    }
  };

  const meta = getPageMeta();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar
        navItems={navItems}
        user={user}
        onLogout={logout}
        accentColor="#8b5cf6"
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          user={user}
        />
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, TopBar } from '@medisync/ui';
import { LayoutDashboard, Store, ClipboardEdit, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const PharmacyLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'My Inventory', path: '/inventory', icon: <Store size={18} /> },
    { label: 'Update Stock', path: '/update-stock', icon: <ClipboardEdit size={18} /> },
    { label: 'Store Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Pharmacy Overview', subtitle: 'Overview of stock statuses and logs' };
      case '/inventory':
        return { title: 'Inventory Management', subtitle: 'List and update active drug stocks' };
      case '/update-stock':
        return { title: 'Modify Stock Coordinates', subtitle: 'Select drugs and post pricing parameters' };
      case '/profile':
        return { title: 'Store Details', subtitle: 'Manage address and phone coordinates' };
      default:
        return { title: 'Pharmacy Hub', subtitle: 'MediSync Partner Portal' };
    }
  };

  const meta = getPageMeta();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar
        navItems={navItems}
        user={user}
        onLogout={logout}
        accentColor="#f59e0b"
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

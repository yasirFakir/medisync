import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, TopBar } from '../../packages/ui/src/index';
import {
  LayoutDashboard,
  MessageSquareText,
  FileText,
  MapPin,
  AlarmClock,
  User,
  Users,
  ShieldAlert,
  History,
  Store,
  ClipboardEdit,
  Pill
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const PortalLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'PATIENT':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'AI Triage', path: '/triage', icon: <MessageSquareText size={18} /> },
          { label: 'Prescriptions', path: '/prescriptions', icon: <FileText size={18} /> },
          { label: 'Find Pharmacy', path: '/locator', icon: <MapPin size={18} /> },
          { label: 'Medication Alerts', path: '/alerts', icon: <AlarmClock size={18} /> },
          { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
        ];
      case 'DOCTOR':
        return [
          { label: 'Clinical Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Patient Directory', path: '/patients', icon: <Users size={18} /> },
          { label: 'EHR Access Verification', path: '/ehr', icon: <ShieldAlert size={18} /> },
          { label: 'Session Logs', path: '/sessions', icon: <History size={18} /> },
          { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
        ];
      case 'PHARMACY':
        return [
          { label: 'Store Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'My Inventory', path: '/inventory', icon: <Store size={18} /> },
          { label: 'Update Stock', path: '/update-stock', icon: <ClipboardEdit size={18} /> },
          { label: 'Store Profile', path: '/profile', icon: <User size={18} /> },
        ];
      case 'ADMIN':
        return [
          { label: 'System Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'User Directory', path: '/users', icon: <Users size={18} /> },
          { label: 'Drug Catalogue', path: '/drugs', icon: <Pill size={18} /> },
          { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
        ];
      default:
        return [];
    }
  };

  const getAccentColor = () => {
    if (!user) return 'var(--color-brand-500)';
    switch (user.role) {
      case 'PATIENT': return '#0ea5e9';
      case 'DOCTOR': return '#059669';
      case 'PHARMACY': return '#f59e0b';
      case 'ADMIN': return '#8b5cf6';
      default: return 'var(--color-brand-500)';
    }
  };

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Overview Dashboard', subtitle: 'Overview metrics and parameters' };
      case '/triage':
        return { title: 'AI Triage Chatbot', subtitle: 'Describe symptoms to receive diagnostic recommendations' };
      case '/prescriptions':
        return { title: 'Prescriptions Scan Log', subtitle: 'Digitize and manage medical papers' };
      case '/locator':
        return { title: 'Medicine Locator', subtitle: 'Find local stores containing matching generic drugs' };
      case '/alerts':
        return { title: 'Medication Reminders', subtitle: 'Manage dosage alarms' };
      case '/patients':
        return { title: 'Patient Directory', subtitle: 'Clinical index parameters' };
      case '/ehr':
        return { title: 'EHR OTP Gate', subtitle: 'Verify patient access keys' };
      case '/sessions':
        return { title: 'Clinical History', subtitle: 'Session logs and completed observations' };
      case '/inventory':
        return { title: 'Inventory Catalogue', subtitle: 'Review active store listings' };
      case '/update-stock':
        return { title: 'Update Stock Status', subtitle: 'Modify drug availability and prices' };
      case '/users':
        return { title: 'System Directory', subtitle: 'Admin user coordinates database' };
      case '/drugs':
        return { title: 'Drug Database', subtitle: 'Admin drug catalogs' };
      case '/profile':
        return { title: 'My Coordinates', subtitle: 'Contact preferences and variables' };
      default:
        return { title: 'MediSync AI Hub', subtitle: 'Secure medical portal gateway' };
    }
  };

  const roleClass = user ? `role-${user.role.toLowerCase()}` : '';
  const meta = getPageMeta();

  return (
    <div className={roleClass} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar
        navItems={getNavItems()}
        user={user}
        onLogout={logout}
        accentColor={getAccentColor()}
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

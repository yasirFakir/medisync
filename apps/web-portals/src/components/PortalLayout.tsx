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
  Pill,
  GitCompare,
  Building,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import { ErrorBoundary } from './ErrorBoundary';

export const PortalLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'PATIENT':
        return [
          { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Medication Alerts', path: '/alerts', icon: <AlarmClock size={18} /> },
          { label: 'AI Triage', path: '/triage', icon: <MessageSquareText size={18} /> },
          { label: 'Book Appointment', path: '/appointments', icon: <CalendarDays size={18} /> },
          { label: 'Prescriptions', path: '/prescriptions', icon: <FileText size={18} /> },
          { label: 'Find Medicines', path: '/availability', icon: <CheckCircle2 size={18} /> },
          { label: 'Medicine Alternatives', path: '/alternatives', icon: <GitCompare size={18} /> },
          { label: 'Pharmacies', path: '/pharmacies', icon: <Building size={18} /> },
          { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
        ];
      case 'DOCTOR':
        return [
          { label: 'Clinical Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Patient Directory', path: '/patients', icon: <Users size={18} /> },
          { label: 'Patient Records', path: '/ehr', icon: <ShieldAlert size={18} /> },
          { label: 'Session Logs', path: '/sessions', icon: <History size={18} /> },
          { label: 'Appointments', path: '/doctor-appointments', icon: <CalendarDays size={18} /> },
          { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
        ];
      case 'PHARMACY':
        return [
          { label: 'Store Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'My Inventory', path: '/inventory', icon: <Store size={18} /> },
          { label: 'Add / Restock', path: '/update-stock', icon: <ClipboardEdit size={18} /> },
          { label: 'Sales Counter & POS', path: '/dispenser', icon: <Pill size={18} /> },
          { label: 'Sales & Accounting', path: '/sales', icon: <CalendarDays size={18} /> },
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
      case '/alternatives':
        return { title: 'Cheaper Medicine Alternatives', subtitle: 'Compare bioequivalent active ingredients and save on medication costs' };
      case '/pharmacies':
        return { title: 'Partner Pharmacy Directory', subtitle: 'Search and inspect verified healthcare partner locations' };
      case '/availability':
        return { title: 'Find Medicines', subtitle: 'Search prescription medicines, compare pharmacy stock availability, alternatives, and missing items' };
      case '/appointments':
        return { title: 'Book Doctor Appointment', subtitle: 'Find doctors, view availability and request appointments' };
      case '/doctor-appointments':
        return { title: 'Appointment Management', subtitle: 'Manage incoming requests and configure your schedule' };
      case '/alerts':
        return { title: 'Medication Reminders', subtitle: 'Manage dosage alarms' };
      case '/patients':
        return { title: 'Patient Directory', subtitle: 'Clinical index parameters' };
      case '/ehr':
        return { title: 'Patient Records', subtitle: 'View and manage clinical treatment logs and prescriptions' };

      case '/sessions':
        return { title: 'Clinical History', subtitle: 'Session logs and completed observations' };
      case '/inventory':
        return { title: 'Inventory Maintenance', subtitle: 'Manage SKUs, batch tracking, expiry dates, and cost prices' };
      case '/update-stock':
        return { title: 'Restock & Add Inventory', subtitle: 'Search master drug catalog and stage batch inventory entries' };
      case '/dispenser':
        return { title: 'POS Sales Register', subtitle: 'Instant Walk-In OTC sales counter, manual inventory search, and billing register' };
      case '/sales':
        return { title: 'Sales & Accounting Ledger', subtitle: 'Transaction logs, revenue metrics, gross profit, and receipt reprints' };
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
    <div className={roleClass} style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar
        navItems={getNavItems()}
        user={user}
        onLogout={logout}
        accentColor={getAccentColor()}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          user={user}
        />
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

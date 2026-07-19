import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, TopBar } from '@medisync/ui';
import { LayoutDashboard, MessageSquareText, FileText, MapPin, AlarmClock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const PatientLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'AI Triage', path: '/triage', icon: <MessageSquareText size={18} /> },
    { label: 'Prescriptions', path: '/prescriptions', icon: <FileText size={18} /> },
    { label: 'Find Pharmacy', path: '/locator', icon: <MapPin size={18} /> },
    { label: 'Medication Alerts', path: '/alerts', icon: <AlarmClock size={18} /> },
    { label: 'My Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Dashboard', subtitle: 'Overview of your health metrics and actions' };
      case '/triage':
        return { title: 'AI Triage Chatbot', subtitle: 'Describe your symptoms to receive instant health assessments' };
      case '/prescriptions':
        return { title: 'Prescriptions', subtitle: 'Digitize, locate, and explore generic drug substitutes' };
      case '/locator':
        return { title: 'Medicine Locator', subtitle: 'Find verified local pharmacies stocking your prescriptions' };
      case '/alerts':
        return { title: 'Medication Reminders', subtitle: 'Schedule daily alerts for drug dosages' };
      case '/profile':
        return { title: 'Personal Profile', subtitle: 'Manage your contact information and preferences' };
      default:
        return { title: 'MediSync AI', subtitle: 'Your smart health portal' };
    }
  };

  const meta = getPageMeta();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar
        navItems={navItems}
        user={user}
        onLogout={logout}
        accentColor="var(--color-brand-500)"
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

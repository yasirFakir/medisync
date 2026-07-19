import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TriagePage } from './pages/TriagePage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { LocatorPage } from './pages/LocatorPage';
import { AlertsPage } from './pages/AlertsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PatientLayout } from './components/PatientLayout';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Patient Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PatientLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/locator" element={<LocatorPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

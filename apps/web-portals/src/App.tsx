import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TriagePage } from './pages/TriagePage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { LocatorPage } from './pages/LocatorPage';
import { AlertsPage } from './pages/AlertsPage';
import { PatientsPage } from './pages/PatientsPage';
import { EHRAccessPage } from './pages/EHRAccessPage';
import { EHRViewerPage } from './pages/EHRViewerPage';
import { SessionsPage } from './pages/SessionsPage';
import { InventoryPage } from './pages/InventoryPage';
import { UpdateStockPage } from './pages/UpdateStockPage';
import { UsersPage } from './pages/UsersPage';
import { DrugsPage } from './pages/DrugsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/PortalLayout';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Patient routes */}
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/locator" element={<LocatorPage />} />
            <Route path="/alerts" element={<AlertsPage />} />

            {/* Doctor routes */}
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/ehr" element={<EHRAccessPage />} />
            <Route path="/ehr/:patientId" element={<EHRViewerPage />} />
            <Route path="/sessions" element={<SessionsPage />} />

            {/* Pharmacy routes */}
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/update-stock" element={<UpdateStockPage />} />

            {/* Admin routes */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/drugs" element={<DrugsPage />} />

            {/* Shared Profile route */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

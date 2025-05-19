import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import PointsStore from './pages/PointsStore';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWhitelist from './pages/admin/AdminWhitelist';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStats from './pages/admin/AdminStats';
import ProtectedRoute from './components/admin/ProtectedRoute';
import LoginPage from './pages/admin/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="store" element={<PointsStore />} />
      </Route>
      
      <Route path="/boss/*" element={<AdminLayout />}>
        <Route index element={<LoginPage />} />
        <Route path="dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="whitelist" element={
          <ProtectedRoute>
            <AdminWhitelist />
          </ProtectedRoute>
        } />
        <Route path="stats" element={
          <ProtectedRoute>
            <AdminStats />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/boss" replace />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
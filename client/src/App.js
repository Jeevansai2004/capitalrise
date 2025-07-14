import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const ReferralLanding = lazy(() => import('./pages/ReferralLanding'));
const Credentials = lazy(() => import('./pages/Credentials'));
const WithdrawalSetup = lazy(() => import('./pages/WithdrawalSetup'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/credentials" element={<ProtectedRoute role="admin"><Credentials /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
        <Route path="/withdrawal-setup" element={<ProtectedRoute role="client"><WithdrawalSetup /></ProtectedRoute>} />
        <Route path="/referral/:code" element={<ReferralLanding />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
} 
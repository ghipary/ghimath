import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Kalau masih loading (ngecek status login), tampilkan layar tunggu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-xl font-semibold text-gray-500">Memuat...</div>
      </div>
    );
  }

  // Kalau user belum login, tendang ke halaman Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kalau user sudah login, izinkan masuk ke halaman yang dituju
  return children;
};

export default ProtectedRoute;
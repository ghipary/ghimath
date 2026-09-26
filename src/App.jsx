import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import MaterialList from './pages/MaterialList'
import MaterialDetail from './pages/MaterialDetail'
import Quiz from './pages/Quiz'
import Leaderboard from './pages/Leaderboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMaterialList from './pages/admin/AdminMaterialList'
import AdminMaterialForm from './pages/admin/AdminMaterialForm'
import AdminQuizBuilder from './pages/admin/AdminQuizBuilder'
import AdminQuizImport from './pages/admin/AdminQuizImport'
import AdminUsers from './pages/admin/AdminUsers'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import { Toaster } from 'react-hot-toast'

const Home = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  
  return user ? <Dashboard /> : <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/materi" element={<MaterialList />} />
          <Route path="/materi/:id" element={<ProtectedRoute><MaterialDetail /></ProtectedRoute>} />
          <Route path="/materi/:id/kuis" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/materi" element={<AdminRoute><AdminMaterialList /></AdminRoute>} />
          <Route path="/admin/materi/baru" element={<AdminRoute><AdminMaterialForm /></AdminRoute>} />
          <Route path="/admin/materi/:id/edit" element={<AdminRoute><AdminMaterialForm /></AdminRoute>} />
          <Route path="/admin/materi/:id/soal" element={<AdminRoute><AdminQuizBuilder /></AdminRoute>} />
          <Route path="/admin/materi/:id/import" element={<AdminRoute><AdminQuizImport /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
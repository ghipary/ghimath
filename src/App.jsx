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
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMaterialList from './pages/admin/AdminMaterialList'
import AdminMaterialForm from './pages/admin/AdminMaterialForm'
import AdminQuizBuilder from './pages/admin/AdminQuizBuilder'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword';


// Komponen Home: Cek status login
const Home = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  
  // Kalau sudah login, tampilkan Dashboard. Kalau belum, Landing Page.
  return user ? <Dashboard /> : <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rute Publik / Home Pintar */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Rute Privat (Wajib Login) */}
          <Route 
            path="/onboarding" 
            element={<ProtectedRoute><Onboarding /></ProtectedRoute>} 
          />
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route path="/materi" element={<MaterialList />} />

          <Route 
            path="/materi/:id" 
            element={<ProtectedRoute><MaterialDetail /></ProtectedRoute>} 
          />
          <Route 
            path="/materi/:id/kuis" 
            element={<ProtectedRoute><Quiz /></ProtectedRoute>} 
          />

          {/* Rute Admin (Wajib Login + Role Admin) */}
          <Route 
            path="/admin" 
            element={<AdminRoute><AdminDashboard /></AdminRoute>} 
          />
          <Route 
            path="/admin/materi" 
            element={<AdminRoute><AdminMaterialList /></AdminRoute>} 
          />
          <Route 
            path="/admin/materi/baru" 
            element={<AdminRoute><AdminMaterialForm /></AdminRoute>} 
          />
          <Route 
            path="/admin/materi/:id/edit" 
            element={<AdminRoute><AdminMaterialForm /></AdminRoute>} 
          />
          <Route 
            path="/admin/materi/:id/soal" 
            element={<AdminRoute><AdminQuizBuilder /></AdminRoute>} 
          />
          <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
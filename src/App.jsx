import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

// Komponen yang langsung di-load (karena dibutuhkan di awal)
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import PWAInstallBanner from './components/PWAInstallBanner'

// ==========================================
// LAZY LOADING: Halaman di-load hanya saat dibutuhkan
// ==========================================
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MaterialList = lazy(() => import('./pages/MaterialList'))
const MaterialDetail = lazy(() => import('./pages/MaterialDetail'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Certificate = lazy(() => import('./pages/Certificate'))
const DailyChallenge = lazy(() => import('./pages/DailyChallenge')) // ⚡ BARU

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminMaterialList = lazy(() => import('./pages/admin/AdminMaterialList'))
const AdminMaterialForm = lazy(() => import('./pages/admin/AdminMaterialForm'))
const AdminQuizBuilder = lazy(() => import('./pages/admin/AdminQuizBuilder'))
const AdminQuizImport = lazy(() => import('./pages/admin/AdminQuizImport'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))

// ==========================================
// LOADING FALLBACK (Tampilan pas pindah halaman)
// ==========================================
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
      </div>
    </div>
    <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
      Memuat halaman...
    </p>
  </div>
);

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

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/kuis-harian" element={<ProtectedRoute><DailyChallenge /></ProtectedRoute>} />
            <Route path="/materi" element={<MaterialList />} />
            <Route path="/materi/:id" element={<ProtectedRoute><MaterialDetail /></ProtectedRoute>} />
            <Route path="/materi/:id/kuis" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/sertifikat" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/materi" element={<AdminRoute><AdminMaterialList /></AdminRoute>} />
            <Route path="/admin/materi/baru" element={<AdminRoute><AdminMaterialForm /></AdminRoute>} />
            <Route path="/admin/materi/:id/edit" element={<AdminRoute><AdminMaterialForm /></AdminRoute>} />
            <Route path="/admin/materi/:id/soal" element={<AdminRoute><AdminQuizBuilder /></AdminRoute>} />
            <Route path="/admin/materi/:id/import" element={<AdminRoute><AdminQuizImport /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          </Routes>
        </Suspense>

        <PWAInstallBanner />
        
      </Router>
    </AuthProvider>
  )
}

export default App
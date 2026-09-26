import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calculator, Mail, Lock, AlertCircle, Globe, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard'); 
    } catch (err) {
      setError('Gagal masuk: Email atau password salah.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Gagal masuk dengan Google: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-bg transition-colors min-h-screen flex items-center justify-center px-4 py-8">
      <div className="grid-pattern"></div>
      
      <div className="page-content w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-teal-700 dark:text-teal-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Selamat datang kembali
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-cyan-500/5 rounded-full blur-2xl"></div>
          
          <div className="relative">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex w-16 h-16 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-2xl items-center justify-center shadow-lg shadow-teal-500/30 mb-4">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                Masuk GhiMath
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Lanjutkan belajarmu di sini</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <Link to="/reset-password" className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">Lupa password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    placeholder="Password kamu"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/30 hover:shadow-xl"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
              <span className="px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">atau</span>
              <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
            </div>

            {/* Google */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-slate-700 text-gray-700 dark:text-white font-semibold py-3 rounded-xl transition-all"
            >
              <Globe className="w-5 h-5 text-teal-600" />
              Masuk dengan Google
            </button>

            {/* Link Register */}
            <p className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm">
              Belum punya akun? <Link to="/register" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">Daftar di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
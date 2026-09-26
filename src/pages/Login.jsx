import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calculator, Mail, Lock, AlertCircle, Globe } from 'lucide-react';

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
      // Setelah berhasil login, arahkan ke dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border dark:border-slate-800">
        
        {/* Logo & Judul */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Calculator className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Masuk GhiMath</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Lanjutkan belajarmu di sini</p>
        </div>

        {/* Pesan Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="email@contoh.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link to="/reset-password" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Lupa password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="Password kamu"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300 dark:border-slate-700"></div>
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400">atau</span>
          <div className="flex-1 border-t border-gray-300 dark:border-slate-700"></div>
        </div>

        {/* Google Login */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-teal-600 text-gray-700 dark:text-white font-semibold py-3 rounded-xl transition-all"
        >
          <Globe className="w-5 h-5" />
          Masuk dengan Google
        </button>

        {/* Link ke Register */}
        <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
          Belum punya akun? <Link to="/register" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">Daftar di sini</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
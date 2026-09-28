import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Mail, Lock, User, AlertCircle, Sparkles, Eye, EyeOff, Check } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '', bg: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'text-red-600 dark:text-red-400', bg: 'from-red-400 to-red-500' };
    if (score === 2) return { score: 2, label: 'Cukup', color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-400 to-orange-500' };
    if (score === 3) return { score: 3, label: 'Sedang', color: 'text-yellow-600 dark:text-yellow-400', bg: 'from-yellow-400 to-yellow-500' };
    if (score === 4) return { score: 4, label: 'Kuat', color: 'text-teal-600 dark:text-teal-400', bg: 'from-teal-400 to-cyan-500' };
    return { score: 5, label: 'Sangat Kuat', color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-400 to-teal-500' };
  };

  const strength = getPasswordStrength(password);
  const passwordMatch = confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Password dan Konfirmasi Password tidak sama!');
    }
    if (password.length < 6) {
      return setError('Password minimal 6 karakter!');
    }

    try {
      setLoading(true);
      await register(name, email, password);
      navigate('/onboarding'); 
    } catch (err) {
      setError('Gagal mendaftar: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-bg transition-colors min-h-screen flex items-center justify-center px-4 py-8">
      <div className="grid-pattern"></div>
      
      <div className="page-content w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-violet-200/60 dark:border-violet-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Gratis, tanpa biaya!
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/10 to-pink-500/5 rounded-full blur-2xl"></div>
          
          <div className="relative">
            {/* ⚡ LOGO GHIMATH */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Logo size={56} />
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  GhiMath
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Buat Akun Baru
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Mulai perjalanan belajarmu sekarang</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                    placeholder="Nama kamu"
                  />
                </div>
              </div>

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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors rounded-lg"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score
                              ? `bg-gradient-to-r ${strength.bg}`
                              : 'bg-gray-200 dark:bg-slate-700'
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strength.color}`}>
                      Kekuatan password: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${
                      confirmPassword
                        ? passwordMatch
                          ? 'border-teal-500 focus:ring-teal-500 focus:border-teal-500'
                          : 'border-red-400 focus:ring-red-400 focus:border-red-400'
                        : 'border-gray-200 dark:border-slate-700 focus:ring-violet-500 focus:border-violet-500'
                    }`}
                    placeholder="Ulangi password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors rounded-lg"
                    title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
                    passwordMatch ? 'text-teal-600 dark:text-teal-400' : 'text-red-500'
                  }`}>
                    {passwordMatch ? (
                      <><Check className="w-3.5 h-3.5" /> Password cocok!</>
                    ) : (
                      <><AlertCircle className="w-3.5 h-3.5" /> Password tidak cocok</>
                    )}
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-500 via-purple-600 to-pink-500 hover:from-violet-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl"
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm">
              Sudah punya akun? <Link to="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Masuk di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
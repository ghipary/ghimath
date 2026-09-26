import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Calculator, Mail, AlertCircle, CheckCircle, ArrowLeft, Loader, Sparkles } from 'lucide-react';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Email ini belum terdaftar di GhiMath.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else {
        setError('Gagal mengirim email reset: ' + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="page-bg transition-colors min-h-screen flex items-center justify-center px-4 py-8">
      <div className="grid-pattern"></div>
      
      <div className="page-content w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Reset password
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-500/5 rounded-full blur-2xl"></div>
          
          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                Lupa Password?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Masukkan email yang terdaftar. Kami akan kirim link reset password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-xl">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-semibold mb-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Email Terkirim! ✅</span>
                </div>
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  Cek inbox <strong>{email}</strong> (dan folder Spam). Klik link reset untuk membuat password baru. Link berlaku 1 jam.
                </p>
              </div>
            )}

            {!success && (
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl"
                >
                  {loading ? (
                    <><Loader className="w-5 h-5 animate-spin" /> Mengirim...</>
                  ) : (
                    'Kirim Link Reset'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
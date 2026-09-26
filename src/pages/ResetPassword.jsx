import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Calculator, Mail, AlertCircle, CheckCircle, ArrowLeft, Loader } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border dark:border-slate-800">
        
        {/* Logo & Judul */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Calculator className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Lupa Password?</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Masukkan email yang terdaftar. Kami akan kirim link reset password ke email kamu.
          </p>
        </div>

        {/* Pesan Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pesan Sukses */}
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

        {/* Form */}
        {!success && (
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" /> Mengirim...
                </>
              ) : (
                'Kirim Link Reset'
              )}
            </button>
          </form>
        )}

        {/* Link Kembali */}
        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Masuk
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
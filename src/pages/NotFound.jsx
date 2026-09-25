import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-teal-600 dark:text-teal-400">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Sepertinya kamu tersesat. Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            <Home className="w-5 h-5" /> Kembali ke Beranda
          </Link>
          <Link to="/materi" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white px-6 py-3 rounded-xl font-semibold hover:border-teal-600 transition-colors">
            <Search className="w-5 h-5" /> Cari Materi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
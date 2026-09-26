import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Compass } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="page-bg transition-colors min-h-screen flex items-center justify-center px-4">
      <div className="grid-pattern"></div>
      
      <div className="page-content text-center max-w-lg">
        <div className="inline-flex w-24 h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-3xl items-center justify-center shadow-xl shadow-orange-500/30 mb-6 animate-float-custom">
          <Compass className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-7xl sm:text-9xl font-extrabold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Sepertinya kamu tersesat. Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-teal-500/30 hover:-translate-y-0.5">
            <Home className="w-5 h-5" /> Kembali ke Beranda
          </Link>
          <Link to="/materi" className="flex items-center justify-center gap-2 card-elevated px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-white hover:-translate-y-0.5 transition-all">
            <Search className="w-5 h-5" /> Cari Materi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
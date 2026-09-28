import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Home, Search, ChevronLeft, Sparkles, Calculator, Compass, Ghost, Lightbulb } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="page-bg transition-colors min-h-screen flex flex-col">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl">
          
          {/* Floating Ornaments */}
          <div className="absolute top-20 left-10 w-40 h-40 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-float-custom"></div>
          <div className="absolute bottom-20 right-10 w-52 h-52 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl animate-float-reverse"></div>

          {/* Main Card */}
          <div className="card-elevated rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            
            {/* Big 404 with gradient */}
            <div className="relative mb-6">
              <div className="text-[120px] sm:text-[160px] font-extrabold leading-none select-none">
                <span className="bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  4
                </span>
                <span className="inline-block mx-2 relative">
                  <span className="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                    0
                  </span>
                  {/* ⚡ Ghost icon di tengah 0 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Ghost className="w-12 h-12 sm:w-16 sm:h-16 text-white/90 dark:text-slate-900/90 drop-shadow-lg animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                </span>
                <span className="bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  4
                </span>
              </div>
              
              {/* Sparkles */}
              <Sparkles className="absolute top-4 left-8 sm:left-16 w-5 h-5 text-amber-400 animate-pulse" />
              <Sparkles className="absolute bottom-8 right-10 sm:right-20 w-4 h-4 text-teal-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Calculator className="absolute top-12 right-6 sm:right-16 w-6 h-6 text-violet-400 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Judul */}
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-3">
              Waduh, Tersesat! 🧭
            </h1>

            {/* Deskripsi Lucu */}
            <p className="text-gray-600 dark:text-gray-300 mb-2 max-w-md mx-auto leading-relaxed">
              Sepertinya halaman yang kamu cari <strong>sudah kabur</strong> atau mungkin <strong>tidak pernah ada</strong>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto italic">
              "Halaman tidak ditemukan, tapi semangat belajarmu jangan hilang ya!" 💪
            </p>

            {/* Fun Fact Box */}
            <div className="inline-flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 mb-8 max-w-md mx-auto text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">Fun fact!</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                  Angka 0 (nol) bukan bilangan positif maupun negatif. Sama seperti halaman ini — tidak ada! 😄
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-teal-500 text-gray-700 dark:text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Kembali
              </button>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 transition-all"
              >
                <Home className="w-5 h-5" />
                Ke Beranda
              </Link>
              <Link
                to="/materi"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 transition-all"
              >
                <Compass className="w-5 h-5" />
                Cari Materi
              </Link>
            </div>

            {/* Suggest */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
              Butuh bantuan? Kunjungi{' '}
              <Link to="/faq" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                halaman FAQ
              </Link>
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
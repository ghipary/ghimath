import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BookOpen, Trophy, Video, ChevronRight, Sparkles } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Hiasan background lingkaran */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-teal-100 dark:bg-teal-900/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl -z-10"></div>

        <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Media Pembelajaran Interaktif
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          Belajar Matematika <br />
          <span className="text-teal-600 dark:text-teal-400">Jadi Lebih Mudah</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10">
          Materi interaktif, kuis seru, dan pembahasan lengkap untuk siswa SMP & SMA. 
          Belajar mandiri kapan saja, di mana saja.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/register" className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            Mulai Belajar <ChevronRight className="w-5 h-5" />
          </a>
          <a href="#" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-white border-2 border-gray-200 dark:border-slate-700 hover:border-teal-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all">
            Lihat Materi
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-slate-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Kenapa GhiMath?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-12">
            Kami percaya matematika itu menyenangkan. Berikut alasan kenapa kamu harus belajar di sini.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Fitur 1 */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-teal-200 dark:hover:border-teal-800">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Materi Lengkap</h3>
              <p className="text-gray-600 dark:text-gray-400">Tersedia materi dari kelas 7 SMP hingga kelas 12 SMA, lengkap dengan file PDF dan video.</p>
            </div>

            {/* Fitur 2 */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-amber-200 dark:hover:border-amber-800">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kuis Interaktif</h3>
              <p className="text-gray-600 dark:text-gray-400">Uji pemahamanmu dengan kuis pilihan ganda. Dapatkan skor dan pembahasan langsung.</p>
            </div>

            {/* Fitur 3 */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-teal-200 dark:hover:border-teal-800">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-6">
                <Video className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Video Pembelajaran</h3>
              <p className="text-gray-600 dark:text-gray-400">Belajar lebih mudah dengan video penjelasan yang menarik dan mudah dipahami.</p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BookOpen, Trophy, Video, ChevronRight, Sparkles, Users, FileText, Star } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative flex-1 flex flex-col justify-center items-center text-center px-4 py-20 md:py-32 overflow-hidden">
        
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-200 dark:bg-teal-900/30 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-40 -z-10"></div>

        <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4" />
          Media Pembelajaran Interaktif #1
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-6 max-w-4xl">
          Belajar Matematika{' '}
          <span className="bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            Jadi Lebih Mudah
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10 leading-relaxed">
          Materi interaktif, kuis seru, dan pembahasan lengkap untuk siswa 
          <span className="font-semibold text-teal-600 dark:text-teal-400"> SMP & SMA</span>. 
          Belajar mandiri kapan saja, di mana saja.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <a 
            href="/register" 
            className="group flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg shadow-teal-600/30 hover:shadow-xl hover:shadow-teal-600/40 hover:-translate-y-0.5"
          >
            Mulai Belajar Gratis
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a 
            href="/materi" 
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-gray-800 dark:text-white border-2 border-gray-200 dark:border-slate-700 hover:border-teal-600 px-8 py-4 rounded-2xl text-lg font-semibold transition-all"
          >
            Lihat Materi
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-teal-600" />
              <span className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">10+</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Materi Lengkap</p>
          </div>
          <div className="text-center border-x border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">100+</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Soal Kuis</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5 text-teal-600" />
              <span className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">2</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Jenjang (SMP/SMA)</p>
          </div>
        </div>
      </section>

      {/* ===== FITUR SECTION ===== */}
      <section className="bg-gray-50 dark:bg-slate-900 py-20 px-4 border-t dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-14">
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Fitur Unggulan</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
              Kenapa Harus GhiMath?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Kami percaya matematika itu menyenangkan. Berikut alasan kenapa kamu harus belajar di sini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="group bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Materi Lengkap</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Tersedia materi dari kelas 7 SMP hingga kelas 12 SMA, lengkap dengan file PDF dan video pembelajaran.
              </p>
            </div>

            <div className="group bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kuis Interaktif</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Uji pemahamanmu dengan kuis pilihan ganda. Dapatkan skor dan pembahasan langsung.
              </p>
            </div>

            <div className="group bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Video Pembelajaran</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Belajar lebih mudah dengan video penjelasan yang menarik dan mudah dipahami.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-teal-600/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -z-0"></div>
            
            <div className="relative z-10">
              <Star className="w-12 h-12 text-amber-300 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Siap Mulai Belajar?
              </h2>
              <p className="text-teal-100 text-lg mb-8 max-w-xl mx-auto">
                Daftar gratis sekarang dan rasakan bedanya belajar matematika dengan GhiMath.
              </p>
              <a 
                href="/register" 
                className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-2xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Daftar Sekarang — Gratis!
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BookOpen, Trophy, Video, ChevronRight, Sparkles, Users, FileText, Star, Zap, Target, TrendingUp, GraduationCap } from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const [userCount, setUserCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);

  // ⚡ Fetch stats dari Firestore (users, materials, quizQuestions)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, materialsSnap, quizSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'materials')),
          getDocs(collection(db, 'quizQuestions')),
        ]);

        // Hitung user non-admin saja
        const realUsers = usersSnap.docs.filter(
          (d) => d.data().role !== 'admin'
        );
        setUserCount(realUsers.length);

        // Hitung materi yang published
        const publishedMaterials = materialsSnap.docs.filter(
          (d) => d.data().published === true
        );
        setMaterialCount(publishedMaterials.length);

        // Hitung soal kuis
        setQuizCount(quizSnap.size);
      } catch (error) {
        console.error('Gagal ambil stats:', error);
      }
    };
    fetchStats();
  }, []);

  // ⚡ Format angka biar keren (10+, 50+, 100+)
  const formatCount = (num) => {
    if (num === 0) return '—';
    if (num < 10) return `${num}`;
    if (num < 50) return `${num}+`;
    if (num < 100) return `${Math.floor(num / 10) * 10}+`;
    if (num < 1000) return `${Math.floor(num / 50) * 50}+`;
    return `${Math.floor(num / 100) * 100}+`;
  };

  return (
    <div className="page-bg transition-colors duration-300 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      {/* HERO SECTION */}
      <section className="page-content relative flex flex-col justify-center items-center text-center px-4 py-20 md:py-28 overflow-hidden">
        
        {/* Ornamen Background */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl -z-10 animate-float-custom"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl -z-10 animate-float-reverse"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4" />
          Media Pembelajaran Interaktif #1
        </div>

        {/* Judul */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-6 max-w-4xl">
          Belajar Matematika
          <br />
          <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            Jadi Lebih Mudah
          </span>
        </h1>

        {/* Subjudul */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10 leading-relaxed">
          Materi interaktif, kuis seru, dan pembahasan lengkap untuk siswa{' '}
          <span className="font-semibold text-teal-600 dark:text-teal-400">SMP & SMA</span>.{' '}
          Belajar mandiri kapan saja, di mana saja.
        </p>

        {/* Tombol CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link 
            to={user ? "/dashboard" : "/register"}
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-teal-500/30 hover:-translate-y-1"
          >
            {user ? 'Lanjut Belajar' : 'Mulai Belajar Gratis'}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/materi" 
            className="flex items-center justify-center gap-2 card-elevated text-gray-800 dark:text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:-translate-y-1"
          >
            Lihat Materi
          </Link>
        </div>

        {/* Stats — 4 KOLOM */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl w-full">
          
          {/* Materi */}
          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatCount(materialCount)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Materi Lengkap</p>
          </div>

          {/* Soal Kuis */}
          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatCount(quizCount)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Soal Kuis</p>
          </div>

          {/* Jenjang */}
          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-3 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">2</div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Jenjang (SMP/SMA)</p>
          </div>

          {/* ⚡ SISWA (BARU) */}
          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatCount(userCount)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Siswa Terdaftar</p>
          </div>
        </div>

        {/* Subtle text di bawah stats */}
        {userCount > 0 && (
          <p className="mt-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-medium">
              {userCount} siswa sudah bergabung dari seluruh Indonesia
            </span>
          </p>
        )}
      </section>

      {/* FITUR SECTION */}
      <section className="page-content py-20 px-4">
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
            
            {/* Fitur 1 */}
            <div className="group card-elevated p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Materi Lengkap
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Tersedia materi dari kelas 7 SMP hingga kelas 12 SMA, lengkap dengan bacaan interaktif dan video pembelajaran.
              </p>
            </div>

            {/* Fitur 2 */}
            <div className="group card-elevated p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Kuis Interaktif
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Uji pemahamanmu dengan kuis pilihan ganda. Dapatkan skor, pembahasan, dan bersaing di leaderboard!
              </p>
            </div>

            {/* Fitur 3 */}
            <div className="group card-elevated p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Progress & Grafik
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Pantau perkembangan belajarmu dengan grafik interaktif. Lihat tren skor dan kemampuan per topik.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="page-content py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-teal-500/30">
            
            {/* Ornamen */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-custom"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-float-reverse"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-4">
                <Zap className="w-3.5 h-3.5" />
                GRATIS SELAMANYA
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Siap Mulai Belajar?
              </h2>
              <p className="text-cyan-50 text-lg mb-8 max-w-xl mx-auto">
                {userCount > 0 
                  ? `Bergabung dengan ${userCount}+ siswa lainnya dan rasakan bedanya belajar matematika dengan GhiMath.`
                  : 'Daftar gratis sekarang dan rasakan bedanya belajar matematika dengan GhiMath.'
                }
              </p>
              <Link 
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-2xl hover:bg-teal-50 transition-all shadow-xl hover:-translate-y-0.5 hover:scale-105"
              >
                {user ? 'Lanjut Belajar' : 'Daftar Sekarang — Gratis!'}
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
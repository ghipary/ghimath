import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  BookOpen, Trophy, ChevronRight, Sparkles, Users, FileText, 
  GraduationCap, TrendingUp, Sparkle, Award, Target, CheckCircle,
  BarChart3, Calculator, Medal, Compass, Lightbulb, Rocket,
  ArrowRight, Play, Zap, HelpCircle, Lock
} from 'lucide-react';

/* ═══════════════════════════════════════════════════ */
/* ⚡ HELPER: ANIMASI SCROLL                          */
/* ═══════════════════════════════════════════════════ */
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

const Reveal = ({ children, delay = 0, direction = 'up' }) => {
  const [ref, isVisible] = useScrollReveal();
  
  const directionClasses = {
    up: isVisible ? 'translate-y-0' : 'translate-y-12',
    down: isVisible ? 'translate-y-0' : '-translate-y-12',
    left: isVisible ? 'translate-x-0' : '-translate-x-12',
    right: isVisible ? 'translate-x-0' : 'translate-x-12',
    scale: isVisible ? 'scale-100' : 'scale-90',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${directionClasses[direction]}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════ */
/* LANDING PAGE                                       */
/* ═══════════════════════════════════════════════════ */
const LandingPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    materials: 0,
    quizzes: 0,
    formulas: 0,
    users: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, materialsSnap, quizSnap, formulasSnap] = await Promise.all([
          getDocs(collection(db, 'users')).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'materials')).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'quizQuestions')).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'formulas')).catch(() => ({ docs: [] })),
        ]);

        const realUsers = usersSnap.docs.filter((d) => d.data().role !== 'admin');
        const publishedMaterials = materialsSnap.docs.filter(
          (d) => d.data().published === true
        );

        setStats({
          materials: publishedMaterials.length,
          quizzes: quizSnap.size,
          formulas: formulasSnap.size,
          users: realUsers.length,
          loading: false,
        });
      } catch (error) {
        console.error('Gagal fetch stats:', error);
        setStats((s) => ({ ...s, loading: false }));
      }
    };
    fetchStats();
  }, []);

  const fmt = (num) => {
    if (num === 0) return '0';
    if (num < 10) return `${num}`;
    if (num < 100) return `${num}+`;
    if (num < 1000) return `${Math.floor(num / 50) * 50}+`;
    return `${Math.floor(num / 100) * 100}+`;
  };

  return (
    <div className="page-bg transition-colors duration-300 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 1: HERO                             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content relative flex flex-col justify-center items-center text-center px-4 py-20 md:py-28 overflow-hidden">
        
        <div className="absolute top-10 left-10 w-64 h-64 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl -z-10 animate-float-custom"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl -z-10 animate-float-reverse"></div>

        {/* ⚡ Badge: Hapus klaim #1 */}
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="w-4 h-4" />
          Media Pembelajaran Matematika Interaktif
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-6 max-w-4xl">
          Belajar Matematika
          <br />
          <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            Jadi Lebih Mudah
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10 leading-relaxed">
          Materi interaktif, kuis seru, dan pembahasan lengkap untuk siswa{' '}
          <span className="font-semibold text-teal-600 dark:text-teal-400">SMP & SMA</span>.{' '}
          Belajar mandiri kapan saja, di mana saja.
        </p>

        {/* ⚡ CTA: Teks lebih jelas */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Link 
            to={user ? "/dashboard" : "/register"}
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-teal-500/30 hover:-translate-y-1"
          >
            {user ? 'Lanjut Belajar' : 'Daftar Gratis'}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/materi" 
            className="flex items-center justify-center gap-2 card-elevated text-gray-800 dark:text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:-translate-y-1"
          >
            <Play className="w-5 h-5" />
            Jelajahi Tanpa Login
          </Link>
        </div>

        {/* ⚡ Keterangan kecil */}
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-12 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
          Lihat daftar materi & bank rumus gratis tanpa perlu daftar
        </p>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl w-full">
          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.loading ? '—' : fmt(stats.materials)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Materi Lengkap</p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.loading ? '—' : fmt(stats.quizzes)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Soal Kuis</p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.loading ? '—' : fmt(stats.formulas)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Bank Rumus</p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
              {stats.loading ? '—' : fmt(stats.users)}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Siswa Terdaftar</p>
          </div>
        </div>

        {stats.users > 0 && (
          <p className="mt-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-medium">
              {stats.users} siswa sudah bergabung
            </span>
          </p>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 2: FITUR UNGGULAN                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content py-20 px-4">
        <div className="max-w-7xl mx-auto">
          
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Fitur Unggulan
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
                Kenapa Harus GhiMath?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Semua yang kamu butuhkan untuk jago matematika — dalam satu platform!
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Reveal delay={0}>
              <div className="group card-elevated p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-teal-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Materi Lengkap
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Materi interaktif dari kelas 7 SMP hingga kelas 12 SMA. Lengkap dengan bacaan, video, dan contoh soal.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="group card-elevated p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Kuis Interaktif
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Uji pemahamanmu dengan kuis pilihan ganda. Dapatkan skor langsung dan lihat pembahasan tiap soal.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="group card-elevated p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Progress Tracking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Pantau perkembangan belajarmu dengan grafik interaktif. Lihat tren skor dan kemampuan per topik.
                </p>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="group card-elevated p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-pink-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                  Bank Rumus
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Kumpulan rumus matematika siap pakai dengan tampilan cantik. Tinggal copy, print, atau screenshot!
                </p>
              </div>
            </Reveal>

            {/* ⚡ Fitur Leaderboard: Tambah info login */}
            <Reveal delay={400}>
              <div className="group card-elevated p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full relative">
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" /> Perlu Login
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Medal className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Leaderboard
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Bersaing dengan siswa se-Indonesia dan raih posisi teratas. Login dulu untuk ikut berkompetisi!
                </p>
              </div>
            </Reveal>

            {/* ⚡ Fitur Sertifikat: Tambah syarat */}
            <Reveal delay={500}>
              <div className="group card-elevated p-7 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl h-full relative">
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" /> Perlu Login
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Sertifikat
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Dapatkan sertifikat setelah menyelesaikan 5 materi & 5 kuis. Cetak atau bagikan ke media sosial!
                </p>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 3: CARA KERJA                       */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content py-20 px-4 bg-gradient-to-b from-transparent via-teal-50/30 to-transparent dark:via-teal-950/20">
        <div className="max-w-6xl mx-auto">
          
          <Reveal>
            <div className="text-center mb-16">
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Cara Mulai
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
                3 Langkah Mudah, Langsung Bisa!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Tidak perlu ribet. Cukup ikuti langkah ini dan mulai belajar dalam 30 detik.
              </p>
            </div>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-teal-300 via-violet-300 to-amber-300 dark:from-teal-700 dark:via-violet-700 dark:to-amber-700"></div>

            <Reveal delay={0}>
              <div className="relative text-center group">
                <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-teal-400 to-cyan-600 rounded-3xl flex items-center justify-center shadow-xl shadow-teal-500/40 mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-extrabold text-white">1</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Daftar Gratis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                  Cukup 30 detik! Pakai email atau akun Google. Tidak perlu kartu kredit.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="relative text-center group">
                <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-violet-500/40 mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-extrabold text-white">2</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Pilih Materi
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                  Pilih materi sesuai jenjang dan kelasmu. Baca, tonton video, dan pahami konsepnya.
                </p>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="relative text-center group">
                <div className="relative z-10 w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/40 mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-extrabold text-white">3</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Uji & Naik Peringkat
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                  Kerjakan kuis, lihat pembahasan, dan pantau skormu naik di leaderboard!
                </p>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 4: UNTUK SIAPA                      */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content py-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Untuk Semua
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
                GhiMath untuk Siapa?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Dirancang untuk siswa, guru, dan siapa saja yang ingin belajar matematika dengan lebih mudah.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Siswa */}
            <Reveal delay={0}>
              <div className="card-elevated rounded-3xl p-7 h-full border-t-4 border-teal-400">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-teal-500/30">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Siswa
                </h3>
                <ul className="space-y-3">
                  {[
                    'Belajar mandiri kapan saja',
                    'Kerjakan kuis & lihat pembahasan',
                    'Pantau progress & naik peringkat',
                    'Dapatkan sertifikat pencapaian',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Guru */}
            <Reveal delay={150}>
              <div className="card-elevated rounded-3xl p-7 h-full border-t-4 border-violet-400">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Guru
                </h3>
                <ul className="space-y-3">
                  {[
                    'Pantau aktivitas siswa',
                    'Kelola materi & soal kuis',
                    'Lihat hasil ujian siswa',
                    'Bank rumus untuk referensi',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* ⚡ Publik: Update klaim */}
            <Reveal delay={300}>
              <div className="card-elevated rounded-3xl p-7 h-full border-t-4 border-amber-400">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30">
                  <Compass className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Publik
                </h3>
                <ul className="space-y-3">
                  {[
                    'Lihat daftar materi tanpa login',
                    'Akses bank rumus gratis',
                    'Coba Kuis Acak (Game Gabut)',
                    'Daftar untuk fitur lengkap',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 5: CTA FINAL                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal direction="scale">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 rounded-3xl p-8 md:p-14 text-center shadow-2xl shadow-teal-500/30">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-custom"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-float-reverse"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-5">
                  <Zap className="w-3.5 h-3.5" />
                  GRATIS SELAMANYA
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Siap Mulai Belajar?
                </h2>
                <p className="text-cyan-50 text-base md:text-lg mb-8 max-w-xl mx-auto">
                  {stats.users > 0 
                    ? `Bergabung dengan ${stats.users}+ siswa lainnya dan rasakan bedanya belajar matematika dengan GhiMath.`
                    : 'Daftar gratis sekarang dan rasakan bedanya belajar matematika dengan GhiMath.'
                  }
                </p>
                <Link 
                  to={user ? "/dashboard" : "/register"}
                  className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-2xl hover:bg-teal-50 transition-all shadow-xl hover:-translate-y-0.5 hover:scale-105"
                >
                  <Rocket className="w-5 h-5" />
                  {user ? 'Lanjut Belajar' : 'Daftar Sekarang — Gratis!'}
                  <ChevronRight className="w-5 h-5" />
                </Link>
                {!user && (
                  <p className="text-xs text-cyan-100 mt-4">
                    Sudah punya akun? <Link to="/login" className="underline font-semibold hover:text-white">Masuk di sini</Link>
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
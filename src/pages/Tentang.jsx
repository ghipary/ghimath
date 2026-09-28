import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Sparkles, Heart, Target, Rocket, BookOpen, Users, Lightbulb, 
  Code, GraduationCap, Globe, ChevronRight, Award, TrendingUp, 
  Star, Calculator, Zap, Shield, Coffee, MessageCircle, Mail,
  Database, Palette, Wrench, Brain, Trophy
} from 'lucide-react';

/* ═══════════════════════════════════════════════════ */
/* HELPER: ANIMASI SCROLL                              */
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
  
  const dirClasses = {
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
      } ${dirClasses[direction]}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════ */
/* KONTEN DATA                                         */
/* ═══════════════════════════════════════════════════ */
const VALUES = [
  {
    icon: Heart,
    title: 'Gratis untuk Semua',
    desc: 'Kami percaya pendidikan berkualitas harus bisa diakses siapa saja, tanpa terkecuali. Tidak ada biaya tersembunyi.',
    color: 'rose',
    gradient: 'from-rose-400 to-pink-600',
    shadow: 'shadow-rose-500/30',
  },
  {
    icon: Lightbulb,
    title: 'Belajar Itu Menyenangkan',
    desc: 'Matematika bukan momok! Kami rancang setiap materi & kuis agar terasa seperti bermain, bukan beban.',
    color: 'amber',
    gradient: 'from-amber-400 to-orange-600',
    shadow: 'shadow-amber-500/30',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    desc: 'Data kamu dilindungi dengan enkripsi standar industri. Kami tidak pernah membagikan data ke pihak ketiga.',
    color: 'emerald',
    gradient: 'from-emerald-400 to-teal-600',
    shadow: 'shadow-emerald-500/30',
  },
  {
    icon: Rocket,
    title: 'Terus Berkembang',
    desc: 'Kami rutin update fitur dan konten. Setiap feedback dari kamu jadi bahan bakar kami untuk jadi lebih baik.',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/30',
  },
];

const FEATURES_ICONS = [
  { icon: BookOpen, color: 'teal', label: 'Materi Interaktif' },
  { icon: Trophy, color: 'amber', label: 'Kuis Seru' },
  { icon: Brain, color: 'violet', label: 'AI Tutor' },
  { icon: Award, color: 'rose', label: 'Sertifikat' },
  { icon: TrendingUp, color: 'blue', label: 'Progress Tracking' },
  { icon: Users, color: 'pink', label: 'Leaderboard' },
];

const TECH_STACK = [
  { name: 'React', desc: 'Frontend modern', icon: Code, color: 'from-cyan-400 to-blue-500' },
  { name: 'Firebase', desc: 'Database real-time', icon: Database, color: 'from-amber-400 to-orange-500' },
  { name: 'Tailwind CSS', desc: 'Desain cantik & responsive', icon: Palette, color: 'from-cyan-500 to-teal-500' },
  { name: 'KaTeX', desc: 'Render rumus matematika', icon: Calculator, color: 'from-teal-500 to-emerald-500' },
  { name: 'Groq AI', desc: 'AI Tutor & auto-extract', icon: Brain, color: 'from-fuchsia-500 to-pink-500' },
  { name: 'Vercel', desc: 'Hosting cepat & stabil', icon: Globe, color: 'from-slate-500 to-slate-700' },
];

/* ═══════════════════════════════════════════════════ */
/* KOMPONEN UTAMA                                      */
/* ═══════════════════════════════════════════════════ */
const Tentang = () => {
  const [stats, setStats] = useState({
    materials: 0,
    quizzes: 0,
    formulas: 0,
    users: 0,
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
        const published = materialsSnap.docs.filter((d) => d.data().published === true);

        setStats({
          materials: published.length,
          quizzes: quizSnap.size,
          formulas: formulasSnap.size,
          users: realUsers.length,
        });
      } catch (error) {
        console.error('Gagal fetch stats:', error);
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
    <div className="page-bg transition-colors min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      {/* ═══════════════════════════════════════════ */}
      {/* HERO                                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content relative px-4 pt-16 sm:pt-20 pb-12 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-float-custom"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl animate-float-reverse"></div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Tentang Kami
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-6">
            Bikin Matematika
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Jadi Sahabat Siswa
            </span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            GhiMath lahir dari mimpi sederhana: <strong className="text-teal-600 dark:text-teal-400">setiap siswa Indonesia bisa belajar matematika dengan mudah, menyenangkan, dan gratis</strong>. Kami percaya, dengan tools yang tepat, tidak ada yang namanya "tidak bisa matematika".
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STATS                                       */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card-elevated rounded-2xl p-5 text-center border-t-4 border-teal-400">
                <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mb-1">{fmt(stats.materials)}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Materi</div>
              </div>
              <div className="card-elevated rounded-2xl p-5 text-center border-t-4 border-amber-400">
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mb-1">{fmt(stats.quizzes)}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Soal Kuis</div>
              </div>
              <div className="card-elevated rounded-2xl p-5 text-center border-t-4 border-violet-400">
                <div className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mb-1">{fmt(stats.formulas)}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bank Rumus</div>
              </div>
              <div className="card-elevated rounded-2xl p-5 text-center border-t-4 border-pink-400">
                <div className="text-3xl font-extrabold text-pink-600 dark:text-pink-400 mb-1">{fmt(stats.users)}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Siswa</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CERITA                                      */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="card-elevated rounded-3xl p-8 sm:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-500/5 rounded-full blur-2xl"></div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-full text-xs font-bold mb-4">
                  <Coffee className="w-3.5 h-3.5" />
                  CERITA KAMI
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Gimana Semua Ini Dimulai? ☕
                </h2>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  <p>
                    Semuanya berawal dari kegelisahan seorang siswa SMA bernama <strong className="text-teal-600 dark:text-teal-400">Abdurrahman Al-Ghifary</strong>. Dia melihat banyak teman-temannya yang menyerah dengan matematika — bukan karena mereka tidak mampu, tapi karena <strong>belajar terasa membosankan dan membingungkan</strong>.
                  </p>
                  <p>
                    "Kenapa belajar matematika harus seseram itu?" pikirnya. Buku tebal, rumus rumit, tanpa penjelasan yang menarik. Sementara di sisi lain, anak-anak bisa betah berjam-jam main game.
                  </p>
                  <p>
                    Akhirnya muncul ide: <strong className="text-teal-600 dark:text-teal-400">bagaimana kalau belajar matematika dibuat semenyenangkan game?</strong> Dengan progress bar, leaderboard, achievement, sertifikat — semua yang bikin kita pengen balik lagi dan lagi. Plus, kontennya harus lengkap, gratis, dan bisa diakses siapa saja.
                  </p>
                  <p>
                    Itulah awal mula <strong className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400">GhiMath</strong> dibuat. Dari mimpi kecil, jadi platform yang sekarang dipakai ratusan siswa di seluruh Indonesia. 🚀
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* VISI & MISI                                 */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-violet-200/60 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                <Target className="w-3.5 h-3.5" />
                VISI & MISI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Arah & Tujuan Kami
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal delay={0}>
              <div className="card-elevated rounded-3xl p-7 h-full border-l-4 border-teal-500">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-teal-500/30">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  🎯 Visi
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Menjadi platform pembelajaran matematika <strong className="text-teal-600 dark:text-teal-400">#1 di Indonesia</strong> yang bisa diakses gratis oleh semua siswa, di mana saja, kapan saja — tanpa batasan biaya atau geografis.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="card-elevated rounded-3xl p-7 h-full border-l-4 border-violet-500">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  🚀 Misi
                </h3>
                <ul className="space-y-2.5 text-gray-600 dark:text-gray-300">
                  {[
                    'Menyediakan materi lengkap & berkualitas untuk SMP & SMA',
                    'Membuat belajar matematika jadi menyenangkan',
                    'Memberikan pengalaman belajar yang personal & interaktif',
                    'Menjaga semuanya tetap gratis untuk semua siswa',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
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
      {/* NILAI-NILAI                                 */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-rose-200/60 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                <Heart className="w-3.5 h-3.5" />
                NILAI-NILAI KAMI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Yang Kami Pegang Teguh
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                4 pilar utama yang jadi fondasi setiap fitur dan keputusan di GhiMath.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((value, idx) => {
              const Icon = value.icon;
              return (
                <Reveal key={idx} delay={idx * 100}>
                  <div className="card-elevated rounded-3xl p-6 h-full group hover:-translate-y-2 transition-all duration-500">
                    <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg ${value.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">
                      {value.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* APA YANG KAMU DAPAT                         */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-12 bg-gradient-to-b from-transparent via-teal-50/30 to-transparent dark:via-teal-950/20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                FITUR UNGGULAN
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Apa Aja yang Kamu Dapat?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Semua fitur ini gratis, tanpa perlu bayar sepeser pun.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES_ICONS.map((feat, idx) => {
              const Icon = feat.icon;
              const colors = {
                teal: { bg: 'from-teal-400 to-cyan-600', shadow: 'shadow-teal-500/30' },
                amber: { bg: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/30' },
                violet: { bg: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
                rose: { bg: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/30' },
                blue: { bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
                pink: { bg: 'from-pink-500 to-fuchsia-600', shadow: 'shadow-pink-500/30' },
              };
              const c = colors[feat.color];
              return (
                <Reveal key={idx} delay={idx * 75}>
                  <div className="card-elevated rounded-2xl p-5 text-center group hover:-translate-y-2 transition-all duration-500">
                    <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${c.bg} rounded-2xl flex items-center justify-center mb-3 shadow-lg ${c.shadow} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{feat.label}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={500}>
            <div className="text-center mt-10">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 transition-all"
              >
                Lihat Semua Fitur
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TECH STACK                                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-blue-200/60 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                <Wrench className="w-3.5 h-3.5" />
                TEKNOLOGI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Dibangun dengan Teknologi Modern
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Supaya GhiMath cepat, stabil, dan bisa diakses dari perangkat apapun.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TECH_STACK.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <Reveal key={idx} delay={idx * 75}>
                  <div className="card-elevated rounded-2xl p-5 text-center group hover:-translate-y-2 transition-all">
                    <div className={`w-12 h-12 mx-auto bg-gradient-to-br ${tech.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{tech.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{tech.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DEVELOPER                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative overflow-hidden card-elevated rounded-3xl p-8 sm:p-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-500/5 rounded-full blur-3xl"></div>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Avatar */}
                <div className="flex justify-center md:justify-start">
                  <div className="relative">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-teal-500/40 relative overflow-hidden">
                      <span className="text-6xl font-extrabold text-white drop-shadow-lg">A</span>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="md:col-span-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full text-[10px] font-bold mb-3">
                    <Code className="w-3 h-3" />
                    DEVELOPER
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Abdurrahman Al-Ghifary
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    SMA Wahidiyah Samarinda • Kelas 12
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5 text-sm">
                    Seorang siswa SMA yang percaya bahwa <strong className="text-teal-600 dark:text-teal-400">teknologi bisa mengubah cara belajar</strong>. GhiMath adalah proyek pertama yang dia bangun dari nol — mulai dari desain, coding, sampai konten materi.
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <a
                      href="mailto:abdrrhmn.alghifary@gmail.com"
                      className="inline-flex items-center gap-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                    <a
                      href="https://github.com/ghipary/ghimath"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Code className="w-3.5 h-3.5" />
                      GitHub
                    </a>
                    <Link
                      to="/leaderboard"
                      className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Leaderboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA FINAL                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="page-content px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Reveal direction="scale">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-teal-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-custom"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-float-reverse"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Yuk, Mulai Belajar Bareng!
                </h2>
                <p className="text-cyan-50 text-base mb-8 max-w-xl mx-auto">
                  Bergabung dengan {stats.users > 0 ? `${stats.users}+ ` : ''}siswa lainnya. Gratis selamanya, tanpa kartu kredit.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 font-bold px-6 py-3.5 rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5"
                  >
                    <Rocket className="w-5 h-5" />
                    Daftar Gratis
                  </Link>
                  <Link
                    to="/faq"
                    className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-white/30 transition-all shadow-lg hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Ada Pertanyaan?
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tentang;
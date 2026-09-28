import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Download, Loader, ChevronLeft, Award, Trophy, BookOpen, Sparkles, Lock, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const MIN_MATERI = 5;
const MIN_KUIS = 5;

// ⚡ THEME CONFIG
const THEMES = {
  light: {
    bg: '#fdfcf7',
    bgGradient: 'radial-gradient(ellipse at center, rgba(253, 252, 247, 1) 0%, rgba(248, 246, 238, 1) 70%, rgba(240, 235, 220, 1) 100%)',
    glowTeal: 'rgba(20, 184, 166, 0.12)',
    glowGold: 'rgba(212, 167, 44, 0.14)',
    patternGold: 'rgba(212, 167, 44, 0.035)',
    patternTeal: 'rgba(13, 148, 136, 0.03)',
    dotGold: 'rgba(212, 167, 44, 0.08)',
    borderGold: '#d4a72c',
    borderGoldShadow: 'inset 0 0 0 1px rgba(212, 167, 44, 0.3), 0 0 0 1px rgba(212, 167, 44, 0.2)',
    borderTeal: '#0d9488',
    borderDashed: 'rgba(212, 167, 44, 0.5)',
    borderSolid: 'rgba(212, 167, 44, 0.6)',
    cornerGold: '#d4a72c',
    cornerTeal: '#0d9488',
    nameColor: '#0f172a',
    nameShadow: '0 2px 4px rgba(212, 167, 44, 0.15)',
    titleColor: '#0d9488',
    titleShadow: '0 1px 2px rgba(13, 148, 136, 0.15)',
    subtitleColor: '#d4a72c',
    subtitleShadow: 'none',
    brandColor: '#0f172a',
    brandSubColor: '#64748b',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    dividerLine: '#94a3b8',
    statValueColors: {
      materi: '#0d9488', kuis: '#7c3aed', avg: '#b45309', baca: '#2563eb',
      smart: '#db2777', ujian: '#0891b2', cepat: '#dc2626', streak: '#ea580c',
    },
    statBg: {
      materi: 'rgba(20,184,166,0.1)', kuis: 'rgba(139,92,246,0.1)', avg: 'rgba(212,167,44,0.12)', baca: 'rgba(59,130,246,0.1)',
      smart: 'rgba(236,72,153,0.1)', ujian: 'rgba(6,182,212,0.1)', cepat: 'rgba(239,68,68,0.1)', streak: 'rgba(249,115,22,0.1)',
    },
    statBorder: {
      materi: 'rgba(20,184,166,0.3)', kuis: 'rgba(139,92,246,0.3)', avg: 'rgba(212,167,44,0.4)', baca: 'rgba(59,130,246,0.3)',
      smart: 'rgba(236,72,153,0.3)', ujian: 'rgba(6,182,212,0.3)', cepat: 'rgba(239,68,68,0.3)', streak: 'rgba(249,115,22,0.3)',
    },
    statShadow: '0 2px 8px',
    starFilled: '#d4a72c',
    starEmpty: '#e2e8f0',
    starStrokeFilled: '#b45309',
    starStrokeEmpty: 'transparent',
    starGlow: 'drop-shadow(0 2px 3px rgba(212, 167, 44, 0.4))',
    waxBorder: '#fdfcf7',
    waxOutline: '#b45309',
    sealInnerBorder: 'rgba(180, 83, 9, 0.7)',
    certIdColor: '#0f172a',
    certDateColor: '#0f172a',
  },
  dark: {
    bg: '#0a0e1a',
    bgGradient: 'radial-gradient(ellipse at center, #0f1524 0%, #0a0e1a 60%, #050810 100%)',
    glowTeal: 'rgba(45, 212, 191, 0.15)',
    glowGold: 'rgba(212, 167, 44, 0.18)',
    patternGold: 'rgba(244, 212, 124, 0.04)',
    patternTeal: 'rgba(94, 234, 212, 0.03)',
    dotGold: 'rgba(244, 212, 124, 0.08)',
    borderGold: '#d4a72c',
    borderGoldShadow: 'inset 0 0 30px rgba(212, 167, 44, 0.15), 0 0 30px rgba(212, 167, 44, 0.2)',
    borderTeal: '#5eead4',
    borderDashed: 'rgba(244, 212, 124, 0.5)',
    borderSolid: 'rgba(244, 212, 124, 0.6)',
    cornerGold: '#f4d47c',
    cornerTeal: '#5eead4',
    nameColor: '#f4d47c',
    nameShadow: '0 0 30px rgba(244, 212, 124, 0.4), 0 2px 6px rgba(0,0,0,0.5)',
    titleColor: '#5eead4',
    titleShadow: '0 0 20px rgba(94, 234, 212, 0.5)',
    subtitleColor: '#f4d47c',
    subtitleShadow: '0 0 15px rgba(244, 212, 124, 0.4)',
    brandColor: '#f4d47c',
    brandSubColor: '#94a3b8',
    textPrimary: '#f4d47c',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    dividerLine: '#94a3b8',
    statValueColors: {
      materi: '#5eead4', kuis: '#c4b5fd', avg: '#f4d47c', baca: '#93c5fd',
      smart: '#f9a8d4', ujian: '#67e8f9', cepat: '#fca5a5', streak: '#fdba74',
    },
    statBg: {
      materi: 'rgba(45,212,191,0.15)', kuis: 'rgba(167,139,250,0.15)', avg: 'rgba(244,212,124,0.15)', baca: 'rgba(96,165,250,0.15)',
      smart: 'rgba(244,114,182,0.15)', ujian: 'rgba(34,211,238,0.15)', cepat: 'rgba(248,113,113,0.15)', streak: 'rgba(251,146,60,0.15)',
    },
    statBorder: {
      materi: 'rgba(45,212,191,0.5)', kuis: 'rgba(167,139,250,0.5)', avg: 'rgba(244,212,124,0.5)', baca: 'rgba(96,165,250,0.5)',
      smart: 'rgba(244,114,182,0.5)', ujian: 'rgba(34,211,238,0.5)', cepat: 'rgba(248,113,113,0.5)', streak: 'rgba(251,146,60,0.5)',
    },
    statShadow: '0 2px 12px',
    starFilled: '#f4d47c',
    starEmpty: '#1e293b',
    starStrokeFilled: '#fbbf24',
    starStrokeEmpty: 'rgba(148, 163, 184, 0.3)',
    starGlow: 'drop-shadow(0 0 8px rgba(244, 212, 124, 0.7))',
    waxBorder: '#0a0e1a',
    waxOutline: '#f4d47c',
    sealInnerBorder: 'rgba(120, 53, 15, 0.7)',
    certIdColor: '#f4d47c',
    certDateColor: '#cbd5e1',
  },
};

const Certificate = () => {
  const { user } = useAuth();
  const certificateRef = useRef(null);

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [certId, setCertId] = useState('');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('certTheme') || 'light';
    }
    return 'light';
  });
  const [stats, setStats] = useState({
    completedMaterials: 0,
    totalQuizzes: 0,
    avgScore: 0,
    totalReadingSeconds: 0,
    longestStreak: 0,
    avgExam: 0,
    fastestTime: 0,
    smartScore: 0,
  });

  const T = THEMES[theme];

  // Simpan preferensi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('certTheme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : null;
        setUserProfile(profile);

        const progressQ = query(collection(db, 'progress'), where('userId', '==', user.uid));
        const progressSnap = await getDocs(progressQ);
        let completed = 0;
        let readingSeconds = 0;
        progressSnap.forEach((d) => {
          const p = d.data();
          if (p.completed) completed++;
          readingSeconds += p.readingSeconds || 0;
        });

        const quizQ = query(collection(db, 'quizResults'), where('userId', '==', user.uid));
        const quizSnap = await getDocs(quizQ);
        let totalScore = 0;
        let count = 0;
        let fastestTime = 0;
        quizSnap.forEach((d) => {
          const r = d.data();
          totalScore += r.score || 0;
          count++;
          if (r.bestTime && r.bestTime > 0) {
            if (fastestTime === 0 || r.bestTime < fastestTime) fastestTime = r.bestTime;
          }
        });

        const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

        let avgExam = 0;
        try {
          const examQ = query(collection(db, 'examResults'), where('userId', '==', user.uid));
          const examSnap = await getDocs(examQ);
          let examTotal = 0;
          let examCount = 0;
          examSnap.forEach((d) => {
            const r = d.data();
            examTotal += r.score || 0;
            examCount++;
          });
          avgExam = examCount > 0 ? Math.round(examTotal / examCount) : 0;
        } catch (e) {
          avgExam = 0;
        }

        const longestStreak = profile?.longestStreak || 0;

        const smartScore = Math.round(
          avgScore * 0.35 +
          avgExam * 0.20 +
          Math.min(completed * 2.5, 100) * 0.15 +
          Math.min(count * 5, 100) * 0.10 +
          Math.min(longestStreak * 5, 100) * 0.10 +
          (fastestTime > 0 ? Math.max(0, 100 - fastestTime / 6) : 0) * 0.05 +
          Math.min((readingSeconds / 3600) * 15, 100) * 0.05
        );

        setStats({
          completedMaterials: completed,
          totalQuizzes: count,
          avgScore,
          totalReadingSeconds: readingSeconds,
          longestStreak,
          avgExam,
          fastestTime,
          smartScore: Math.max(0, Math.min(100, smartScore)),
        });

        const d = new Date();
        const id = `GHM-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${user.uid.slice(0, 6).toUpperCase()}`;
        setCertId(id);
      } catch (error) {
        console.error('Gagal memuat sertifikat:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const isEligible = stats.completedMaterials >= MIN_MATERI && stats.totalQuizzes >= MIN_KUIS;

  const handleDownload = async () => {
    if (!certificateRef.current || !isEligible) return;
    setDownloading(true);
    toast.loading('Menyiapkan sertifikat...', { id: 'cert-toast' });

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const node = certificateRef.current;

      const imgData = await toJpeg(node, {
        quality: 0.95,
        backgroundColor: T.bg,
        width: 1123,
        height: 794,
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: false,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      const safeName = (userProfile?.name || 'Siswa').replace(/[^a-zA-Z0-9]/g, '-');
      pdf.save(`Sertifikat-GhiMath-${safeName}-${theme}.pdf`);

      toast.success('Sertifikat berhasil diunduh! 🎉', { id: 'cert-toast' });
    } catch (error) {
      console.error('Gagal download:', error);
      toast.error('Gagal mengunduh sertifikat', { id: 'cert-toast' });
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!isEligible) {
    const progressMateri = Math.min(100, Math.round((stats.completedMaterials / MIN_MATERI) * 100));
    const progressKuis = Math.min(100, Math.round((stats.totalQuizzes / MIN_KUIS) * 100));

    return (
      <div className="page-bg transition-colors pb-20 min-h-screen">
        <div className="grid-pattern"></div>
        <Navbar />
        <div className="page-content max-w-2xl mx-auto px-4 pt-8 sm:pt-12">
          <Link to="/profil" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Profil
          </Link>
          <div className="card-elevated rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-orange-500/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-slate-500/30">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Sertifikat Belum Terbuka</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base">Selesaikan target di bawah ini untuk membuka sertifikatmu!</p>
              <div className="space-y-4 text-left">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Materi Selesai
                    </span>
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{stats.completedMaterials} / {MIN_MATERI}</span>
                  </div>
                  <div className="w-full bg-white/60 dark:bg-slate-800/60 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-500" style={{ width: `${progressMateri}%` }}></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 border border-violet-200/60 dark:border-violet-800/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Kuis Dikerjakan
                    </span>
                    <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{stats.totalQuizzes} / {MIN_KUIS}</span>
                  </div>
                  <div className="w-full bg-white/60 dark:bg-slate-800/60 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500" style={{ width: `${progressKuis}%` }}></div>
                  </div>
                </div>
              </div>
              <Link to="/materi" className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/30">
                Mulai Belajar Sekarang →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const starRating = stats.avgScore >= 90 ? 5 : stats.avgScore >= 75 ? 4 : stats.avgScore >= 60 ? 3 : stats.avgScore >= 40 ? 2 : 1;
  const certificateLevel = stats.avgScore >= 90 ? 'PLATINUM' : stats.avgScore >= 75 ? 'GOLD' : stats.avgScore >= 60 ? 'SILVER' : 'BRONZE';

  const levelConfig = {
    PLATINUM: { bg: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)', color: '#0f172a', border: '#94a3b8', glow: 'rgba(226, 232, 240, 0.4)' },
    GOLD: { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', color: '#ffffff', border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
    SILVER: { bg: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)', color: '#ffffff', border: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.4)' },
    BRONZE: { bg: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)', color: '#ffffff', border: '#d97706', glow: 'rgba(217, 119, 6, 0.5)' },
  };
  const currentLevel = levelConfig[certificateLevel];
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatReadingTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m`;
  };

  const formatTimeShort = (sec) => {
    if (!sec || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statCardStyle = (colorKey) => ({
    background: `linear-gradient(135deg, ${T.statBg[colorKey]} 0%, ${T.statBg[colorKey]}80 100%)`,
    border: `1px solid ${T.statBorder[colorKey]}`,
    borderRadius: '8px',
    padding: '7px 4px',
    height: '52px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `${T.statShadow} ${T.statBg[colorKey]}`,
  });

  const CertificateLogo = ({ size = 48 }) => (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        boxShadow: theme === 'dark' 
          ? '0 6px 24px rgba(20, 184, 166, 0.6), 0 0 40px rgba(20, 184, 166, 0.3)'
          : '0 6px 16px rgba(20, 184, 166, 0.4)',
        background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #0891b2 100%)',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72} xmlns="http://www.w3.org/2000/svg">
        <path d="M 44 18 A 18 18 0 1 0 44 46" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" />
        <line x1="30" y1="28" x2="46" y2="28" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <line x1="30" y1="36" x2="46" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="49" cy="32" r="3.5" fill="#fbbf24"/>
      </svg>
    </div>
  );

  const CornerFlourish = ({ position }) => {
    const rotations = { tl: 0, tr: 90, br: 180, bl: 270 };
    const positions = {
      tl: { top: '38px', left: '38px' },
      tr: { top: '38px', right: '38px' },
      br: { bottom: '38px', right: '38px' },
      bl: { bottom: '38px', left: '38px' },
    };
    return (
      <div style={{
        position: 'absolute',
        ...positions[position],
        width: '110px',
        height: '110px',
        transform: `rotate(${rotations[position]}deg)`,
        zIndex: 5,
        pointerEvents: 'none',
        opacity: 0.85,
      }}>
        <svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M 0 30 Q 0 0, 30 0" stroke={T.cornerGold} strokeWidth="1.5" fill="none"/>
          <path d="M 0 38 Q 0 0, 38 0" stroke={T.cornerTeal} strokeWidth="0.8" fill="none" opacity="0.6"/>
          <path d="M 8 62 C 8 40, 24 22, 45 18" stroke={T.cornerGold} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 45 18 C 60 15, 70 25, 65 38 C 62 45, 52 45, 50 38 C 49 33, 54 30, 58 33" stroke={T.cornerGold} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 15 70 C 18 55, 32 42, 48 38" stroke={T.cornerTeal} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
          <circle cx="45" cy="18" r="2.5" fill={T.cornerGold}/>
          <circle cx="50" cy="38" r="1.8" fill={T.cornerGold}/>
          <circle cx="8" cy="62" r="2" fill={T.cornerTeal}/>
          <path d="M 30 45 Q 35 40, 42 42 Q 38 48, 30 45 Z" fill={T.cornerGold} opacity="0.7"/>
          <path d="M 22 55 Q 26 50, 33 51 Q 30 57, 22 55 Z" fill={T.cornerTeal} opacity="0.6"/>
          <line x1="55" y1="12" x2="60" y2="8" stroke={T.cornerGold} strokeWidth="1" strokeLinecap="round"/>
          <line x1="12" y1="55" x2="8" y2="60" stroke={T.cornerGold} strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </div>
    );
  };

  const OrnamentalDivider = ({ width = 300 }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '6px',
      marginBottom: '6px',
    }}>
      <div style={{ width: `${width / 2 - 30}px`, height: '1px', background: `linear-gradient(to right, transparent, ${T.cornerGold})` }} />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z" fill={T.cornerGold}/>
        <circle cx="10" cy="10" r="1.5" fill={T.bg}/>
      </svg>
      <div style={{ 
        width: '6px', height: '6px', 
        background: T.cornerTeal, 
        transform: 'rotate(45deg)',
        boxShadow: theme === 'dark' ? `0 0 8px ${T.cornerTeal}` : 'none',
      }} />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8 Z" fill={T.cornerGold}/>
        <circle cx="10" cy="10" r="1.5" fill={T.bg}/>
      </svg>
      <div style={{ width: `${width / 2 - 30}px`, height: '1px', background: `linear-gradient(to left, transparent, ${T.cornerGold})` }} />
    </div>
  );

  const WaxSeal = () => (
    <div style={{
      position: 'absolute',
      bottom: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, #fbbf24 0%, #d4a72c 40%, #b45309 100%)',
      boxShadow: theme === 'dark'
        ? '0 6px 30px rgba(251, 191, 36, 0.6), inset 0 -3px 8px rgba(0,0,0,0.25), inset 0 3px 8px rgba(255,255,255,0.3)'
        : '0 6px 20px rgba(180, 83, 9, 0.5), inset 0 -3px 8px rgba(0,0,0,0.25), inset 0 3px 8px rgba(255,255,255,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `3px solid ${T.waxBorder}`,
      outline: `2px solid ${T.waxOutline}`,
      outlineOffset: '-6px',
    }}>
      <div style={{
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        border: `1.5px dashed ${T.sealInnerBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#78350f',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '1px' }}>
          <path d="M12 2 L14.5 8.5 L21.5 9 L16 13.5 L18 20.5 L12 16.5 L6 20.5 L8 13.5 L2.5 9 L9.5 8.5 Z" fill="#78350f" opacity="0.9"/>
        </svg>
        <div style={{
          fontSize: '8px',
          fontWeight: 900,
          letterSpacing: '0.15em',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          lineHeight: 1,
        }}>
          VERIFIED
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <Link to="/profil" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Profil
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
              Sertifikat Kamu
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Unduh dan bagikan pencapaianmu! 🎓</p>
          </div>
        </div>

        {/* ⚡ TOMBOL DOWNLOAD + TOGGLE THEME */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/30 hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Menyiapkan...' : `Download PDF (${theme === 'dark' ? 'Dark' : 'Light'})`}
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg border-2 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-amber-300 border-amber-500/50 hover:border-amber-400'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-300 hover:border-amber-400'
            }`}
            title="Ganti tema sertifikat"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="card-elevated rounded-2xl overflow-hidden p-3 sm:p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
            Preview Sertifikat (A4 Landscape) — {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </p>
          <div className="overflow-x-auto">
            
            <div
              ref={certificateRef}
              style={{
                width: '1123px',
                height: '794px',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                backgroundColor: T.bg,
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'background-color 0.3s ease',
              }}
            >
              {/* BACKGROUND PATTERN */}
              <div style={{
                position: 'absolute', inset: 0,
                background: T.bgGradient,
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'absolute', top: '-100px', left: '-100px',
                width: '450px', height: '450px',
                background: `radial-gradient(circle, ${T.glowTeal} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'absolute', bottom: '-100px', right: '-100px',
                width: '450px', height: '450px',
                background: `radial-gradient(circle, ${T.glowGold} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `
                  repeating-linear-gradient(30deg, ${T.patternGold} 0px, ${T.patternGold} 1px, transparent 1px, transparent 20px),
                  repeating-linear-gradient(-30deg, ${T.patternTeal} 0px, ${T.patternTeal} 1px, transparent 1px, transparent 20px)
                `,
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px', height: '600px',
                backgroundImage: `radial-gradient(circle, ${T.dotGold} 1px, transparent 1.5px)`,
                backgroundSize: '24px 24px',
                borderRadius: '50%',
                maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* BORDER LAYERS */}
              <div style={{
                position: 'absolute', inset: '18px',
                border: `3px solid ${T.borderGold}`,
                borderRadius: '2px',
                boxShadow: T.borderGoldShadow,
                pointerEvents: 'none',
              }} />
              <div style={{ 
                position: 'absolute', inset: '30px', 
                border: `1px solid ${T.borderTeal}`, 
                borderRadius: '2px', 
                pointerEvents: 'none',
                opacity: theme === 'dark' ? 0.7 : 1,
                boxShadow: theme === 'dark' ? 'inset 0 0 15px rgba(94, 234, 212, 0.1)' : 'none',
              }} />
              <div style={{
                position: 'absolute', inset: '36px',
                border: `1px dashed ${T.borderDashed}`,
                borderRadius: '2px', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', inset: '42px',
                border: `0.5px solid ${T.borderSolid}`,
                borderRadius: '2px', pointerEvents: 'none',
              }} />

              <CornerFlourish position="tl" />
              <CornerFlourish position="tr" />
              <CornerFlourish position="br" />
              <CornerFlourish position="bl" />

              {[
                { top: '11px', left: '11px' },
                { top: '11px', right: '11px' },
                { bottom: '11px', right: '11px' },
                { bottom: '11px', left: '11px' },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...pos,
                  width: '22px', height: '22px',
                  background: `linear-gradient(135deg, ${T.cornerGold} 0%, #b45309 100%)`,
                  transform: 'rotate(45deg)', borderRadius: '3px',
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px rgba(244, 212, 124, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)'
                    : '0 2px 4px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.3)',
                  zIndex: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '6px', height: '6px',
                    background: T.bg,
                    transform: 'rotate(45deg)',
                    borderRadius: '1px',
                  }} />
                </div>
              ))}

              {/* HEADER */}
              <div style={{
                position: 'absolute',
                top: '58px',
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <CertificateLogo size={48} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ 
                      fontSize: '22px', fontWeight: 800, color: T.brandColor, 
                      letterSpacing: '-0.03em', lineHeight: 1,
                      textShadow: theme === 'dark' ? '0 0 20px rgba(244, 212, 124, 0.3)' : 'none',
                    }}>
                      GhiMath
                    </div>
                    <div style={{ fontSize: '8px', color: T.brandSubColor, letterSpacing: '0.2em', fontWeight: 700, marginTop: '3px' }}>
                      MEDIA PEMBELAJARAN MATEMATIKA
                    </div>
                  </div>
                </div>

                <OrnamentalDivider width={360} />

                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <div style={{
                    fontSize: '24px', letterSpacing: '0.4em', color: T.titleColor,
                    fontWeight: 800, lineHeight: 1,
                    textShadow: T.titleShadow,
                  }}>
                    SERTIFIKAT
                  </div>
                  <div style={{
                    fontSize: '12px', letterSpacing: '0.55em', color: T.subtitleColor,
                    fontWeight: 700, marginTop: '6px',
                    textShadow: T.subtitleShadow,
                  }}>
                    PENGHARGAAN
                  </div>
                  <div style={{
                    fontSize: '8px', letterSpacing: '0.35em', color: T.textMuted,
                    marginTop: '4px', fontWeight: 500,
                  }}>
                    CERTIFICATE OF ACHIEVEMENT
                  </div>
                </div>

                <div style={{
                  fontSize: '11px', color: T.textMuted,
                  marginTop: '16px', fontStyle: 'italic',
                  letterSpacing: '0.02em',
                }}>
                  Dengan bangga diberikan kepada
                </div>
              </div>

              {/* MIDDLE */}
              <div style={{
                position: 'absolute',
                top: '288px',
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
              }}>
                <div style={{
                  fontSize: '54px',
                  fontWeight: 700,
                  color: T.nameColor,
                  fontFamily: "'Great Vibes', 'Brush Script MT', cursive",
                  lineHeight: 1.15,
                  textAlign: 'center',
                  maxWidth: '100%',
                  padding: '0 60px',
                  wordBreak: 'break-word',
                  textShadow: T.nameShadow,
                  transition: 'color 0.3s ease',
                }}>
                  {userProfile?.name || 'Siswa GhiMath'}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', marginTop: '10px',
                }}>
                  <div style={{ width: '120px', height: '1px', background: `linear-gradient(to right, transparent, ${T.cornerGold})` }} />
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1 L8.5 5.5 L13 7 L8.5 8.5 L7 13 L5.5 8.5 L1 7 L5.5 5.5 Z" fill={T.cornerGold}/>
                  </svg>
                  <div style={{ width: '60px', height: '1.5px', background: `linear-gradient(to right, ${T.cornerTeal}, ${T.cornerGold})` }} />
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1 L8.5 5.5 L13 7 L8.5 8.5 L7 13 L5.5 8.5 L1 7 L5.5 5.5 Z" fill={T.cornerTeal}/>
                  </svg>
                  <div style={{ width: '60px', height: '1.5px', background: `linear-gradient(to left, ${T.cornerTeal}, ${T.cornerGold})` }} />
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1 L8.5 5.5 L13 7 L8.5 8.5 L7 13 L5.5 8.5 L1 7 L5.5 5.5 Z" fill={T.cornerGold}/>
                  </svg>
                  <div style={{ width: '120px', height: '1px', background: `linear-gradient(to left, transparent, ${T.cornerGold})` }} />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '11px',
                  color: T.textSecondary,
                  fontWeight: 600,
                  marginTop: '12px',
                }}>
                  {userProfile?.school && <span>{userProfile.school}</span>}
                  {userProfile?.school && userProfile?.level && <span style={{ color: T.cornerGold, fontSize: '7px' }}>◆</span>}
                  {userProfile?.level && userProfile?.grade && (
                    <span>Jenjang {userProfile.level} • Kelas {userProfile.grade}</span>
                  )}
                </div>

                <div style={{
                  maxWidth: '760px',
                  fontSize: '11.5px',
                  lineHeight: 1.6,
                  color: T.textSecondary,
                  textAlign: 'center',
                  marginTop: '10px',
                }}>
                  Telah berhasil menyelesaikan{' '}
                  <strong style={{ color: T.statValueColors.materi }}>{stats.completedMaterials} materi</strong> dan{' '}
                  <strong style={{ color: T.statValueColors.materi }}>{stats.totalQuizzes} kuis</strong> di GhiMath dengan rata-rata nilai{' '}
                  <strong style={{ color: T.statValueColors.avg }}>{stats.avgScore}</strong>
                  {stats.longestStreak > 0 && (
                    <>, serta mencapai <strong style={{ color: T.statValueColors.avg }}>{stats.longestStreak} hari</strong> belajar berturut-turut</>
                  )}.
                </div>

                {/* 8 STATS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '7px',
                  width: '820px',
                  marginTop: '16px',
                }}>
                  <div style={statCardStyle('materi')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.materi, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.materi}80` : 'none' }}>{stats.completedMaterials}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>MATERI</div>
                  </div>
                  <div style={statCardStyle('kuis')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.kuis, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.kuis}80` : 'none' }}>{stats.totalQuizzes}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>KUIS</div>
                  </div>
                  <div style={statCardStyle('avg')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.avg, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.avg}80` : 'none' }}>{stats.avgScore}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>RATA KIS</div>
                  </div>
                  <div style={statCardStyle('baca')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.baca, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.baca}80` : 'none' }}>{formatReadingTime(stats.totalReadingSeconds)}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>BACA</div>
                  </div>
                  <div style={statCardStyle('smart')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.smart, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.smart}80` : 'none' }}>{stats.smartScore}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>SMART</div>
                  </div>
                  <div style={statCardStyle('ujian')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.ujian, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.ujian}80` : 'none' }}>{stats.avgExam}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>UJIAN</div>
                  </div>
                  <div style={statCardStyle('cepat')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.cepat, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.cepat}80` : 'none' }}>{formatTimeShort(stats.fastestTime)}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>CEPAT</div>
                  </div>
                  <div style={statCardStyle('streak')}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: T.statValueColors.streak, lineHeight: 1, textShadow: theme === 'dark' ? `0 0 10px ${T.statValueColors.streak}80` : 'none' }}>{stats.longestStreak}</div>
                    <div style={{ fontSize: '7px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.08em', marginTop: '3px' }}>STREAK</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '16px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} width="24" height="24" viewBox="0 0 24 24" fill="none" style={{
                      filter: s <= starRating ? T.starGlow : 'none',
                    }}>
                      <path
                        d="M12 2 L15 8.5 L22 9.5 L17 14 L18.5 21 L12 17.5 L5.5 21 L7 14 L2 9.5 L9 8.5 Z"
                        fill={s <= starRating ? T.starFilled : T.starEmpty}
                        stroke={s <= starRating ? T.starStrokeFilled : T.starStrokeEmpty}
                        strokeWidth="0.8"
                      />
                    </svg>
                  ))}
                </div>
              </div>

              <WaxSeal />

              {/* FOOTER */}
              <div style={{
                position: 'absolute',
                bottom: '45px',
                left: '85px',
                right: '85px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '20px',
                zIndex: 10,
              }}>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{
                    fontFamily: "'Great Vibes', 'Brush Script MT', cursive",
                    fontSize: '26px',
                    color: T.nameColor,
                    lineHeight: 1.1,
                    marginBottom: '4px',
                    textShadow: theme === 'dark' ? '0 0 20px rgba(244, 212, 124, 0.3)' : 'none',
                  }}>
                    Abdurrahman Al-Ghifary
                  </div>
                  <div style={{
                    width: '160px', height: '1px',
                    background: `linear-gradient(to right, transparent, ${T.dividerLine}, transparent)`,
                    margin: '4px auto 6px',
                  }} />
                  <div style={{ fontSize: '8px', color: T.textMuted, fontWeight: 700, letterSpacing: '0.15em' }}>
                    PEMBUAT GHIMATH
                  </div>
                </div>

                <div style={{ textAlign: 'center', width: '150px' }}>
                  <div style={{
                    background: currentLevel.bg,
                    padding: '11px 22px',
                    borderRadius: '10px',
                    color: currentLevel.color,
                    boxShadow: theme === 'dark'
                      ? `0 6px 24px ${currentLevel.glow}, inset 0 -2px 4px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.2)`
                      : `0 6px 16px ${currentLevel.glow}, inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)`,
                    border: `2px solid ${currentLevel.border}`,
                    position: 'relative',
                  }}>
                    <div style={{ fontSize: '7px', letterSpacing: '0.3em', fontWeight: 700, opacity: 0.9, lineHeight: 1 }}>
                      TINGKAT
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.15em', lineHeight: 1.2, marginTop: '3px' }}>
                      {certificateLevel}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ fontSize: '7px', color: T.textMuted, letterSpacing: '0.15em', fontWeight: 700, marginBottom: '2px' }}>
                    NO. SERTIFIKAT
                  </div>
                  <div style={{ fontSize: '10px', color: T.certIdColor, fontWeight: 700, fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.02em' }}>
                    {certId}
                  </div>
                  <div style={{
                    width: '130px', height: '1px',
                    background: `linear-gradient(to right, transparent, ${T.dividerLine}, transparent)`,
                    margin: '0 auto 5px',
                  }} />
                  <div style={{ fontSize: '7px', color: T.textMuted, letterSpacing: '0.15em', fontWeight: 700, marginBottom: '2px' }}>
                    DITERBITKAN
                  </div>
                  <div style={{ fontSize: '10px', color: T.certDateColor, fontWeight: 600 }}>
                    {today}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-2xl p-4 text-sm text-teal-800 dark:text-teal-300 flex gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
          <div>
            <p className="font-bold mb-1">Bagikan pencapaianmu! 🎉</p>
            <p className="text-xs leading-relaxed">
              Screenshot atau cetak sertifikat ini, lalu pajang di kamarmu atau bagikan ke media sosial. Bangga dong, kamu sudah belajar dengan giat!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Certificate;
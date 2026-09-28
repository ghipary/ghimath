
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Search, BookOpen, Clock, Loader, Lock, X, CheckCircle, BookMarked, TrendingUp, Sparkles, ChevronDown, FolderOpen, Folder, GraduationCap, Layers, Trophy, Target, ShieldAlert, Star } from 'lucide-react';

// ⚡ Warna BASIC per kelas
const getGradeStyle = (grade) => {
  const g = Number(grade);
  const styles = {
    7: {
      bg: 'from-teal-400 via-teal-500 to-cyan-600',
      shadow: 'shadow-teal-500/30',
      badgeBg: 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400',
      iconBg: 'from-teal-400 to-cyan-500',
    },
    8: {
      bg: 'from-blue-500 via-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      badgeBg: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-400',
      iconBg: 'from-blue-400 to-indigo-500',
    },
    9: {
      bg: 'from-violet-500 via-purple-600 to-fuchsia-600',
      shadow: 'shadow-purple-500/30',
      badgeBg: 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400',
      iconBg: 'from-violet-400 to-purple-500',
    },
    10: {
      bg: 'from-orange-500 via-orange-600 to-red-600',
      shadow: 'shadow-orange-500/30',
      badgeBg: 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/40 dark:to-red-900/40 dark:text-orange-400',
      iconBg: 'from-orange-500 to-red-500',
    },
    11: {
      bg: 'from-fuchsia-500 via-purple-500 to-violet-600',
      shadow: 'shadow-purple-500/30',
      badgeBg: 'bg-gradient-to-r from-fuchsia-100 to-purple-100 text-purple-700 dark:from-fuchsia-900/40 dark:to-purple-900/40 dark:text-purple-400',
      iconBg: 'from-fuchsia-500 to-purple-500',
    },
    12: {
      bg: 'from-yellow-300 via-yellow-400 to-amber-500',
      shadow: 'shadow-yellow-500/30',
      badgeBg: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-400',
      iconBg: 'from-yellow-300 to-amber-500',
    },
  };
  return styles[g] || styles[7];
};

// ⚡ Warna PREMIUM untuk Matematika Tingkat Lanjut (deep color + glow mewah)
const getAdvancedGradeStyle = (grade) => {
  const g = Number(grade);
  const styles = {
    7: {
      bg: 'from-teal-500 via-cyan-600 to-blue-700',
      shadow: 'shadow-teal-500/60',
      badgeBg: 'bg-gradient-to-r from-teal-200 to-cyan-200 text-teal-900 dark:from-teal-800/60 dark:to-cyan-800/60 dark:text-teal-200',
      iconBg: 'from-teal-500 via-cyan-500 to-blue-600',
    },
    8: {
      bg: 'from-blue-600 via-indigo-600 to-purple-700',
      shadow: 'shadow-blue-500/60',
      badgeBg: 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900 dark:from-blue-800/60 dark:to-indigo-800/60 dark:text-blue-200',
      iconBg: 'from-blue-500 via-indigo-500 to-purple-600',
    },
    9: {
      bg: 'from-violet-600 via-purple-700 to-fuchsia-700',
      shadow: 'shadow-purple-500/60',
      badgeBg: 'bg-gradient-to-r from-violet-200 to-purple-200 text-violet-900 dark:from-violet-800/60 dark:to-purple-800/60 dark:text-violet-200',
      iconBg: 'from-violet-500 via-purple-500 to-fuchsia-600',
    },
    10: {
      bg: 'from-orange-600 via-red-600 to-rose-700',
      shadow: 'shadow-orange-500/60',
      badgeBg: 'bg-gradient-to-r from-orange-200 to-red-200 text-orange-900 dark:from-orange-800/60 dark:to-red-800/60 dark:text-orange-200',
      iconBg: 'from-orange-500 via-red-500 to-rose-600',
    },
    // ⚡ KELAS 11 TINGKAT LANJUT — Ungu MEWAH
    11: {
      bg: 'from-purple-700 via-violet-700 to-indigo-800',
      shadow: 'shadow-purple-500/70',
      badgeBg: 'bg-gradient-to-r from-purple-200 via-violet-200 to-indigo-200 text-purple-900 dark:from-purple-800/60 dark:to-indigo-800/60 dark:text-purple-200',
      iconBg: 'from-purple-600 via-violet-600 to-indigo-700',
      isPremium: true,
    },
    // ⚡ KELAS 12 TINGKAT LANJUT — Emas MEWAH
    12: {
      bg: 'from-amber-400 via-yellow-500 to-orange-600',
      shadow: 'shadow-amber-500/70',
      badgeBg: 'bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 text-amber-900 dark:from-amber-800/60 dark:to-orange-800/60 dark:text-yellow-200',
      iconBg: 'from-amber-400 via-yellow-500 to-orange-600',
      isPremium: true,
    },
  };
  return styles[g] || styles[7];
};

// ⚡ Helper: cek apakah materi tingkat lanjut
const isAdvancedMath = (title) => {
  if (!title) return false;
  return /matematika\s+tingkat\s+lanjut/i.test(title);
};

const MaterialList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFolders, setOpenFolders] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [viewMode, setViewMode] = useState('jenjang'); 

  const [userProfile, setUserProfile] = useState(null);
  const [lockedModal, setLockedModal] = useState(null);
  const [unlockStatus, setUnlockStatus] = useState({
    unlocked: false,
    materialsPercent: 0,
    quizzesPercent: 0,
    ownMaterials: { total: 0, completed: 0 },
    ownQuizzes: { total: 0, completed: 0 },
  });

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'materials'), where('published', '==', true));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMaterials(data);

        if (user) {
          const progressQuery = query(collection(db, 'progress'), where('userId', '==', user.uid));
          const progressSnap = await getDocs(progressQuery);
          const progressData = {};
          progressSnap.forEach((d) => {
            const p = d.data();
            progressData[p.materialId] = p;
          });
          setProgressMap(progressData);

          const profileSnap = await getDoc(doc(db, 'users', user.uid));
          if (profileSnap.exists()) setUserProfile(profileSnap.data());
        }
      } catch (error) {
        console.error('Gagal ambil materi:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // ⚡ CEK UNLOCK STATUS
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!user || !userProfile?.level || materials.length === 0) return;

      const userLevel = userProfile.level;
      const ownLevelMaterials = materials.filter((m) => m.level === userLevel);
      const totalMaterials = ownLevelMaterials.length;
      const ownMaterialIds = new Set(ownLevelMaterials.map((m) => m.id));

      if (totalMaterials === 0) return;

      let completedMaterials = 0;
      Object.values(progressMap).forEach((p) => {
        if (p.completed && p.materialLevel === userLevel) completedMaterials++;
      });

      const quizQ = query(collection(db, 'quizResults'), where('userId', '==', user.uid));
      const quizSnap = await getDocs(quizQ);
      const uniqueQuizMaterials = new Set();
      quizSnap.forEach((d) => {
        const r = d.data();
        if (ownMaterialIds.has(r.materialId)) uniqueQuizMaterials.add(r.materialId);
      });
      const completedQuizzes = uniqueQuizMaterials.size;

      const materialsPercent = Math.round((completedMaterials / totalMaterials) * 100);
      const quizzesPercent = Math.round((completedQuizzes / totalMaterials) * 100);

      setUnlockStatus({
        unlocked: materialsPercent >= 50 && quizzesPercent >= 50,
        materialsPercent,
        quizzesPercent,
        ownMaterials: { total: totalMaterials, completed: completedMaterials },
        ownQuizzes: { total: totalMaterials, completed: completedQuizzes },
      });
    };
    checkUnlockStatus();
  }, [user, userProfile, materials, progressMap]);

  // ⚡ GROUP MATERIALS — Folder SMP & SMA (jenjang tetap)
  const groupedMaterials = useMemo(() => {
    const groups = {};

    materials.forEach((mat) => {
      const descText = stripHtml(mat.description).toLowerCase();
      const matchSearch = !searchTerm ||
        mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descText.includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return;

      let key, displayLevel, displayGrade;

      if (viewMode === 'jenjang') {
        key = mat.level;
        displayLevel = mat.level;
        displayGrade = mat.level;
      } else {
        key = mat.topic || 'Lainnya';
        displayLevel = 'Topik';
        displayGrade = mat.topic || 'Lainnya';
      }

      if (!groups[key]) {
        groups[key] = {
          id: key,
          level: displayLevel,
          grade: displayGrade,
          materials: [],
        };
      }
      groups[key].materials.push(mat);
    });

    // ⚡ SORT: kelas dulu (7→12), lalu biasa dulu, baru tingkat lanjut, lalu nomor bab
    Object.values(groups).forEach((group) => {
      group.materials.sort((a, b) => {
        const gradeA = Number(a.grade) || 0;
        const gradeB = Number(b.grade) || 0;
        if (gradeA !== gradeB) return gradeA - gradeB;

        const advA = isAdvancedMath(a.title) ? 1 : 0;
        const advB = isAdvancedMath(b.title) ? 1 : 0;
        if (advA !== advB) return advA - advB;

        const getBabNumber = (title) => {
          if (!title) return 999;
          const match = title.match(/Bab\s+(\d+)/i);
          return match ? parseInt(match[1]) : 999;
        };
        return getBabNumber(a.title) - getBabNumber(b.title);
      });
    });

    let sortedGroups;
    if (viewMode === 'jenjang') {
      sortedGroups = Object.values(groups).sort((a, b) => {
        const levelOrder = { SMP: 1, SMA: 2 };
        return levelOrder[a.level] - levelOrder[b.level];
      });
    } else {
      sortedGroups = Object.values(groups).sort((a, b) => 
        a.grade.localeCompare(b.grade)
      );
    }

    return sortedGroups;
  }, [materials, searchTerm, viewMode]);

  useEffect(() => {
    if (searchTerm) {
      const allOpen = {};
      groupedMaterials.forEach((group) => {
        allOpen[group.id] = true;
      });
      setOpenFolders(allOpen);
    }
  }, [searchTerm, groupedMaterials]);

  const toggleFolder = (key) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCardClick = (e) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const isFolderLocked = (group) => {
    if (viewMode !== 'jenjang') return false;
    if (!user) return false;
    if (!userProfile?.level) return false;
    const isOwnJenjang = group.level === userProfile.level;
    const isOtherJenjang = group.level === 'SMP' || group.level === 'SMA';
    if (isOwnJenjang || !isOtherJenjang) return false;
    return !unlockStatus.unlocked;
  };

  const isMaterialLocked = (mat) => {
    if (!user) return false;
    if (!userProfile?.level) return false;
    const isOwnJenjang = mat.level === userProfile.level;
    const isOtherJenjang = mat.level === 'SMP' || mat.level === 'SMA';
    if (isOwnJenjang || !isOtherJenjang) return false;
    return !unlockStatus.unlocked;
  };

  const handleFolderClick = (group) => {
    if (isFolderLocked(group)) {
      setLockedModal({ level: group.level });
      return;
    }
    toggleFolder(group.id);
  };

  const handleLockedMaterialClick = (e, mat) => {
    e.preventDefault();
    setLockedModal({ level: mat.level });
  };

  const getFolderProgress = (group) => {
    const total = group.materials.length;
    const completed = group.materials.filter((m) => progressMap[m.id]?.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />
      
      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/50 dark:border-teal-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-teal-700 dark:text-teal-400 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          {materials.length} materi tersedia
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
          Daftar Materi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {user ? 'Pilih folder untuk melihat materi.' : 'Lihat-lihat dulu, login untuk membaca selengkapnya.'}
        </p>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        
        {/* TOGGLE MODE */}
        <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 w-fit mb-6 shadow-sm">
          <button
            onClick={() => setViewMode('jenjang')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'jenjang'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Berdasarkan Jenjang
          </button>
          <button
            onClick={() => setViewMode('topik')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'topik'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Berdasarkan Topik
          </button>
        </div>

        {/* Search Bar */}
        <div className="card-elevated rounded-2xl p-4 md:p-5 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" placeholder="Cari materi... (misal: Pythagoras)" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* INFO PANEL UNLOCK */}
        {user && userProfile?.level && !unlockStatus.unlocked && (
          <div className="card-elevated rounded-2xl p-4 sm:p-5 mb-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                  Buka Jenjang {userProfile.level === 'SMP' ? 'SMA' : 'SMP'} dengan Menyelesaikan Target
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Selesaikan <strong>50% materi</strong> & <strong>50% kuis</strong> dari jenjang {userProfile.level} kamu.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3 border border-gray-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Materi
                  </span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    {unlockStatus.ownMaterials.completed}/{unlockStatus.ownMaterials.total} ({unlockStatus.materialsPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      unlockStatus.materialsPercent >= 50 
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-500' 
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, unlockStatus.materialsPercent)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {unlockStatus.materialsPercent >= 50 ? 'Target tercapai' : `Kurang ${50 - unlockStatus.materialsPercent}% lagi`}
                </p>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/50 rounded-xl p-3 border border-gray-200/60 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Kuis
                  </span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    {unlockStatus.ownQuizzes.completed}/{unlockStatus.ownQuizzes.total} ({unlockStatus.quizzesPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      unlockStatus.quizzesPercent >= 50 
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-500' 
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, unlockStatus.quizzesPercent)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {unlockStatus.quizzesPercent >= 50 ? 'Target tercapai' : `Kurang ${50 - unlockStatus.quizzesPercent}% lagi`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FOLDER LIST */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat materi...</p>
          </div>
        ) : groupedMaterials.length === 0 ? (
          <div className="text-center py-20 card-elevated rounded-2xl">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Materi tidak ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah kata kunci pencarianmu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMaterials.map((group) => {
              const isLocked = isFolderLocked(group);
              const isOpen = openFolders[group.id] && !isLocked;
              const folderProgress = getFolderProgress(group);
              
              const isTopicMode = viewMode === 'topik';
              const isSMP = group.level === 'SMP';
              
              let bgGradient, shadowColor, badgeBg, badgeText, folderIcon;

              if (isLocked) {
                bgGradient = 'from-slate-500 via-slate-600 to-slate-700';
                shadowColor = 'shadow-slate-500/20';
                badgeBg = 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-400';
                badgeText = group.level;
                folderIcon = <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
              } else if (isTopicMode) {
                bgGradient = 'from-violet-500 via-purple-600 to-fuchsia-600';
                shadowColor = 'shadow-purple-500/30';
                badgeBg = 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400';
                badgeText = 'Topik';
                folderIcon = <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
              } else if (isSMP) {
                bgGradient = 'from-teal-400 via-teal-600 to-cyan-600';
                shadowColor = 'shadow-teal-500/30';
                badgeBg = 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400';
                badgeText = group.level;
                folderIcon = isOpen ? <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <Folder className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
              } else {
                bgGradient = 'from-violet-500 via-purple-600 to-fuchsia-600';
                shadowColor = 'shadow-purple-500/30';
                badgeBg = 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400';
                badgeText = group.level;
                folderIcon = isOpen ? <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : <Folder className="w-6 h-6 sm:w-7 sm:h-7 text-white" />;
              }

              return (
                <div 
                  key={group.id}
                  className={`card-elevated rounded-2xl overflow-hidden transition-all ${
                    isLocked ? 'opacity-75 border-dashed' : ''
                  }`}
                >
                  <button
                    onClick={() => handleFolderClick(group)}
                    className={`w-full flex items-center justify-between gap-4 p-4 sm:p-5 transition-colors ${
                      isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all bg-gradient-to-br ${bgGradient} ${shadowColor}`}>
                        {folderIcon}
                      </div>

                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBg}`}>
                            {badgeText}
                          </span>
                          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                            {isTopicMode ? group.grade : `Jenjang ${group.grade}`}
                          </h2>
                          {isLocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> TERKUNCI
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {isLocked 
                            ? 'Selesaikan target untuk membuka jenjang ini'
                            : `${group.materials.length} materi • ${folderProgress.completed} selesai`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!isLocked && folderProgress.percent > 0 && (
                        <div className="hidden sm:block text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {folderProgress.percent}%
                          </div>
                          <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full bg-gradient-to-r ${
                                isTopicMode 
                                  ? 'from-violet-400 to-purple-500' 
                                  : isSMP 
                                    ? 'from-teal-400 to-cyan-500' 
                                    : 'from-violet-400 to-purple-500'
                              }`}
                              style={{ width: `${folderProgress.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`} />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-slate-700/50 p-4 sm:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.materials.map((mat) => {
                          const progress = progressMap[mat.id];
                          const isCompleted = progress?.completed === true;
                          const isOpened = !!progress;
                          const percent = isCompleted ? 100 : (progress?.percentage || 0);
                          const descPreview = stripHtml(mat.description);
                          const matLocked = isMaterialLocked(mat);
                          const isAdvanced = isAdvancedMath(mat.title);
                          
                          // ⚡ Pilih style: basic vs premium (advanced)
                          const gradeStyle = isAdvanced 
                            ? getAdvancedGradeStyle(mat.grade) 
                            : getGradeStyle(mat.grade);

                          if (matLocked) {
                            return (
                              <button
                                key={mat.id}
                                onClick={(e) => handleLockedMaterialClick(e, mat)}
                                className="text-left group/card bg-slate-100 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700/50 transition-all overflow-hidden relative opacity-70 hover:opacity-90 cursor-pointer"
                              >
                                <div className="h-1 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600"></div>
                                <div className="p-4">
                                  <div className="flex items-start gap-2.5 mb-2">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-slate-400 to-slate-600 shadow-md">
                                      <Lock className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                                        {mat.title}
                                      </h3>
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                                        {mat.level} • {mat.topic}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-200/60 dark:bg-slate-700/40 rounded-lg mb-2">
                                    <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                      Terkunci — Selesaikan Jenjang {userProfile?.level}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> 15 menit
                                    </span>
                                    <span className="font-bold text-slate-500 dark:text-slate-400">
                                      Buka Target →
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          }

                          // ⚡ KARTU MATERI — basic atau premium (advanced)
                          return (
                            <Link 
                              key={mat.id} 
                              to={`/materi/${mat.id}`}
                              onClick={handleCardClick}
                              className={`group/card bg-white dark:bg-slate-800/50 rounded-xl transition-all overflow-hidden relative hover:-translate-y-1 ${
                                isAdvanced
                                  ? `border-[3px] ${
                                      isCompleted 
                                        ? (Number(mat.grade) === 12 
                                            ? 'border-amber-400 dark:border-amber-500/70' 
                                            : Number(mat.grade) === 11
                                              ? 'border-purple-400 dark:border-purple-500/70'
                                              : 'border-purple-400 dark:border-purple-500/70')
                                        : (Number(mat.grade) === 12
                                            ? 'border-amber-300 dark:border-amber-700/60'
                                            : 'border-purple-300 dark:border-purple-700/60')
                                    } ${gradeStyle.shadow} shadow-lg hover:shadow-2xl`
                                  : `border-2 ${
                                      isCompleted 
                                        ? 'border-teal-300 dark:border-teal-500/70' 
                                        : isOpened
                                          ? 'border-amber-300 dark:border-amber-500/70'
                                          : 'border-gray-100 dark:border-slate-700/50'
                                    } hover:shadow-xl`
                              }`}
                            >
                              {/* Top bar dengan warna kelas — advanced pakai shimmer */}
                              <div className={`h-1.5 bg-gradient-to-r ${gradeStyle.bg} relative overflow-hidden`}>
                                {isAdvanced && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-pulse"></div>
                                )}
                              </div>

                              {/* Shimmer overlay saat hover untuk advanced */}
                              {isAdvanced && (
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>
                              )}

                              {/* Badge TINGKAT LANJUT + Kelas untuk advanced, atau Kelas saja untuk basic */}
                              {isAdvanced ? (
                                <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
                                  <div className="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-white flex items-center gap-1 ring-1 ring-white/40">
                                    <Star className="w-2.5 h-2.5 fill-white" />
                                    TINGKAT LANJUT
                                  </div>
                                  <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ${gradeStyle.badgeBg}`}>
                                    Kelas {mat.grade}
                                  </div>
                                </div>
                              ) : (
                                <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 ${gradeStyle.badgeBg}`}>
                                  Kelas {mat.grade}
                                </div>
                              )}

                              {/* Status badge */}
                              {isCompleted && (
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10">
                                  <CheckCircle className="w-3 h-3" /> Selesai
                                </div>
                              )}
                              {!isCompleted && isOpened && (
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10">
                                  <BookMarked className="w-3 h-3" /> {percent}%
                                </div>
                              )}

                              <div className="p-4 pt-8">
                                <div className="flex items-start gap-2.5 mb-2">
                                  {/* Icon dengan warna kelas — advanced ada ring putih */}
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/card:scale-110 transition-transform bg-gradient-to-br ${gradeStyle.iconBg} ${
                                    isAdvanced 
                                      ? `${gradeStyle.shadow} shadow-lg ring-2 ring-white/40 dark:ring-white/20` 
                                      : `${gradeStyle.shadow} shadow-md`
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    ) : isAdvanced ? (
                                      <Star className="w-4 h-4 text-white fill-white" />
                                    ) : (
                                      <BookOpen className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm leading-tight transition-colors line-clamp-2 ${
                                      isAdvanced
                                        ? Number(mat.grade) === 12
                                          ? 'text-gray-900 dark:text-white group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400'
                                          : 'text-gray-900 dark:text-white group-hover/card:text-purple-600 dark:group-hover/card:text-purple-400'
                                        : 'text-gray-900 dark:text-white group-hover/card:text-teal-600 dark:group-hover/card:text-teal-400'
                                    }`}>
                                      {mat.title}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                                      {mat.topic} • {mat.level}
                                    </span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{descPreview}</p>

                                {isOpened && !isCompleted && (
                                  <div className="mb-2">
                                    <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 mb-1">
                                      <span className="flex items-center gap-1 font-medium">
                                        <TrendingUp className="w-2.5 h-2.5" /> Progress
                                      </span>
                                      <span className="font-bold">{percent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                                      <div 
                                        className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 h-1.5 rounded-full transition-all" 
                                        style={{ width: `${percent}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 15 menit
                                  </span>
                                  <span className={`font-bold ${
                                    isAdvanced
                                      ? Number(mat.grade) === 12
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-purple-600 dark:text-purple-400'
                                      : isCompleted 
                                        ? 'text-teal-600 dark:text-teal-400' 
                                        : isOpened 
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-teal-600 dark:text-teal-400'
                                  }`}>
                                    {isCompleted ? 'Baca Ulang →' : isOpened ? 'Lanjutkan →' : 'Baca →'}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Login Dulu Yuk!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
              Untuk membaca materi lengkap, kamu perlu <strong>masuk</strong> atau <strong>daftar</strong> dulu. Gratis, kok!
            </p>

            <div className="flex flex-col gap-3">
              <Link 
                to="/register"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/30 hover:shadow-xl"
              >
                Daftar Gratis Sekarang
              </Link>
              <Link 
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-white border-2 border-gray-200 dark:border-slate-600 hover:border-teal-600 font-semibold py-3.5 rounded-xl transition-all"
              >
                Sudah Punya Akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL JENJANG TERKUNCI */}
      {lockedModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setLockedModal(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-3xl"></div>
            
            <button 
              onClick={() => setLockedModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/30">
                <ShieldAlert className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Jenjang {lockedModal.level} Terkunci
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed text-sm">
                Untuk membuka Jenjang {lockedModal.level}, kamu harus menyelesaikan <strong>50% materi</strong> & <strong>50% kuis</strong> dari jenjang {userProfile?.level || 'kamu'} terlebih dahulu.
              </p>

              <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-4 mb-5 border border-gray-200/60 dark:border-slate-700/50 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Progress Materi
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{unlockStatus.materialsPercent}% / 50%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        unlockStatus.materialsPercent >= 50 
                          ? 'bg-gradient-to-r from-teal-400 to-cyan-500' 
                          : 'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, unlockStatus.materialsPercent)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> Progress Kuis
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{unlockStatus.quizzesPercent}% / 50%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        unlockStatus.quizzesPercent >= 50 
                          ? 'bg-gradient-to-r from-teal-400 to-cyan-500' 
                          : 'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, unlockStatus.quizzesPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    setLockedModal(null);
                    setViewMode('jenjang');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/30"
                >
                  <Target className="w-4 h-4" /> Lanjut Belajar Jenjang {userProfile?.level}
                </button>
                <button 
                  onClick={() => setLockedModal(null)}
                  className="w-full text-center py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Nanti saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialList;
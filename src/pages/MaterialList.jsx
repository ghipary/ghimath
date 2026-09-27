import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, BookOpen, Clock, Loader, Lock, X, CheckCircle, BookMarked, TrendingUp, Sparkles, ChevronDown, ChevronRight, FolderOpen, Folder, GraduationCap } from 'lucide-react';

const MaterialList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFolders, setOpenFolders] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);

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
        }
      } catch (error) {
        console.error('Gagal ambil materi:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // ⚡ GROUP MATERIALS PER JENJANG + KELAS
  const groupedMaterials = useMemo(() => {
    const groups = {};

    materials.forEach((mat) => {
      // Filter by search
      const descText = stripHtml(mat.description).toLowerCase();
      const matchSearch = !searchTerm ||
        mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descText.includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return;

      const key = `${mat.level}-${mat.grade}`; // misal: "SMP-7"
      if (!groups[key]) {
        groups[key] = {
          level: mat.level,
          grade: mat.grade,
          materials: [],
        };
      }
      groups[key].materials.push(mat);
    });

    // Sort materials dalam tiap folder by bab
    Object.values(groups).forEach((group) => {
      group.materials.sort((a, b) => {
        const getBabNumber = (title) => {
          if (!title) return 999;
          const match = title.match(/Bab\s+(\d+)/i);
          return match ? parseInt(match[1]) : 999;
        };
        return getBabNumber(a.title) - getBabNumber(b.title);
      });
    });

    // Sort folder: SMP dulu (7,8,9), lalu SMA (10,11,12)
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const levelOrder = { SMP: 1, SMA: 2 };
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return a.grade - b.grade;
    });

    return sortedGroups;
  }, [materials, searchTerm]);

  // ⚡ AUTO-OPEN folders saat search
  useEffect(() => {
    if (searchTerm) {
      const allOpen = {};
      groupedMaterials.forEach((group) => {
        allOpen[`${group.level}-${group.grade}`] = true;
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

  // ⚡ Hitung progress folder
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
        <p className="text-gray-600 dark:text-gray-400">
          {user ? 'Pilih folder kelas untuk melihat materi.' : 'Lihat-lihat dulu, login untuk membaca selengkapnya.'}
        </p>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        
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
              const key = `${group.level}-${group.grade}`;
              const isOpen = openFolders[key];
              const folderProgress = getFolderProgress(group);
              const isSMP = group.level === 'SMP';

              return (
                <div 
                  key={key}
                  className="card-elevated rounded-2xl overflow-hidden transition-all"
                >
                  {/* FOLDER HEADER (Clickable) */}
                  <button
                    onClick={() => toggleFolder(key)}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Folder Icon */}
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all ${
                        isSMP 
                          ? 'bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 shadow-teal-500/30' 
                          : 'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-purple-500/30'
                      }`}>
                        {isOpen ? (
                          <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        ) : (
                          <Folder className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        )}
                      </div>

                      {/* Folder Info */}
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isSMP 
                              ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400' 
                              : 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400'
                          }`}>
                            {group.level}
                          </span>
                          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                            Kelas {group.grade}
                          </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {group.materials.length} materi • {folderProgress.completed} selesai
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Progress + Chevron */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {folderProgress.percent > 0 && (
                        <div className="hidden sm:block text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {folderProgress.percent}%
                          </div>
                          <div className="w-20 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                isSMP 
                                  ? 'bg-gradient-to-r from-teal-400 to-cyan-500' 
                                  : 'bg-gradient-to-r from-violet-400 to-purple-500'
                              }`}
                              style={{ width: `${folderProgress.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </button>

                  {/* FOLDER CONTENT (Materi Grid) */}
                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-slate-700/50 p-4 sm:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.materials.map((mat) => {
                          const progress = progressMap[mat.id];
                          const isCompleted = progress?.completed === true;
                          const isOpened = !!progress;
                          const percent = isCompleted ? 100 : (progress?.percentage || 0);
                          const descPreview = stripHtml(mat.description);

                          return (
                            <Link 
                              key={mat.id} 
                              to={`/materi/${mat.id}`}
                              onClick={handleCardClick}
                              className={`group/card bg-white dark:bg-slate-800/50 rounded-xl border-2 transition-all overflow-hidden relative hover:-translate-y-1 hover:shadow-xl ${
                                isCompleted 
                                  ? 'border-teal-300 dark:border-teal-500/70' 
                                  : isOpened
                                    ? 'border-amber-300 dark:border-amber-500/70'
                                    : 'border-gray-100 dark:border-slate-700/50'
                              }`}
                            >
                              <div className={`h-1 ${
                                isCompleted 
                                  ? 'bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-600' 
                                  : isOpened
                                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500'
                                    : 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600'
                              }`}></div>

                              {isCompleted && (
                                <div className="absolute top-3 right-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10">
                                  <CheckCircle className="w-3 h-3" /> Selesai
                                </div>
                              )}
                              {!isCompleted && isOpened && (
                                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10">
                                  <BookMarked className="w-3 h-3" /> {percent}%
                                </div>
                              )}
                              {!user && (
                                <div className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-900/40 p-1 rounded-md z-10">
                                  <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                </div>
                              )}

                              <div className="p-4">
                                <div className="flex items-start gap-2.5 mb-2">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover/card:scale-110 transition-transform ${
                                    isCompleted 
                                      ? 'bg-gradient-to-br from-teal-400 to-cyan-600 shadow-teal-500/30' 
                                      : isOpened 
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/30'
                                        : 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-teal-500/30'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    ) : (
                                      <BookOpen className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight group-hover/card:text-teal-600 dark:group-hover/card:text-teal-400 transition-colors line-clamp-2">
                                      {mat.title}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                                      {mat.topic}
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
                                    isCompleted 
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
              Login Dulu Yuk! 🔒
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
    </div>
  );
};

export default MaterialList;
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, Filter, BookOpen, Clock, Loader, Lock, X, CheckCircle, BookMarked, TrendingUp, Sparkles } from 'lucide-react';

const MaterialList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Semua');
  const [selectedGrade, setSelectedGrade] = useState('Semua');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const topics = ['Semua', 'Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  const grades = ['Semua', 7, 8, 9, 10, 11, 12];

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

  // ⚡ SORT BY BAB NUMBER + KELAS
  const filteredMaterials = useMemo(() => {
    const filtered = materials.filter((mat) => {
      const descText = stripHtml(mat.description).toLowerCase();
      const matchSearch = mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          descText.includes(searchTerm.toLowerCase());
      const matchTopic = selectedTopic === 'Semua' || mat.topic === selectedTopic;
      const matchGrade = selectedGrade === 'Semua' || mat.grade === selectedGrade;
      return matchSearch && matchTopic && matchGrade;
    });

    // Sort: Kelas → Bab Number → Judul
    return filtered.sort((a, b) => {
      // 1. Sort by kelas
      if (a.grade !== b.grade) return a.grade - b.grade;

      // 2. Extract angka "Bab X" dari judul
      const getBabNumber = (title) => {
        if (!title) return 999;
        const match = title.match(/Bab\s+(\d+)/i);
        return match ? parseInt(match[1]) : 999;
      };

      const babA = getBabNumber(a.title);
      const babB = getBabNumber(b.title);

      if (babA !== babB) return babA - babB;

      // 3. Kalau sama, sort alphabetically
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [materials, searchTerm, selectedTopic, selectedGrade]);

  const handleCardClick = (e) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
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
          {user ? 'Pilih materi yang ingin kamu pelajari hari ini.' : 'Lihat-lihat dulu, login untuk membaca selengkapnya.'}
        </p>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        
        <div className="card-elevated rounded-2xl p-4 md:p-6 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" placeholder="Cari materi... (misal: Pythagoras)"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Topik
              </label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Kelas
              </label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value === 'Semua' ? 'Semua' : Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {grades.map((g) => <option key={g} value={g}>{g === 'Semua' ? 'Semua Kelas' : `Kelas ${g}`}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat materi...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20 card-elevated rounded-2xl">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Materi tidak ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah kata kunci atau filter pencarianmu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredMaterials.map((mat) => {
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
                  className={`group card-elevated rounded-2xl transition-all overflow-hidden relative hover:-translate-y-2 hover:shadow-2xl ${
                    isCompleted 
                      ? '!border-teal-300 dark:!border-teal-500/70' 
                      : isOpened
                        ? '!border-amber-300 dark:!border-amber-500/70'
                        : ''
                  }`}
                >
                  <div className={`h-1.5 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-600' 
                      : isOpened
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500'
                        : 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700'
                  }`}></div>

                  {isCompleted && (
                    <div className="absolute top-4 right-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                      <CheckCircle className="w-3.5 h-3.5" /> Selesai
                    </div>
                  )}
                  {!isCompleted && isOpened && (
                    <div className="absolute top-4 right-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                      <BookMarked className="w-3.5 h-3.5" /> {percent}%
                    </div>
                  )}
                  {!user && (
                    <div className="absolute top-4 right-3 bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-lg z-10 shadow-sm">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        mat.level === 'SMP' 
                          ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400' 
                          : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400'
                      }`}>
                        {mat.level}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas {mat.grade}</span>
                      <span className="text-xs font-medium text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{mat.topic}</span>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-teal-400 to-cyan-600 shadow-teal-500/30' 
                          : isOpened 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/30'
                            : mat.level === 'SMP' 
                              ? 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-teal-500/30' 
                              : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {mat.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{descPreview}</p>

                    {isOpened && !isCompleted && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1">
                          <span className="flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3" /> Progress
                          </span>
                          <span className="font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 h-2 rounded-full transition-all duration-500 shadow-sm" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15 menit</span>
                      <span className={`font-bold ${
                        isCompleted 
                          ? 'text-teal-600 dark:text-teal-400' 
                          : isOpened 
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-teal-600 dark:text-teal-400'
                      }`}>
                        {isCompleted ? 'Baca Ulang →' : isOpened ? 'Lanjutkan →' : 'Baca Materi →'}
                      </span>
                    </div>
                  </div>
                </Link>
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
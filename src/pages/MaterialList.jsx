import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, Filter, BookOpen, Clock, Loader, Lock, X, CheckCircle, BookMarked, TrendingUp } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'materials'), where('published', '==', true));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMaterials(data);

        if (user) {
          const progressQuery = query(
            collection(db, 'progress'),
            where('userId', '==', user.uid)
          );
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

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const matchSearch = mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mat.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTopic = selectedTopic === 'Semua' || mat.topic === selectedTopic;
      const matchGrade = selectedGrade === 'Semua' || mat.grade === selectedGrade;
      return matchSearch && matchTopic && matchGrade;
    });
  }, [materials, searchTerm, selectedTopic, selectedGrade]);

  const handleCardClick = (e) => {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Daftar Materi</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user ? 'Pilih materi yang ingin kamu pelajari hari ini.' : 'Lihat-lihat dulu, login untuk membaca selengkapnya.'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-4 md:p-6 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" placeholder="Cari materi... (misal: Pythagoras)"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Topik
              </label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Kelas
              </label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value === 'Semua' ? 'Semua' : Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
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
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Materi tidak ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah kata kunci atau filter pencarianmu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((mat) => {
              const progress = progressMap[mat.id];
              const isCompleted = progress?.completed === true;
              const isOpened = !!progress;
              const percent = isCompleted ? 100 : (progress?.percentage || 0);

              return (
                <Link 
                  key={mat.id} 
                  to={`/materi/${mat.id}`}
                  onClick={handleCardClick}
                  className={`group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 transition-all overflow-hidden relative ${
                    isCompleted 
                      ? 'border-teal-500 dark:border-teal-500 hover:shadow-lg hover:-translate-y-1' 
                      : isOpened
                        ? 'border-amber-400 dark:border-amber-500 hover:shadow-lg hover:-translate-y-1'
                        : 'border-gray-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 hover:border-teal-300'
                  }`}
                >
                  {/* BADGE */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-teal-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                      <CheckCircle className="w-3.5 h-3.5" /> Selesai
                    </div>
                  )}
                  {!isCompleted && isOpened && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
                      <BookMarked className="w-3.5 h-3.5" /> {percent}%
                    </div>
                  )}
                  {!user && (
                    <div className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg z-10">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mat.level === 'SMP' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {mat.level}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas {mat.grade}</span>
                      <span className="text-xs font-medium text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{mat.topic}</span>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-teal-100 dark:bg-teal-900/30' 
                          : isOpened 
                            ? 'bg-amber-50 dark:bg-amber-900/20'
                            : mat.level === 'SMP' 
                              ? 'bg-teal-50 dark:bg-teal-900/20' 
                              : 'bg-amber-50 dark:bg-amber-900/20'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <BookOpen className={`w-5 h-5 ${
                            isOpened 
                              ? 'text-amber-600 dark:text-amber-400'
                              : mat.level === 'SMP' 
                                ? 'text-teal-600 dark:text-teal-400' 
                                : 'text-amber-600 dark:text-amber-400'
                          }`} />
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight group-hover:text-teal-600 transition-colors">
                        {mat.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{mat.description}</p>

                    {/* PROGRESS BAR (kalau sudah dibuka) */}
                    {isOpened && !isCompleted && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Progress
                          </span>
                          <span className="font-bold">{percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="mb-4">
                        <div className="w-full bg-teal-100 dark:bg-teal-900/30 rounded-full h-1.5">
                          <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t dark:border-slate-800">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15 menit</span>
                      <span className={`font-medium ${
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

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-slide-up-delay-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-teal-600 dark:text-teal-400" />
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
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Daftar Gratis Sekarang
              </Link>
              <Link 
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-white border-2 border-gray-200 dark:border-slate-700 hover:border-teal-600 font-semibold py-3.5 rounded-xl transition-all"
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
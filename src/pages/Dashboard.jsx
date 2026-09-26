import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { BookOpen, Trophy, Clock, ChevronRight, PlayCircle, Loader, Target, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPublished: 0,
    completedCount: 0,
    inProgressCount: 0,
    progressPercent: 0,
  });
  const [lastMaterial, setLastMaterial] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }
        const uData = userSnap.data();
        setUserData(uData);

        if (!uData.level) {
          navigate('/onboarding');
          setLoading(false);
          return;
        }

        // Ambil semua materi published
        const matQuery = query(collection(db, 'materials'), where('published', '==', true));
        const matSnap = await getDocs(matQuery);
        const allMaterials = matSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const totalPublished = allMaterials.length;
        const publishedIds = new Set(allMaterials.map((m) => m.id));

        // Ambil progress user
        const progressQuery = query(
          collection(db, 'progress'),
          where('userId', '==', user.uid)
        );
        const progressSnap = await getDocs(progressQuery);
        const progressList = progressSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // ⚡ Filter: hanya hitung progress materi yang MASIH published
        const validProgress = progressList.filter((p) => publishedIds.has(p.materialId));
        const completedList = validProgress.filter((p) => p.completed === true);
        const inProgressList = validProgress.filter((p) => p.completed !== true && (p.readingSeconds || 0) > 0);
        const completedCount = completedList.length;
        const inProgressCount = inProgressList.length;

        // ⚡ Cap percent di 100
        let progressPercent = 0;
        if (totalPublished > 0) {
          progressPercent = Math.min(100, Math.round((completedCount / totalPublished) * 100));
        }

        setStats({
          totalPublished,
          completedCount,
          inProgressCount,
          progressPercent,
        });

        // Materi terakhir dibuka (dari progress valid)
        const sortedProgress = [...validProgress]
          .filter((p) => p.lastOpenedAt)
          .sort((a, b) => {
            const dateA = a.lastOpenedAt?.toDate?.() || 0;
            const dateB = b.lastOpenedAt?.toDate?.() || 0;
            return dateB - dateA;
          });

        if (sortedProgress.length > 0) {
          setLastMaterial(sortedProgress[0]);
        }

        // Rekomendasi: materi level sama, belum selesai
        const completedIds = new Set(completedList.map((p) => p.materialId));
        const recs = allMaterials
          .filter((m) => m.level === uData.level && !completedIds.has(m.id))
          .slice(0, 3);
        setRecommendations(recs);

        // Ambil quiz results user
        const quizQuery = query(
          collection(db, 'quizResults'),
          where('userId', '==', user.uid)
        );
        const quizSnap = await getDocs(quizQuery);
        const allResults = quizSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        allResults.sort((a, b) => {
          const dateA = a.completedAt?.toDate?.() || 0;
          const dateB = b.completedAt?.toDate?.() || 0;
          return dateA - dateB;
        });

        // Dedupe: 1 skor pertama per materi
        const seenMaterials = new Map();
        allResults.forEach((r) => {
          if (!seenMaterials.has(r.materialId)) {
            seenMaterials.set(r.materialId, r);
          }
        });
        setQuizHistory(Array.from(seenMaterials.values()));
      } catch (error) {
        console.error('Gagal ambil dashboard:', error);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const totalScore = quizHistory.reduce((sum, q) => sum + (q.score || 0), 0);
  const quizCount = quizHistory.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />

      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Halo, {userData?.name || 'Siswa'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Jenjang: <span className="font-semibold text-teal-600 dark:text-teal-400">{userData?.level || 'Belum dipilih'}</span>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 -mt-6">
        
        {/* PROGRESS CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border dark:border-slate-800">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Progress Belajarmu
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400">
              {stats.completedCount} dari {stats.totalPublished} materi selesai
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-4 mb-2">
            <div 
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${stats.progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {stats.inProgressCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <TrendingUp className="w-4 h-4" /> {stats.inProgressCount} sedang dibaca
                </span>
              )}
            </span>
            <span className="text-gray-500 dark:text-gray-400 font-semibold">
              {stats.progressPercent}% Selesai
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            {/* Lanjutkan Belajar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-6 border dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" /> Lanjutkan Belajar
              </h2>
              {lastMaterial ? (
                <Link 
                  to={`/materi/${lastMaterial.materialId}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      {lastMaterial.materialTitle || 'Materi'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {lastMaterial.materialLevel || '-'} Kelas {lastMaterial.materialGrade || '-'} • {lastMaterial.materialTopic || '-'}
                    </p>
                    {lastMaterial.percentage > 0 && !lastMaterial.completed && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, lastMaterial.percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </Link>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  Belum ada materi yang dibuka. Yuk mulai belajar!
                </p>
              )}
            </div>

            {/* Rekomendasi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-6 border dark:border-slate-800">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber-500" /> Rekomendasi Untukmu
              </h2>
              {recommendations.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recommendations.map((mat) => (
                    <Link 
                      key={mat.id}
                      to={`/materi/${mat.id}`}
                      className="flex items-center gap-3 p-2.5 sm:p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{mat.title}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{mat.level} {mat.grade}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  Semua materi sudah kamu baca. Hebat! 🎉
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Link 
              to="/leaderboard"
              className="block bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 sm:p-6 border dark:border-slate-800 hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                Total Skor Kuis
                <Trophy className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              </h2>
              <div className="text-center py-3 sm:py-4">
                <div className="text-4xl sm:text-5xl font-extrabold text-teal-600 dark:text-teal-400">
                  {totalScore}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                  dari {quizCount} kuis
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-semibold">
                  🏆 Lihat Ranking →
                </p>
              </div>
            </Link>
            
            <Link 
              to="/materi"
              className="block bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-lg p-4 sm:p-6 text-white hover:shadow-xl transition-all"
            >
              <Target className="w-7 h-7 sm:w-8 sm:h-8 mb-3" />
              <h3 className="font-bold text-base sm:text-lg mb-2">Mau uji kemampuan?</h3>
              <p className="text-teal-100 text-xs sm:text-sm mb-4">Pilih materi dan kerjakan kuisnya.</p>
              <div className="w-full bg-white text-teal-700 font-semibold py-2 rounded-lg text-center text-sm">
                Pilih Materi
              </div>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
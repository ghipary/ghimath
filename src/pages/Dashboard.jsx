import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StreakBadge from '../components/StreakBadge';
import WelcomeBubble from '../components/WelcomeBubble';
import FeedbackModal from '../components/FeedbackModal';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { BookOpen, Trophy, Clock, ChevronRight, PlayCircle, Loader, Target, TrendingUp, Sparkles, Zap, BarChart3, Flame, CheckCircle, Dices, MessageSquareHeart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Dashboard = () => {
  const { user, streakData, updateStreak } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState({
    totalPublished: 0,
    completedCount: 0,
    inProgressCount: 0,
    progressPercent: 0,
  });
  const [lastMaterial, setLastMaterial] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [dailyStatus, setDailyStatus] = useState(undefined);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        await updateStreak();

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

        try {
          const today = getTodayDate();
          const dailyRef = doc(db, 'dailyChallenges', `${user.uid}_${today}`);
          const dailySnap = await getDoc(dailyRef);
          const status = dailySnap.exists() ? dailySnap.data() : null;
          setDailyStatus(status);

          if (!status || status.completed !== true) {
            toast('🔥 Kuis Harian belum dikerjakan! Yuk kerjakan sekarang untuk menjaga streak-mu.', {
              icon: '⏰',
              duration: 6000,
              style: {
                borderRadius: '12px',
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #f59e0b',
              },
            });
          }
        } catch (dailyErr) {
          console.warn('Gagal cek kuis harian:', dailyErr.message);
          setDailyStatus(null);
        }

        const matQuery = query(collection(db, 'materials'), where('published', '==', true));
        const matSnap = await getDocs(matQuery);
        const allMaterials = matSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const totalPublished = allMaterials.length;
        const publishedIds = new Set(allMaterials.map((m) => m.id));

        const progressQuery = query(collection(db, 'progress'), where('userId', '==', user.uid));
        const progressSnap = await getDocs(progressQuery);
        const progressList = progressSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const validProgress = progressList.filter((p) => publishedIds.has(p.materialId));
        const completedList = validProgress.filter((p) => p.completed === true);
        const inProgressList = validProgress.filter((p) => p.completed !== true && (p.readingSeconds || 0) > 0);
        const completedCount = completedList.length;
        const inProgressCount = inProgressList.length;

        let progressPercent = 0;
        if (totalPublished > 0) {
          progressPercent = Math.min(100, Math.round((completedCount / totalPublished) * 100));
        }

        setStats({ totalPublished, completedCount, inProgressCount, progressPercent });

        const sortedProgress = [...validProgress]
          .filter((p) => p.lastOpenedAt)
          .sort((a, b) => {
            const dateA = a.lastOpenedAt?.toDate?.() || 0;
            const dateB = b.lastOpenedAt?.toDate?.() || 0;
            return dateB - dateA;
          });

        if (sortedProgress.length > 0) setLastMaterial(sortedProgress[0]);

        const completedIds = new Set(completedList.map((p) => p.materialId));
        const recs = allMaterials
          .filter((m) => m.level === uData.level && !completedIds.has(m.id))
          .slice(0, 3);
        setRecommendations(recs);

        const quizQuery = query(collection(db, 'quizResults'), where('userId', '==', user.uid));
        const quizSnap = await getDocs(quizQuery);
        const allResults = quizSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        allResults.sort((a, b) => {
          const dateA = a.completedAt?.toDate?.() || 0;
          const dateB = b.completedAt?.toDate?.() || 0;
          return dateA - dateB;
        });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const totalScore = quizHistory.reduce((sum, q) => sum + (q.score || 0), 0);
  const quizCount = quizHistory.length;

  const miniChartData = [...quizHistory]
    .slice(-5)
    .map((q, idx) => ({
      name: `K${idx + 1}`,
      fullTitle: q.materialTitle,
      skor: q.score || 0,
    }));

  const MiniTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700">
          <p className="text-xs font-bold text-gray-900 dark:text-white">{payload[0].payload.fullTitle}</p>
          <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">Skor: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const getTrend = () => {
    if (miniChartData.length < 2) return null;
    const first = miniChartData[0].skor;
    const last = miniChartData[miniChartData.length - 1].skor;
    const diff = last - first;
    return { diff, isUp: diff > 0, isFlat: diff === 0 };
  };
  const trend = getTrend();

  const dailyDone = dailyStatus?.completed === true;
  const dailyAvailable = dailyStatus !== undefined;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <WelcomeBubble dailyDone={dailyDone} />
     
      <div className="page-content max-w-5xl mx-auto px-3 sm:px-4 pt-8 sm:pt-12 pb-6">
        
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/50 dark:border-teal-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-teal-700 dark:text-teal-400 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Selamat datang kembali!
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Halo, {userData?.name || 'Siswa'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Jenjang: <span className="font-semibold text-teal-600 dark:text-teal-400">{userData?.level || 'Belum dipilih'}</span>
            {userData?.grade && <> • Kelas <span className="font-semibold text-teal-600 dark:text-teal-400">{userData.grade}</span></>}
          </p>
        </div>

        {dailyAvailable && (
          <Link
            to="/kuis-harian"
            className={`block relative overflow-hidden rounded-2xl p-5 sm:p-6 mb-4 transition-all group hover:-translate-y-1 shadow-xl hover:shadow-2xl ${
              dailyDone
                ? 'bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700'
                : 'bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500'
            }`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex items-center justify-between gap-4 text-white">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm border border-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
                  <Flame className="w-3 h-3" />
                  KUIS HARIAN
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1">
                  {dailyDone ? 'Sudah Dikerjakan Hari Ini! ✅' : 'Tantang Dirimu Hari Ini! 🎯'}
                </h3>
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                  {dailyDone 
                    ? 'Kembali besok untuk kuis baru dengan soal berbeda.'
                    : '5 soal acak dari materi jenjangmu. Bisa menambah nilai rata-rata kuis kamu!'}
                </p>
              </div>

              <div className="flex-shrink-0 text-center">
                {dailyDone ? (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center mb-1">
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold">{dailyStatus.score}</div>
                    <div className="text-[10px] text-white/80 font-semibold">SKOR</div>
                  </>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                    <Target className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        <Link
          to="/kuis-gabut"
          className="block relative overflow-hidden rounded-2xl p-5 sm:p-6 mb-6 transition-all group hover:-translate-y-1 shadow-xl hover:shadow-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex items-center justify-between gap-4 text-white">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm border border-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
                <Dices className="w-3 h-3" />
                KUIS ACAK (GAME GABUT)
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">
                Main Kuis Acak Sepuasnya! 🎲
              </h3>
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                Soal diambil acak dari seluruh materi. Bisa dikerjakan berkali-kali, skor tetap masuk rata-rata!
              </p>
            </div>

            <div className="flex-shrink-0 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all">
                <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>
          </div>
        </Link>

        {streakData.current > 0 && (
          <div className="mb-6 sm:mb-8">
            <StreakBadge current={streakData.current} longest={streakData.longest} />
          </div>
        )}

        <div className="card-elevated card-accent rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              Progress Belajarmu
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-400 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/40 dark:to-cyan-900/40 px-3 py-1.5 rounded-full border border-teal-200/50 dark:border-teal-800/50">
              {stats.completedCount} / {stats.totalPublished} materi
            </span>
          </div>
          <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700/50 dark:to-slate-700/30 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 h-4 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden" 
              style={{ width: `${stats.progressPercent}%` }}
            >
              {stats.progressPercent > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {stats.inProgressCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Zap className="w-4 h-4" /> {stats.inProgressCount} sedang dibaca
                </span>
              )}
            </span>
            <span className="text-gray-700 dark:text-gray-200 font-bold">
              {stats.progressPercent}% Selesai
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <div className="card-elevated rounded-2xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Lanjutkan Belajar
              </h2>
              {lastMaterial ? (
                <Link 
                  to={`/materi/${lastMaterial.materialId}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-teal-50/80 via-cyan-50/80 to-white dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/30 rounded-xl hover:from-teal-100 hover:to-cyan-100 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all border border-teal-200/60 dark:border-slate-700 shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                        <div className="w-full bg-white dark:bg-slate-800 rounded-full h-1.5 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full shadow-sm" 
                            style={{ width: `${Math.min(100, lastMaterial.percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                </Link>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  Belum ada materi yang dibuka. Yuk mulai belajar!
                </p>
              )}
            </div>

            {miniChartData.length >= 2 && (
              <div className="card-elevated rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Tren Skor Kuis
                  </h2>
                  
                  {trend && !trend.isFlat && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      trend.isUp 
                        ? 'bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-400' 
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-400'
                    }`}>
                      {trend.isUp ? '📈' : '📉'} {trend.isUp ? '+' : ''}{trend.diff} poin
                    </span>
                  )}
                  {trend && trend.isFlat && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                      ➡️ Stabil
                    </span>
                  )}
                </div>

                <div className="w-full h-32 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={miniChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<MiniTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="skor" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
                        activeDot={{ r: 6, fill: '#7c3aed' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <Link to="/profil" className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                  <BarChart3 className="w-3.5 h-3.5" /> Lihat detail lengkap di Profil →
                </Link>
              </div>
            )}

            <div className="card-elevated rounded-2xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 via-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                Rekomendasi Untukmu
              </h2>
              {recommendations.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {recommendations.map((mat) => (
                    <Link 
                      key={mat.id}
                      to={`/materi/${mat.id}`}
                      className="flex items-center gap-3 p-2.5 sm:p-3 bg-white/50 dark:bg-slate-800/30 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-slate-800 dark:hover:to-slate-700/50 rounded-lg transition-all border border-transparent hover:border-teal-200/60 dark:hover:border-teal-800/60"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex-shrink-0 shadow-sm"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{mat.title}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 font-medium">{mat.level} {mat.grade}</span>
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
              className="block relative overflow-hidden rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 text-white shadow-xl hover:shadow-2xl transition-all group hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-300/30 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center justify-between">
                  Total Skor Kuis
                  <Trophy className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </h2>
                <div className="text-center py-3 sm:py-4">
                  <div className="text-5xl sm:text-6xl font-extrabold drop-shadow-lg">
                    {totalScore}
                  </div>
                  <p className="text-xs sm:text-sm text-white/90 mt-2 font-medium">
                    dari {quizCount} kuis
                  </p>
                  <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg py-2 text-xs font-semibold border border-white/30">
                    🏆 Lihat Ranking →
                  </div>
                </div>
              </div>
            </Link>
            
            <Link 
              to="/materi"
              className="block relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl p-4 sm:p-6 text-white transition-all group hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 border border-white/30">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2">Mau uji kemampuan?</h3>
                <p className="text-cyan-50 text-xs sm:text-sm mb-4">Pilih materi dan kerjakan kuisnya.</p>
                <div className="w-full bg-white/95 backdrop-blur-sm text-teal-700 font-bold py-2.5 rounded-lg text-center text-sm shadow-lg group-hover:bg-white transition-all">
                  Pilih Materi →
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>

      {/* ⚡ Floating Button: Refleksi & Saran */}
      <button
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-bold px-4 py-3.5 rounded-2xl shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
        title="Kirim Refleksi & Saran"
      >
        <MessageSquareHeart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-sm">Refleksi</span>
      </button>

      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
};

export default Dashboard;
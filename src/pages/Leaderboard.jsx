import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Crown, Loader, ChevronLeft, Sparkles, School, GraduationCap, Flame, Sprout, Zap, Rocket, Gem, Clock, Target, BookMarked, TrendingUp, UserPlus, X, Brain, Info, Star, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const MIN_QUIZ = 3;

const getStreakConfig = (streak) => {
  if (streak >= 100) return { gradient: 'from-fuchsia-500 to-pink-500', Icon: Crown };
  if (streak >= 30) return { gradient: 'from-violet-500 to-purple-600', Icon: Gem };
  if (streak >= 14) return { gradient: 'from-amber-400 to-red-500', Icon: Rocket };
  if (streak >= 7) return { gradient: 'from-yellow-400 to-orange-500', Icon: Zap };
  if (streak >= 3) return { gradient: 'from-cyan-400 to-teal-500', Icon: Flame };
  return { gradient: 'from-teal-400 to-cyan-500', Icon: Sprout };
};

const StreakChip = ({ streak }) => {
  if (!streak || streak <= 0) return null;
  const config = getStreakConfig(streak);
  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${config.gradient} text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex-shrink-0`}>
      <config.Icon className="w-3 h-3" />
      {streak}
    </div>
  );
};

const fmtMinutes = (seconds) => {
  if (!seconds || seconds < 60) return '0 mnt';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}j ${rem}m` : `${h} jam`;
};

const getSmartScoreConfig = (score) => {
  if (score >= 85) return { 
    gradient: 'from-amber-400 via-yellow-500 to-orange-500', 
    glow: 'shadow-amber-500/50', 
    label: 'Genius', 
    Icon: Crown,
    badgeGradient: 'from-amber-400 to-orange-500'
  };
  if (score >= 70) return { 
    gradient: 'from-teal-400 via-cyan-500 to-teal-600', 
    glow: 'shadow-teal-500/50', 
    label: 'Pintar', 
    Icon: Sparkles,
    badgeGradient: 'from-teal-400 to-cyan-500'
  };
  if (score >= 55) return { 
    gradient: 'from-blue-400 via-indigo-500 to-blue-600', 
    glow: 'shadow-blue-500/50', 
    label: 'Baik', 
    Icon: Star,
    badgeGradient: 'from-blue-400 to-indigo-500'
  };
  if (score >= 40) return { 
    gradient: 'from-purple-400 via-fuchsia-500 to-purple-600', 
    glow: 'shadow-purple-500/50', 
    label: 'Cukup', 
    Icon: Award,
    badgeGradient: 'from-purple-400 to-fuchsia-500'
  };
  return { 
    gradient: 'from-slate-400 via-slate-500 to-slate-600', 
    glow: 'shadow-slate-500/50', 
    label: 'Pemula', 
    Icon: Sprout,
    badgeGradient: 'from-slate-400 to-slate-500'
  };
};

const Avatar = ({ photoURL, name, size = 'md', rank }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const rankBadge = rank ? (
    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-800 shadow-md ${
      rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
      rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
      rank === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-700 text-white' :
      'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
    }`}>
      {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
    </div>
  ) : null;

  const hasValidPhoto = photoURL && typeof photoURL === 'string' && photoURL.startsWith('data:image');

  return (
    <div className="relative flex-shrink-0">
      {hasValidPhoto ? (
        <img src={photoURL} alt={name} className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md`} />
      ) : null}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-700 ${hasValidPhoto ? 'hidden' : 'flex'}`}>
        <span className="font-bold text-white">{name?.[0]?.toUpperCase() || 'S'}</span>
      </div>
      {rankBadge}
    </div>
  );
};

const RankIconBox = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/50 border-2 border-white/30 relative">
        <Trophy className="w-6 h-6 text-white drop-shadow-lg" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-md border border-white/50">
          <Crown className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-11 h-11 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-400/50 border-2 border-white/30">
        <Medal className="w-5 h-5 text-white drop-shadow-md" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-11 h-11 bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50 border-2 border-white/30">
        <Award className="w-5 h-5 text-white drop-shadow-md" />
      </div>
    );
  }
  return null;
};

const SmartScoreIcon = ({ score, size = 'sm' }) => {
  const config = getSmartScoreConfig(score);
  const IconComponent = config.Icon;
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  
  return (
    <div className={`bg-gradient-to-br ${config.badgeGradient} rounded-lg p-1 shadow-md flex items-center justify-center`}>
      <IconComponent className={`${sizeClasses} text-white drop-shadow-sm`} />
    </div>
  );
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState({});
  const [allResults, setAllResults] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersSnap, resultsSnap, progressSnap, examsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'quizResults')),
          getDocs(collection(db, 'progress')),
          getDocs(collection(db, 'examResults')).catch(() => ({ docs: [] })),
        ]);

        const usersMap = {};
        usersSnap.forEach((d) => { usersMap[d.id] = d.data(); });

        setAllUsers(usersMap);
        setAllResults(resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllProgress(progressSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAllExams(examsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Gagal memuat leaderboard:', error);
      }
      setLoading(false);
    };
    if (user) fetchAll();
  }, [user]);

  const leaderboard = useMemo(() => {
    const userResults = {};
    allResults.forEach((r) => {
      if (!userResults[r.userId]) userResults[r.userId] = new Map();
      const existing = userResults[r.userId].get(r.materialId);
      if (!existing || (r.score || 0) > (existing.score || 0)) {
        userResults[r.userId].set(r.materialId, r);
      }
    });

    const userProgress = {};
    allProgress.forEach((p) => {
      if (!userProgress[p.userId]) userProgress[p.userId] = { readingSeconds: 0, completedCount: 0 };
      userProgress[p.userId].readingSeconds += (p.readingSeconds || 0);
      if (p.completed) userProgress[p.userId].completedCount += 1;
    });

    const userExams = {};
    allExams.forEach((e) => {
      if (!userExams[e.userId]) userExams[e.userId] = [];
      userExams[e.userId].push(e);
    });

    const list = [];
    Object.entries(allUsers).forEach(([uid, userInfo]) => {
      const map = userResults[uid] || new Map();
      const results = Array.from(map.values());
      const count = results.length;

      const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
      const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

      const exams = userExams[uid] || [];
      const avgExam = exams.length > 0 ? Math.round(exams.reduce((s, e) => s + (e.score || 0), 0) / exams.length) : 0;

      const validTimes = results.filter(r => r.bestTime && r.bestTime > 0);
      const fastestAvg = validTimes.length > 0 ? validTimes.reduce((s, r) => s + r.bestTime, 0) / validTimes.length : 0;

      const highestAvg = count > 0 ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / count) : 0;

      list.push({
        uid,
        name: userInfo.name || 'Siswa',
        email: userInfo.email || '',
        level: userInfo.level || '-',
        grade: userInfo.grade || null,
        school: userInfo.school || '',
        photoURL: userInfo.photoURL || '',
        currentStreak: userInfo.currentStreak || 0,
        avgScore,
        quizCount: count,
        avgExam,
        fastestAvg,
        highestAvg,
        readingSeconds: userProgress[uid]?.readingSeconds || 0,
        completedMaterials: userProgress[uid]?.completedCount || 0,
        qualified: count >= MIN_QUIZ,
        isAdmin: userInfo.role === 'admin',
      });
    });

    const qualifiedUsers = list.filter(u => u.qualified && !u.isAdmin);
    
    const maxMaterials = Math.max(...qualifiedUsers.map(u => u.completedMaterials), 1);
    const maxQuizCount = Math.max(...qualifiedUsers.map(u => u.quizCount), 1);
    const maxStreak = Math.max(...qualifiedUsers.map(u => u.currentStreak), 1);
    const maxReading = Math.max(...qualifiedUsers.map(u => u.readingSeconds), 1);
    
    const validFastestArr = qualifiedUsers.filter(u => u.fastestAvg > 0).map(u => u.fastestAvg);
    const minFastest = validFastestArr.length > 0 ? Math.min(...validFastestArr) : 1;
    const maxFastest = validFastestArr.length > 0 ? Math.max(...validFastestArr) : 1;

    list.forEach(item => {
      if (!item.qualified || item.isAdmin) {
        item.smartScore = 0;
        return;
      }
      
      const normMaterials = (item.completedMaterials / maxMaterials) * 100;
      const normQuizCount = (item.quizCount / maxQuizCount) * 100;
      const normStreak = (item.currentStreak / maxStreak) * 100;
      const normReading = (item.readingSeconds / maxReading) * 100;
      
      let normFastest = 0;
      if (item.fastestAvg > 0 && maxFastest !== minFastest) {
        normFastest = ((maxFastest - item.fastestAvg) / (maxFastest - minFastest)) * 100;
      } else if (item.fastestAvg > 0) {
        normFastest = 100;
      }
      
      const smartScore = 
        (item.avgScore * 0.35) +
        (item.avgExam * 0.20) +
        (normMaterials * 0.15) +
        (normQuizCount * 0.10) +
        (normStreak * 0.10) +
        (normFastest * 0.05) +
        (normReading * 0.05);
      
      item.smartScore = Math.round(smartScore);
    });

    list.sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? 1 : -1;
      if (a.qualified !== b.qualified) return b.qualified - a.qualified;
      if (b.smartScore !== a.smartScore) return b.smartScore - a.smartScore;
      return b.avgScore - a.avgScore;
    });

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [allResults, allProgress, allUsers, allExams]);

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const hasPodium = leaderboard.length >= 3 && leaderboard[0].qualified;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-4xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Peringkat siswa berdasarkan <strong className="text-amber-600 dark:text-amber-400">Smart Score</strong> (gabungan semua aspek).
            </p>
          </div>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-all flex-shrink-0"
          >
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </button>
        </div>

        {showInfo && (
          <div className="mt-4 card-elevated rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-800/50">
            <div className="flex items-start gap-3">
              <Brain className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  Cara Menghitung Smart Score
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Smart Score menggabungkan semua aspek performa belajarmu menjadi satu nilai (0-100).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <span className="font-bold text-amber-700 dark:text-amber-400">35%</span> <span className="text-gray-600 dark:text-gray-400">Nilai Kuis</span>
                  </div>
                  <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 px-3 py-2 rounded-lg border border-fuchsia-200 dark:border-fuchsia-800/50">
                    <span className="font-bold text-fuchsia-700 dark:text-fuchsia-400">20%</span> <span className="text-gray-600 dark:text-gray-400">Nilai Ujian</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">15%</span> <span className="text-gray-600 dark:text-gray-400">Materi Selesai</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <span className="font-bold text-blue-700 dark:text-blue-400">10%</span> <span className="text-gray-600 dark:text-gray-400">Jumlah Kuis</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/50">
                    <span className="font-bold text-red-700 dark:text-red-400">10%</span> <span className="text-gray-600 dark:text-gray-400">Day Streak</span>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                    <span className="font-bold text-rose-700 dark:text-rose-400">5%</span> <span className="text-gray-600 dark:text-gray-400">Kecepatan</span>
                  </div>
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 px-3 py-2 rounded-lg border border-cyan-200 dark:border-cyan-800/50">
                    <span className="font-bold text-cyan-700 dark:text-cyan-400">5%</span> <span className="text-gray-600 dark:text-gray-400">Waktu Baca</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 py-4 space-y-6 sm:space-y-8">
        {hasPodium && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 items-end">
            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-3">
                <Avatar photoURL={top2.photoURL} name={top2.name} size="lg" />
              </div>
              <RankIconBox rank={2} />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full mt-2">{top2.name}</p>
              <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${getSmartScoreConfig(top2.smartScore).gradient} text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md mt-1`}>
                <Brain className="w-3 h-3" /> {top2.smartScore}
              </div>
              <div className="mt-1"><StreakChip streak={top2.currentStreak} /></div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <Avatar photoURL={top1.photoURL} name={top1.name} size="xl" />
              </div>
              <RankIconBox rank={1} />
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white text-center truncate w-full mt-2">{top1.name}</p>
              <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${getSmartScoreConfig(top1.smartScore).gradient} text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg mt-1`}>
                <Brain className="w-4 h-4" /> {top1.smartScore}
              </div>
              <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${getSmartScoreConfig(top1.smartScore).badgeGradient} text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm mt-1.5`}>
                <SmartScoreIcon score={top1.smartScore} size="sm" />
                <span>{getSmartScoreConfig(top1.smartScore).label}</span>
              </div>
              <div className="mt-1"><StreakChip streak={top1.currentStreak} /></div>
            </div>

            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-3">
                <Avatar photoURL={top3.photoURL} name={top3.name} size="lg" />
              </div>
              <RankIconBox rank={3} />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full mt-2">{top3.name}</p>
              <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${getSmartScoreConfig(top3.smartScore).gradient} text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md mt-1`}>
                <Brain className="w-3 h-3" /> {top3.smartScore}
              </div>
              <div className="mt-1"><StreakChip streak={top3.currentStreak} /></div>
            </div>
          </div>
        )}

        <div className="card-elevated rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-amber-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Peringkat Lengkap
              </h3>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> {leaderboard.length} siswa • Klik untuk detail
              </span>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Belum Ada Peserta</h3>
              <p className="text-gray-500 text-sm">Jadilah yang pertama dengan mengerjakan kuis!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {leaderboard.map((item) => {
                const isMe = item.uid === user.uid;
                const isEmpty = item.quizCount === 0;
                const smartConfig = getSmartScoreConfig(item.smartScore);
                
                return (
                  <div
                    key={item.uid}
                    onClick={() => setSelectedUser(item)}
                    className={`w-full text-left flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 transition-colors cursor-pointer ${
                      isMe
                        ? 'bg-gradient-to-r from-teal-50 via-cyan-50 to-transparent dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-transparent border-l-4 border-teal-500'
                        : !item.qualified && !item.isAdmin
                          ? 'opacity-60 hover:opacity-100'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Avatar photoURL={item.photoURL} name={item.name} size="md" rank={item.qualified && !item.isAdmin && item.rank <= 3 ? item.rank : null} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold truncate text-sm sm:text-base ${isMe ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                            {item.name} 
                            {isMe && <span className="text-xs bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 rounded ml-1">Kamu</span>}
                            {item.isAdmin && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded ml-1">⚙️ Admin</span>}
                          </p>
                          <StreakChip streak={item.currentStreak} />
                          {isEmpty && !item.isAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Belum mulai</span>
                          )}
                          {!isEmpty && !item.qualified && !item.isAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                              {item.quizCount}/{MIN_QUIZ} kuis
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                          {item.level !== '-' && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {item.level}{item.grade ? ` • Kelas ${item.grade}` : ''}
                            </span>
                          )}
                          {item.school && (
                            <>
                              <span className="text-gray-300 dark:text-slate-600">•</span>
                              <span className="flex items-center gap-1 truncate">
                                <School className="w-3 h-3" />
                                <span className="truncate max-w-[120px] sm:max-w-none">{item.school}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2 py-1 rounded-md text-[10px] font-bold">
                          <Trophy className="w-3 h-3" /> Kuis: {item.avgScore}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-500/30 px-2 py-1 rounded-md text-[10px] font-bold">
                          <Target className="w-3 h-3" /> Ujian: {item.avgExam}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2 py-1 rounded-md text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> {fmtMinutes(item.readingSeconds)}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded-md text-[10px] font-bold">
                          <BookMarked className="w-3 h-3" /> {item.completedMaterials} Materi
                        </span>
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 px-2 py-1 rounded-md text-[10px] font-bold">
                          <Zap className="w-3 h-3" /> {fmtMinutes(item.fastestAvg)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-slate-700 gap-2">
                      <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${smartConfig.gradient} text-white pl-1.5 pr-3 py-1.5 rounded-xl font-bold shadow-md`}>
                        <div className="bg-white/25 rounded-lg p-1 flex items-center justify-center backdrop-blur-sm">
                          <smartConfig.Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-lg">{item.smartScore}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="relative w-full max-w-xs overflow-hidden shadow-2xl rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute -inset-1 bg-gradient-to-br ${getSmartScoreConfig(selectedUser.smartScore).gradient} rounded-3xl blur-md opacity-60`}></div>
            
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <div className={`relative bg-gradient-to-br ${getSmartScoreConfig(selectedUser.smartScore).gradient} px-4 pt-5 pb-12 text-center`}>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-0.5">
                    Peringkat #{selectedUser.rank}
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/30">
                    <SmartScoreIcon score={selectedUser.smartScore} size="sm" />
                    <span className="text-xs font-bold">{getSmartScoreConfig(selectedUser.smartScore).label}</span>
                  </div>
                </div>
              </div>

              <div className="relative -mt-10 flex justify-center">
                <div className="p-1 bg-white dark:bg-slate-900 rounded-full shadow-lg">
                  <Avatar photoURL={selectedUser.photoURL} name={selectedUser.name} size="lg" />
                </div>
              </div>

              <div className="px-4 pt-2 text-center">
                <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedUser.name}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <GraduationCap className="w-3 h-3" />
                  {selectedUser.level}{selectedUser.grade ? ` • Kelas ${selectedUser.grade}` : ''}
                </div>
                {selectedUser.school && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{selectedUser.school}</p>
                )}
                {selectedUser.currentStreak > 0 && (
                  <div className="flex justify-center mt-2">
                    <StreakChip streak={selectedUser.currentStreak} />
                  </div>
                )}
              </div>

              <div className="px-4 pt-3">
                <div className={`relative text-center bg-gradient-to-br ${getSmartScoreConfig(selectedUser.smartScore).gradient} rounded-2xl py-3 shadow-lg ${getSmartScoreConfig(selectedUser.smartScore).glow}`}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-white/25 rounded-lg p-1.5 backdrop-blur-sm">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-extrabold text-white leading-none">{selectedUser.smartScore}</span>
                  </div>
                  <p className="text-[9px] text-white/90 font-bold uppercase tracking-wider mt-1.5">Smart Score</p>
                </div>
              </div>

              <div className="p-4 grid grid-cols-3 gap-2">
                <div className="text-center bg-amber-50 dark:bg-amber-500/10 rounded-xl py-2.5 px-1 border border-amber-200 dark:border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{selectedUser.avgScore}</p>
                  <p className="text-[8px] text-amber-600/80 dark:text-amber-400/80 font-semibold leading-tight">Rata Kuis</p>
                </div>
                <div className="text-center bg-fuchsia-50 dark:bg-fuchsia-500/10 rounded-xl py-2.5 px-1 border border-fuchsia-200 dark:border-fuchsia-500/30">
                  <Target className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-fuchsia-700 dark:text-fuchsia-300">{selectedUser.avgExam}</p>
                  <p className="text-[8px] text-fuchsia-600/80 dark:text-fuchsia-400/80 font-semibold leading-tight">Rata Ujian</p>
                </div>
                <div className="text-center bg-rose-50 dark:bg-rose-500/10 rounded-xl py-2.5 px-1 border border-rose-200 dark:border-rose-500/30">
                  <Zap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{fmtMinutes(selectedUser.fastestAvg).split(' ')[0]}</p>
                  <p className="text-[8px] text-rose-600/80 dark:text-rose-400/80 font-semibold leading-tight">Tercepat</p>
                </div>
                <div className="text-center bg-blue-50 dark:bg-blue-500/10 rounded-xl py-2.5 px-1 border border-blue-200 dark:border-blue-500/30">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{fmtMinutes(selectedUser.readingSeconds).split(' ')[0]}</p>
                  <p className="text-[8px] text-blue-600/80 dark:text-blue-400/80 font-semibold leading-tight">Waktu Baca</p>
                </div>
                <div className="text-center bg-emerald-50 dark:bg-emerald-500/10 rounded-xl py-2.5 px-1 border border-emerald-200 dark:border-emerald-500/30">
                  <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{selectedUser.completedMaterials}</p>
                  <p className="text-[8px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold leading-tight">Materi</p>
                </div>
                <div className="text-center bg-violet-50 dark:bg-violet-500/10 rounded-xl py-2.5 px-1 border border-violet-200 dark:border-violet-500/30">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-violet-700 dark:text-violet-300">{selectedUser.highestAvg}</p>
                  <p className="text-[8px] text-violet-600/80 dark:text-violet-400/80 font-semibold leading-tight">Tertinggi</p>
                </div>
              </div>

              <div className="pb-4 text-center">
                <p className="text-[9px] text-gray-400 dark:text-gray-500">
                  Total <span className="font-bold text-gray-600 dark:text-gray-300">{selectedUser.quizCount}</span> kuis dikerjakan
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
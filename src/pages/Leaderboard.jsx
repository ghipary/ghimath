import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Crown, Loader, ChevronLeft, Sparkles, School, GraduationCap, Flame, Sprout, Zap, Rocket, Gem, Clock, BookOpen, Target, Layers, Award, BookMarked, TrendingUp, UserPlus, BarChart3 } from 'lucide-react';
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
        <img 
          src={photoURL} 
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className={`${sizeClasses[size]} bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-700 ${hasValidPhoto ? 'hidden' : 'flex'}`}
      >
        <span className="font-bold text-white">{name?.[0]?.toUpperCase() || 'S'}</span>
      </div>
      {rankBadge}
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

  // ⚡ HITUNG LEADERBOARD UMUM (GABUNGAN SEMUA STATISTIK)
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

      // Fastest Avg (rata-rata waktu tercepat dari semua kuis, exclude ujian)
      const validTimes = results.filter(r => r.bestTime && r.bestTime > 0);
      const fastestAvg = validTimes.length > 0 ? validTimes.reduce((s, r) => s + r.bestTime, 0) / validTimes.length : 0;

      // Highest Avg (rata-rata nilai tertinggi)
      const highestAvg = count > 0 ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / count) : 0;

      list.push({
        uid,
        name: userInfo.name || 'Siswa',
        level: userInfo.level || '-',
        grade: userInfo.grade || null,
        school: userInfo.school || '',
        photoURL: userInfo.photoURL || '',
        currentStreak: userInfo.currentStreak || 0,
        longestStreak: userInfo.longestStreak || 0,
        avgScore,
        quizCount: count,
        totalScore,
        avgExam,
        fastestAvg,
        highestAvg,
        readingSeconds: userProgress[uid]?.readingSeconds || 0,
        completedMaterials: userProgress[uid]?.completedCount || 0,
        qualified: count >= MIN_QUIZ,
        isAdmin: userInfo.role === 'admin',
      });
    });

    list.sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? 1 : -1;
      if (a.qualified !== b.qualified) return b.qualified - a.qualified;
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return b.quizCount - a.quizCount;
    });

    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [allResults, allProgress, allUsers, allExams]);

  const myRank = useMemo(() => leaderboard.find((i) => i.uid === user.uid), [leaderboard, user]);

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
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Peringkat semua siswa berdasarkan rata-rata nilai (min. {MIN_QUIZ} kuis)
            </p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 py-4 space-y-6 sm:space-y-8">
        {/* Kartu Peringkat Kamu */}
        {myRank && (
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-slate-700/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center gap-4 flex-wrap">
              <Avatar photoURL={myRank.photoURL} name={myRank.name} size="lg" />

              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm mb-1 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Peringkat Kamu
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-1">#{myRank.rank}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-slate-300 text-xs sm:text-sm">
                    Rata-rata Kuis: <span className="font-bold text-white">{myRank.avgScore}</span> • Ujian: <span className="font-bold text-white">{myRank.avgExam}</span>
                  </p>
                  <StreakChip streak={myRank.currentStreak} />
                  {myRank.isAdmin && (
                    <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      ⚙️ Admin
                    </span>
                  )}
                </div>
                {!myRank.qualified && !myRank.isAdmin && (
                  <p className="text-[11px] text-amber-200 mt-1 font-semibold bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block">
                    Kerjakan {MIN_QUIZ - myRank.quizCount} kuis lagi untuk masuk ranking
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-5xl sm:text-6xl font-extrabold drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">{myRank.avgScore}</div>
                <p className="text-slate-300 text-xs font-medium">rata-rata</p>
              </div>
            </div>
            
            {/* ⚡ KOTAK STATISTIK BERWARNA (MEWAH & KONTRAS) */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
              <div className="text-center bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl p-3 shadow-lg shadow-fuchsia-500/30 border border-fuchsia-400/30 hover:-translate-y-1 transition-transform">
                <Target className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myRank.avgExam}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Rata-rata Ujian</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-3 shadow-lg shadow-blue-500/30 border border-blue-400/30 hover:-translate-y-1 transition-transform">
                <Clock className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{fmtMinutes(myRank.readingSeconds)}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Waktu Baca</p>
              </div>
              <div className="text-center bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl p-3 shadow-lg shadow-emerald-500/30 border border-emerald-400/30 hover:-translate-y-1 transition-transform">
                <BookMarked className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myRank.completedMaterials} materi</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Selesai</p>
              </div>
              <div className="text-center bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-3 shadow-lg shadow-amber-500/30 border border-amber-400/30 hover:-translate-y-1 transition-transform">
                <Trophy className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myRank.quizCount} kuis</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Dikerjakan</p>
              </div>
              <div className="text-center bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-3 shadow-lg shadow-rose-500/30 border border-rose-400/30 hover:-translate-y-1 transition-transform">
                <Zap className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{fmtMinutes(myRank.fastestAvg)}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Tercepat (Avg)</p>
              </div>
              <div className="text-center bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-3 shadow-lg shadow-violet-500/30 border border-violet-400/30 hover:-translate-y-1 transition-transform">
                <TrendingUp className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myRank.highestAvg}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Nilai Tertinggi</p>
              </div>
              <div className="text-center bg-gradient-to-br from-cyan-400 to-sky-500 rounded-xl p-3 shadow-lg shadow-cyan-500/30 border border-cyan-400/30 col-span-2 hover:-translate-y-1 transition-transform">
                <BarChart3 className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myRank.quizCount} Kuis & {myRank.completedMaterials} Materi</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Progres Terbanyak</p>
              </div>
            </div>
          </div>
        )}

        {/* Podium Top 3 */}
        {hasPodium && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 items-end">
            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-2">
                <Avatar photoURL={top2.photoURL} name={top2.name} size="lg" />
              </div>
              <Medal className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full">{top2.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{top2.avgScore} ⭐</p>
              <div className="mt-1"><StreakChip streak={top2.currentStreak} /></div>
            </div>

            <div className="flex flex-col items-center">
              <Crown className="w-8 h-8 text-amber-500 mb-1 animate-bounce" />
              <div className="relative mb-2">
                <Avatar photoURL={top1.photoURL} name={top1.name} size="xl" rank={1} />
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white text-center truncate w-full">{top1.name}</p>
              <p className="text-xs md:text-sm font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                {top1.avgScore} ⭐
              </p>
              <div className="mt-1"><StreakChip streak={top1.currentStreak} /></div>
            </div>

            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-2">
                <Avatar photoURL={top3.photoURL} name={top3.name} size="lg" />
              </div>
              <Medal className="w-5 h-5 text-orange-400 mb-1" />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full">{top3.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{top3.avgScore} ⭐</p>
              <div className="mt-1"><StreakChip streak={top3.currentStreak} /></div>
            </div>
          </div>
        )}

        {/* Daftar Lengkap */}
        <div className="card-elevated rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-amber-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Peringkat Lengkap
              </h3>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> {leaderboard.length} siswa
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
                return (
                  <div
                    key={item.uid}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 transition-colors ${
                      isMe
                        ? 'bg-gradient-to-r from-teal-50 via-cyan-50 to-transparent dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-transparent border-l-4 border-teal-500'
                        : !item.qualified && !item.isAdmin
                          ? 'opacity-60'
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
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              Belum mulai
                            </span>
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
                                <span className="truncate max-w-[120px] sm:max-w-none" title={item.school}>{item.school}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full sm:w-auto mt-2 sm:mt-0">
                      {/* ⚡ BADGE STATISTIK BERWARNA UNTUK SEMUA USER */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                          <Target className="w-3 h-3" /> {item.avgExam} Ujian
                        </span>
                        <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                          <Clock className="w-3 h-3" /> {fmtMinutes(item.readingSeconds)}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                          <BookMarked className="w-3 h-3" /> {item.completedMaterials} Materi
                        </span>
                        <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                          <Trophy className="w-3 h-3" /> {item.quizCount} Kuis
                        </span>
                        <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                          <Zap className="w-3 h-3" /> {fmtMinutes(item.fastestAvg)} (Avg)
                        </span>
                        <span className="inline-flex items-center gap-1 bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                          <TrendingUp className="w-3 h-3" /> {item.highestAvg} (Max)
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-slate-700">
                      <p className={`font-bold text-lg ${isMe ? 'text-teal-600 dark:text-teal-400' : isEmpty ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {item.avgScore}
                      </p>
                      <p className="text-[10px] text-gray-400">rata-rata kuis</p>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                        {item.avgExam} ujian
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
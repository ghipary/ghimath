import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Crown, Loader, ChevronLeft, Sparkles, School, GraduationCap, Flame, Sprout, Zap, Rocket, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';

// ⚡ Helper: warna + ICON per level streak
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

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersMap = {};
        usersSnap.forEach((d) => {
          usersMap[d.id] = d.data();
        });

        const resultsSnap = await getDocs(collection(db, 'quizResults'));
        const allResults = resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const userResults = {};
        allResults.forEach((r) => {
          if (!userResults[r.userId]) userResults[r.userId] = [];
          userResults[r.userId].push(r);
        });

        const totals = {};
        const counts = {};
        Object.entries(userResults).forEach(([uid, results]) => {
          const seenMaterials = new Map();
          results
            .sort((a, b) => (a.completedAt?.toDate() || 0) - (b.completedAt?.toDate() || 0))
            .forEach((r) => {
              if (!seenMaterials.has(r.materialId)) {
                seenMaterials.set(r.materialId, r);
              }
            });
          const deduped = Array.from(seenMaterials.values());
          totals[uid] = deduped.reduce((sum, r) => sum + (r.score || 0), 0);
          counts[uid] = deduped.length;
        });

        const list = Object.entries(totals)
          .map(([uid, total]) => ({
            uid,
            name: usersMap[uid]?.name || 'Siswa',
            level: usersMap[uid]?.level || '-',
            grade: usersMap[uid]?.grade || null,
            school: usersMap[uid]?.school || '',
            photoURL: usersMap[uid]?.photoURL || '',
            currentStreak: usersMap[uid]?.currentStreak || 0,
            longestStreak: usersMap[uid]?.longestStreak || 0,
            totalScore: total,
            quizCount: counts[uid],
          }))
          .sort((a, b) => b.totalScore - a.totalScore);

        const rankedList = list.map((item, idx) => ({ ...item, rank: idx + 1 }));
        setLeaderboard(rankedList);

        const found = rankedList.find((item) => item.uid === user.uid);
        setMyRank(found || null);
      } catch (error) {
        console.error('Gagal memuat leaderboard:', error);
      }
      setLoading(false);
    };
    if (user) fetchLeaderboard();
  }, [user]);

  // Avatar reusable
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
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Peringkat siswa berdasarkan total skor kuis</p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 py-4 space-y-6 sm:space-y-8">
        
        {/* Kartu Peringkat Kamu */}
        {myRank && (
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-teal-500 via-cyan-600 to-teal-700 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center gap-4 flex-wrap">
              
              <Avatar photoURL={myRank.photoURL} name={myRank.name} size="lg" />

              <div className="flex-1 min-w-0">
                <p className="text-teal-100 text-sm mb-1 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4" /> Peringkat Kamu
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-1">#{myRank.rank}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-teal-100 text-xs sm:text-sm">
                    Total Skor: <span className="font-bold text-white">{myRank.totalScore}</span> • {myRank.quizCount} kuis
                  </p>
                  <StreakChip streak={myRank.currentStreak} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl sm:text-6xl font-extrabold drop-shadow-lg">{myRank.totalScore}</div>
                <p className="text-teal-100 text-xs font-medium">poin</p>
              </div>
            </div>
          </div>
        )}

        {/* Podium Top 3 */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 items-end">
            
            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-2">
                <Avatar photoURL={top2.photoURL} name={top2.name} size="lg" />
              </div>
              <Medal className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full">
                {top2.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{top2.totalScore}</p>
              <div className="mt-1">
                <StreakChip streak={top2.currentStreak} />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <Crown className="w-8 h-8 text-amber-500 mb-1 animate-bounce" />
              <div className="relative mb-2">
                <Avatar photoURL={top1.photoURL} name={top1.name} size="xl" rank={1} />
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white text-center truncate w-full">
                {top1.name}
              </p>
              <p className="text-xs md:text-sm font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                {top1.totalScore} ⭐
              </p>
              <div className="mt-1">
                <StreakChip streak={top1.currentStreak} />
              </div>
            </div>

            <div className="flex flex-col items-center pt-8">
              <div className="relative mb-2">
                <Avatar photoURL={top3.photoURL} name={top3.name} size="lg" />
              </div>
              <Medal className="w-5 h-5 text-orange-400 mb-1" />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full">
                {top3.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{top3.totalScore}</p>
              <div className="mt-1">
                <StreakChip streak={top3.currentStreak} />
              </div>
            </div>

          </div>
        )}

        {/* Daftar Lengkap */}
        <div className="card-elevated rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-amber-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Peringkat Lengkap
            </h3>
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
                
                return (
                  <div 
                    key={item.uid}
                    className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 transition-colors ${
                      isMe 
                        ? 'bg-gradient-to-r from-teal-50 via-cyan-50 to-transparent dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-transparent border-l-4 border-teal-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <Avatar photoURL={item.photoURL} name={item.name} size="md" rank={item.rank <= 3 ? item.rank : null} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold truncate text-sm sm:text-base ${isMe ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                          {item.name} {isMe && <span className="text-xs bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 rounded ml-1">Kamu</span>}
                        </p>
                        <StreakChip streak={item.currentStreak} />
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
                              <span className="truncate max-w-[150px] sm:max-w-none" title={item.school}>{item.school}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {item.quizCount} kuis dikerjakan
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${isMe ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                        {item.totalScore}
                      </p>
                      <p className="text-xs text-gray-400">poin</p>
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
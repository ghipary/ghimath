import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Crown, Loader, User, ChevronLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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

        // Kelompokkan per user
        const userResults = {};
        allResults.forEach((r) => {
          if (!userResults[r.userId]) userResults[r.userId] = [];
          userResults[r.userId].push(r);
        });

        // Dedupe: 1 skor pertama per materi
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />

      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Peringkat siswa berdasarkan total skor kuis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {myRank && (
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm mb-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Peringkat Kamu
                </p>
                <h2 className="text-3xl font-bold mb-1">#{myRank.rank}</h2>
                <p className="text-teal-100 text-sm">
                  Total Skor: <span className="font-bold text-white">{myRank.totalScore}</span> • {myRank.quizCount} kuis
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-extrabold">{myRank.totalScore}</div>
                <p className="text-teal-100 text-xs">poin</p>
              </div>
            </div>
          </div>
        )}

        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            
            <div className="flex flex-col items-center pt-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2 border-4 border-gray-300 dark:border-slate-600">
                <User className="w-7 h-7 text-gray-500 dark:text-gray-400" />
              </div>
              <Medal className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full">
                {top2.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{top2.totalScore}</p>
            </div>

            <div className="flex flex-col items-center">
              <Crown className="w-7 h-7 text-amber-500 mb-1 animate-bounce" />
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-2 border-4 border-amber-300 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white text-center truncate w-full">
                {top1.name}
              </p>
              <p className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
                {top1.totalScore} ⭐
              </p>
            </div>

            <div className="flex flex-col items-center pt-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-2 border-4 border-orange-300 dark:border-orange-700">
                <User className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <Medal className="w-5 h-5 text-orange-400 mb-1" />
              <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white text-center truncate w-full">
                {top3.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{top3.totalScore}</p>
            </div>

          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-gray-900 dark:text-white">Peringkat Lengkap</h3>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Belum Ada Peserta</h3>
              <p className="text-gray-500 text-sm">Jadilah yang pertama dengan mengerjakan kuis!</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-800">
              {leaderboard.map((item) => {
                const isMe = item.uid === user.uid;
                return (
                  <div 
                    key={item.uid}
                    className={`flex items-center gap-4 px-6 py-4 ${isMe ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'} transition-colors`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                      item.rank === 1 ? 'bg-amber-400 text-white' :
                      item.rank === 2 ? 'bg-gray-300 text-white' :
                      item.rank === 3 ? 'bg-orange-400 text-white' :
                      'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isMe ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                        {item.name} {isMe && <span className="text-xs">(Kamu)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Jenjang {item.level} • {item.quizCount} kuis dikerjakan
                      </p>
                    </div>
                    <div className="text-right">
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
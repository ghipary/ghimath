import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Users, BookOpen, Trophy, Loader, AlertTriangle, Award, Target, Flame, ChevronRight, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matSnap, quizSnap, userSnap, qSnap] = await Promise.all([
          getDocs(collection(db, 'materials')),
          getDocs(collection(db, 'quizResults')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'quizQuestions')),
        ]);

        setMaterials(matSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setQuizResults(quizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setQuizQuestions(qSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Gagal load data:', err);
        toast.error('Gagal memuat data statistik');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // ⚡ STATISTIK OVERVIEW
  const overview = useMemo(() => {
    const totalAttempts = quizResults.length;
    const avgScore = totalAttempts > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score || 0), 0) / totalAttempts)
      : 0;

    // Siswa aktif hari ini
    const today = new Date().toDateString();
    const activeToday = new Set(
      quizResults
        .filter((r) => r.completedAt?.toDate?.()?.toDateString() === today)
        .map((r) => r.userId)
    ).size;

    // Materi paling populer (paling sering dikerjakan)
    const matCount = {};
    quizResults.forEach((r) => {
      matCount[r.materialId] = (matCount[r.materialId] || 0) + 1;
    });
    const popularId = Object.entries(matCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const popularMaterial = materials.find((m) => m.id === popularId);

    // Total siswa unik yang pernah kerjakan kuis
    const uniqueStudents = new Set(quizResults.map((r) => r.userId)).size;

    return {
      totalAttempts,
      avgScore,
      activeToday,
      popularMaterial,
      popularCount: popularId ? matCount[popularId] : 0,
      uniqueStudents,
    };
  }, [quizResults, materials]);

  // ⚡ STATISTIK PER MATERI
  const materialStats = useMemo(() => {
    const stats = {};
    
    // Init
    materials.forEach((m) => {
      stats[m.id] = {
        id: m.id,
        title: m.title,
        level: m.level,
        grade: m.grade,
        topic: m.topic,
        attempts: 0,
        totalScore: 0,
        avgScore: 0,
        uniqueStudents: new Set(),
      };
    });

    // Aggregate
    quizResults.forEach((r) => {
      if (stats[r.materialId]) {
        stats[r.materialId].attempts += 1;
        stats[r.materialId].totalScore += r.score || 0;
        stats[r.materialId].uniqueStudents.add(r.userId);
      }
    });

    // Calculate avg
    Object.values(stats).forEach((s) => {
      s.avgScore = s.attempts > 0 ? Math.round(s.totalScore / s.attempts) : 0;
      s.uniqueCount = s.uniqueStudents.size;
    });

    // Sort by avgScore asc (yang tersulit dulu)
    return Object.values(stats)
      .filter((s) => s.attempts > 0)
      .sort((a, b) => a.avgScore - b.avgScore);
  }, [materials, quizResults]);

  // ⚡ TOP 5 SOAL TERSulit (Soal yang paling sering salah)
  const hardestQuestions = useMemo(() => {
    // Ambil semua soal dengan materialId
    // Kita butuh info per soal: berapa kali muncul, berapa kali salah
    // Karena kita tidak simpan jawaban per soal, kita pakai proxy:
    // - Hitung rata-rata skor per materi
    // - Soal dari materi dengan avgScore rendah = lebih sulit
    
    // Simple approach: Group soal by material, sort by material avgScore
    const questionsByMaterial = {};
    quizQuestions.forEach((q) => {
      if (!questionsByMaterial[q.materialId]) {
        questionsByMaterial[q.materialId] = [];
      }
      questionsByMaterial[q.materialId].push(q);
    });

    // Ambil 5 soal dari 5 materi tersulit (avgScore rendah)
    const result = [];
    materialStats.slice(0, 5).forEach((mat) => {
      const questions = questionsByMaterial[mat.id] || [];
      if (questions.length > 0) {
        result.push({
          materialTitle: mat.title,
          materialLevel: mat.level,
          materialGrade: mat.grade,
          avgScore: mat.avgScore,
          question: questions[0].question,
          correctAnswer: questions[0].options[questions[0].correctAnswer],
          topic: mat.topic,
        });
      }
    });

    return result;
  }, [materialStats, quizQuestions]);

  // ⚡ TOP 5 SISWA AKTIF
  const topStudents = useMemo(() => {
    const studentStats = {};
    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u; });

    quizResults.forEach((r) => {
      if (!studentStats[r.userId]) {
        studentStats[r.userId] = {
          userId: r.userId,
          attempts: 0,
          totalScore: 0,
          name: userMap[r.userId]?.name || 'Siswa',
          level: userMap[r.userId]?.level || '-',
          grade: userMap[r.userId]?.grade || null,
          school: userMap[r.userId]?.school || '',
          photoURL: userMap[r.userId]?.photoURL || '',
          streak: userMap[r.userId]?.currentStreak || 0,
        };
      }
      studentStats[r.userId].attempts += 1;
      studentStats[r.userId].totalScore += r.score || 0;
    });

    return Object.values(studentStats)
      .map((s) => ({ ...s, avgScore: s.attempts > 0 ? Math.round(s.totalScore / s.attempts) : 0 }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5);
  }, [quizResults, users]);

  // ⚡ Difficulty rating
  const getDifficulty = (avgScore) => {
    if (avgScore >= 80) return { label: 'Mudah', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30', icon: TrendingUp };
    if (avgScore >= 65) return { label: 'Sedang', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: Target };
    if (avgScore >= 50) return { label: 'Sulit', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle };
    return { label: 'Sangat Sulit', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle };
  };

  // ⚡ Chart data untuk distribusi skor
  const chartData = useMemo(() => {
    return materialStats.slice(0, 8).map((m) => ({
      name: m.title.length > 20 ? m.title.substring(0, 20) + '...' : m.title,
      fullTitle: m.title,
      avgScore: m.avgScore,
      attempts: m.attempts,
    }));
  }, [materialStats]);

  const getBarColor = (value) => {
    if (value >= 80) return '#14b8a6';
    if (value >= 65) return '#06b6d4';
    if (value >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700">
          <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">{payload[0].payload.fullTitle}</p>
          <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">Rata-rata: {payload[0].value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{payload[0].payload.attempts} attempts</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      {/* Header */}
      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Admin
        </button>
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-violet-200/60 dark:border-violet-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-400 mb-3 shadow-sm">
          <BarChart3 className="w-3.5 h-3.5" /> STATISTIK
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Statistik Kelas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Insight data untuk keputusan pengajaran</p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4 space-y-6">
        
        {/* ⚡ OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-400/15 to-cyan-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-teal-500/30">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.totalAttempts}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Total Kuis Dikerjakan</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/15 to-orange-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/30">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.avgScore}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Rata-rata Skor</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-400/15 to-purple-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.uniqueStudents}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Siswa Aktif</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400/15 to-rose-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-pink-500/30">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overview.activeToday}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Aktif Hari Ini</div>
            </div>
          </div>
        </div>

        {/* ⚡ CHART: Rata-rata per Materi */}
        {chartData.length > 0 && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Rata-rata Skor per Materi</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Materi dengan skor rendah = perlu perhatian</p>
              </div>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.08)' }} />
                  <Bar dataKey="avgScore" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={getBarColor(entry.avgScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span> ≥ 80 (Mudah)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500"></span> 65-79 (Sedang)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> 50-64 (Sulit)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> &lt; 50 (Sangat Sulit)
              </span>
            </div>
          </div>
        )}

        {/* ⚡ 2 KOLOM: Tabel Materi + Top Siswa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tabel Materi (2/3 lebar) */}
          <div className="lg:col-span-2 card-elevated rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-violet-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-500" />
                Statistik per Materi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Diurutkan dari yang paling sulit</p>
            </div>

            {materialStats.length === 0 ? (
              <div className="text-center py-12 px-4">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Belum ada data kuis</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Materi</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Percobaan</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Rata-rata</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase text-center">Tingkat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700/50">
                    {materialStats.map((mat) => {
                      const diff = getDifficulty(mat.avgScore);
                      const DiffIcon = diff.icon;
                      return (
                        <tr key={mat.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                              {mat.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {mat.level} • Kelas {mat.grade} • {mat.topic}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{mat.attempts}</span>
                            <div className="text-[10px] text-gray-400">{mat.uniqueCount} siswa</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-base font-bold ${
                              mat.avgScore >= 80 ? 'text-teal-600 dark:text-teal-400' :
                              mat.avgScore >= 65 ? 'text-cyan-600 dark:text-cyan-400' :
                              mat.avgScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {mat.avgScore}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${diff.bg} ${diff.color}`}>
                              <DiffIcon className="w-3 h-3" />
                              {diff.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Siswa (1/3 lebar) */}
          <div className="card-elevated rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-amber-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Siswa Teraktif
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paling banyak kerjakan kuis</p>
            </div>

            {topStudents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Belum ada data</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {topStudents.map((stu, idx) => {
                  const rankColors = [
                    'from-amber-400 to-orange-500',
                    'from-slate-300 to-slate-500',
                    'from-orange-400 to-amber-700',
                    'from-teal-400 to-cyan-600',
                    'from-violet-500 to-purple-600',
                  ];
                  const hasValidPhoto = stu.photoURL && stu.photoURL.startsWith('data:image');
                  
                  return (
                    <div key={stu.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {hasValidPhoto ? (
                          <img 
                            src={stu.photoURL} 
                            alt={stu.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${rankColors[idx] || 'from-gray-400 to-gray-500'} shadow-md border-2 border-white dark:border-slate-700 ${hasValidPhoto ? 'hidden' : 'flex'}`}>
                          <span className="text-xs font-bold text-white">{stu.name?.[0]?.toUpperCase() || 'S'}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-gray-200 dark:border-slate-700">
                          {idx + 1}
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {stu.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {stu.level}{stu.grade ? ` Kelas ${stu.grade}` : ''}
                        </p>
                      </div>
                      
                      {/* Attempts */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-bold text-teal-600 dark:text-teal-400">{stu.attempts}</div>
                        <div className="text-[10px] text-gray-400">kuis</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ⚡ TOP 5 SOAL TERSulit */}
        {hardestQuestions.length > 0 && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Soal Perlu Perhatian</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Materi dengan skor terendah — mungkin perlu dijelaskan ulang</p>
              </div>
            </div>

            <div className="space-y-3">
              {hardestQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-red-50/50 to-pink-50/30 dark:from-red-900/10 dark:to-pink-900/5 border border-red-100 dark:border-red-900/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          Rata-rata: {q.avgScore}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          {q.materialLevel} • Kelas {q.materialGrade}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Materi:</span>
                        <span className="text-xs font-medium text-teal-600 dark:text-teal-400">{q.materialTitle}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminAnalytics;
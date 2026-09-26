import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Users, Search, Loader, Mail, GraduationCap, Trophy, X, BookOpen, Calendar, Settings, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        const resultsSnap = await getDocs(collection(db, 'quizResults'));
        setQuizResults(resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) { toast.error('Gagal memuat data user'); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const dedupeQuizzes = (results) => {
    const sorted = [...results].sort((a, b) => (a.completedAt?.toDate() || 0) - (b.completedAt?.toDate() || 0));
    const seenMaterials = new Map();
    sorted.forEach((r) => { if (!seenMaterials.has(r.materialId)) seenMaterials.set(r.materialId, r); });
    return Array.from(seenMaterials.values());
  };

  const usersWithStats = users.map((u) => {
    const rawQuizzes = quizResults.filter((q) => q.userId === u.uid);
    const dedupedQuizzes = dedupeQuizzes(rawQuizzes);
    const totalScore = dedupedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    const avgScore = dedupedQuizzes.length > 0 ? Math.round(totalScore / dedupedQuizzes.length) : 0;
    return {
      ...u,
      quizCount: dedupedQuizzes.length,
      totalScore, avgScore,
      quizzes: [...dedupedQuizzes].sort((a, b) => (b.completedAt?.toDate() || 0) - (a.completedAt?.toDate() || 0)),
    };
  });

  const filtered = usersWithStats.filter((u) => {
    const s = searchTerm.toLowerCase();
    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });
  const sorted = [...filtered].sort((a, b) => b.totalScore - a.totalScore);

  const fmtDate = (ts) => {
    if (!ts) return '-';
    try {
      return new Date(ts.toDate()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '-'; }
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

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Admin
        </button>
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-violet-200/60 dark:border-violet-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-400 mb-3 shadow-sm">
          <Users className="w-3.5 h-3.5" /> DAFTAR USER
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Daftar User
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total: {users.length} siswa terdaftar</p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        <div className="card-elevated rounded-2xl p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" placeholder="Cari user berdasarkan nama atau email..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="card-elevated rounded-2xl text-center py-20 px-4">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Tidak ada user ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="card-elevated rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-violet-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Jenjang</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Kuis</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Total Skor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Rata-rata</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {sorted.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{u.name || 'Siswa'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {u.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.level ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            u.level === 'SMP' 
                              ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400' 
                              : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400'
                          }`}>
                            {u.level}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Belum dipilih</span>
                        )}
                        {u.role === 'admin' && (
                          <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">⚙️ Admin</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">{u.quizCount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">{u.totalScore}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{u.quizCount > 0 ? u.avgScore : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all shadow-md">
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL USER */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedUser(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedUser.name || 'Siswa'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {selectedUser.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Jenjang: <strong className="text-teal-600 dark:text-teal-400">{selectedUser.level || 'Belum dipilih'}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 rounded-xl p-4 text-center border border-teal-200/60 dark:border-teal-800/50">
                <BookOpen className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.quizCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kuis</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl p-4 text-center border border-amber-200/60 dark:border-amber-800/50">
                <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.totalScore}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Skor</div>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 rounded-xl p-4 text-center border border-violet-200/60 dark:border-violet-800/50">
                <Sparkles className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.quizCount > 0 ? selectedUser.avgScore : '-'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rata-rata</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" /> Riwayat Kuis
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Nilai pertama per materi (permanen)</p>
              {selectedUser.quizzes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 dark:bg-slate-900/50 rounded-xl">Belum ada kuis yang dikerjakan.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedUser.quizzes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-3 p-3 bg-gradient-to-br from-gray-50 to-teal-50/30 dark:from-slate-900/50 dark:to-slate-900/30 rounded-lg border border-gray-100 dark:border-slate-700/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{q.materialTitle || 'Materi'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(q.completedAt)} • {q.correctCount}/{q.totalQuestions} benar</p>
                      </div>
                      <div className={`text-lg font-bold flex-shrink-0 ${q.score >= 70 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {q.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
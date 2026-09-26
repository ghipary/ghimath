import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, Users, Search, Loader, Mail, GraduationCap, Trophy, X, BookOpen, Calendar } from 'lucide-react';
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
        const usersData = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        setUsers(usersData);

        const resultsSnap = await getDocs(collection(db, 'quizResults'));
        const resultsData = resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuizResults(resultsData);
      } catch (error) {
        console.error('Gagal ambil data:', error);
        toast.error('Gagal memuat data user');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Helper: dedupe quiz results — hanya attempt PERTAMA per materi
  const dedupeQuizzes = (results) => {
    // Sort ascending by completedAt (paling lama dulu)
    const sorted = [...results].sort((a, b) => {
      const dateA = a.completedAt?.toDate() || 0;
      const dateB = b.completedAt?.toDate() || 0;
      return dateA - dateB;
    });
    const seenMaterials = new Map();
    sorted.forEach((r) => {
      if (!seenMaterials.has(r.materialId)) {
        seenMaterials.set(r.materialId, r);
      }
    });
    return Array.from(seenMaterials.values());
  };

  // Gabungkan user dengan statistik kuis (DEDUPED)
  const usersWithStats = users.map((u) => {
    const rawQuizzes = quizResults.filter((q) => q.userId === u.uid);
    const dedupedQuizzes = dedupeQuizzes(rawQuizzes);
    const totalScore = dedupedQuizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    const avgScore = dedupedQuizzes.length > 0 ? Math.round(totalScore / dedupedQuizzes.length) : 0;
    return {
      ...u,
      quizCount: dedupedQuizzes.length,
      totalScore,
      avgScore,
      // Untuk modal: tampilkan dari yang paling baru
      quizzes: [...dedupedQuizzes].sort((a, b) => {
        const dateA = a.completedAt?.toDate() || 0;
        const dateB = b.completedAt?.toDate() || 0;
        return dateB - dateA;
      }),
    };
  });

  const filtered = usersWithStats.filter((u) => {
    const s = searchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s)
    );
  });

  const sorted = [...filtered].sort((a, b) => b.totalScore - a.totalScore);

  const fmtDate = (ts) => {
    if (!ts) return '-';
    try {
      return new Date(ts.toDate()).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />

      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate('/admin')} 
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Admin
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Daftar User</h1>
              <p className="text-gray-600 dark:text-gray-400">Total: {users.length} siswa terdaftar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Cari user berdasarkan nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Tidak ada user ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Jenjang</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Kuis</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Total Skor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Rata-rata</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {sorted.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
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
                              ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
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
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        {u.quizCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                          {u.totalScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                        {u.quizCount > 0 ? u.avgScore : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 text-xs font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                        >
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
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {selectedUser.name || 'Siswa'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {selectedUser.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Jenjang: <strong className="text-teal-600 dark:text-teal-400">{selectedUser.level || 'Belum dipilih'}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                <BookOpen className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.quizCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Kuis</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.totalScore}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Skor</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                <Trophy className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedUser.quizCount > 0 ? selectedUser.avgScore : '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" /> Riwayat Kuis
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Nilai pertama per materi (permanen)
              </p>
              {selectedUser.quizzes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  Belum ada kuis yang dikerjakan.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedUser.quizzes.map((q) => (
                    <div 
                      key={q.id}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {q.materialTitle || 'Materi'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {fmtDate(q.completedAt)} • {q.correctCount}/{q.totalQuestions} benar
                        </p>
                      </div>
                      <div className={`text-lg font-bold flex-shrink-0 ${
                        q.score >= 70 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
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
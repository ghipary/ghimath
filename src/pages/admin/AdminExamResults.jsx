import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Loader, Users, Trophy, Award, Clock, CheckCircle, XCircle, Download, Search, Timer, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | passed | failed

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exam
        const examSnap = await getDoc(doc(db, 'examPackages', examId));
        if (!examSnap.exists()) { navigate('/admin/ujian'); return; }
        setExam({ id: examSnap.id, ...examSnap.data() });

        // Fetch results
        const rq = query(collection(db, 'examResults'), where('examId', '==', examId));
        const rSnap = await getDocs(rq);
        const resultData = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        resultData.sort((a, b) => (b.score || 0) - (a.score || 0));
        setResults(resultData);

        // Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersMap = {};
        usersSnap.forEach((d) => { usersMap[d.id] = d.data(); });
        setUsers(usersMap);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat data');
      }
      setLoading(false);
    };
    fetchData();
  }, [examId, navigate]);

  const getScoreColor = (score, passing) => {
    if (score >= passing) return 'text-teal-600 dark:text-teal-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredResults = results.filter((r) => {
    const u = users[r.userId];
    const name = (u?.name || '').toLowerCase();
    const school = (u?.school || '').toLowerCase();
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || name.includes(s) || school.includes(s);
    const passed = r.score >= (exam?.passingScore || 70);
    const matchFilter =
      filterStatus === 'all' ||
      (filterStatus === 'passed' && passed) ||
      (filterStatus === 'failed' && !passed);
    return matchSearch && matchFilter;
  });

  // Stats
  const totalAttempts = results.length;
  const passingScore = exam?.passingScore || 70;
  const passedCount = results.filter((r) => r.score >= passingScore).length;
  const failedCount = totalAttempts - passedCount;
  const avgScore = totalAttempts > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / totalAttempts)
    : 0;
  const highestScore = totalAttempts > 0 ? Math.max(...results.map((r) => r.score || 0)) : 0;
  const lowestScore = totalAttempts > 0 ? Math.min(...results.map((r) => r.score || 0)) : 0;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredResults.length === 0) return toast.error('Tidak ada data');

    const headers = ['Nama', 'Email', 'Sekolah', 'Jenjang', 'Kelas', 'Skor', 'Benar', 'Total Soal', 'Status', 'Auto Submit', 'Tanggal'];
    const rows = filteredResults.map((r) => {
      const u = users[r.userId] || {};
      const passed = r.score >= passingScore;
      return [
        u.name || '-',
        u.email || '-',
        u.school || '-',
        u.level || '-',
        u.grade || '-',
        r.score || 0,
        r.correctCount || 0,
        r.totalQuestions || 0,
        passed ? 'LULUS' : 'BELUM',
        r.autoSubmitted ? 'Ya' : 'Tidak',
        r.submittedAt ? new Date(r.submittedAt.toDate()).toLocaleString('id-ID') : '-',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nilai-${exam?.title || 'Ujian'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV berhasil didownload!');
  };

  if (loading) {
    return <div className="page-bg flex items-center justify-center min-h-screen"><Loader className="w-10 h-10 text-teal-600 animate-spin" /></div>;
  }

  if (!exam) return null;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <button onClick={() => navigate('/admin/ujian')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelola Ujian
        </button>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/30">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent truncate">
              {exam.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Passing: <strong>{passingScore}</strong> • {totalAttempts} siswa mengerjakan
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30"
          >
            <Download className="w-5 h-5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated rounded-2xl p-4 text-center">
            <Users className="w-5 h-5 text-teal-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{totalAttempts}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Peserta</p>
          </div>
          <div className="card-elevated rounded-2xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{avgScore}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Rata-rata</p>
          </div>
          <div className="card-elevated rounded-2xl p-4 text-center">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{highestScore}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Tertinggi</p>
          </div>
          <div className="card-elevated rounded-2xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-teal-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{passedCount}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Lulus ({failedCount} gagal)</p>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="card-elevated rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau sekolah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-xl font-semibold text-sm ${filterStatus === 'all' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'}`}
              >
                Semua ({totalAttempts})
              </button>
              <button
                onClick={() => setFilterStatus('passed')}
                className={`px-4 py-2 rounded-xl font-semibold text-sm ${filterStatus === 'passed' ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'}`}
              >
                Lulus ({passedCount})
              </button>
              <button
                onClick={() => setFilterStatus('failed')}
                className={`px-4 py-2 rounded-xl font-semibold text-sm ${filterStatus === 'failed' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'}`}
              >
                Gagal ({failedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredResults.length === 0 ? (
          <div className="card-elevated rounded-2xl text-center py-16 px-4">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
              {results.length === 0 ? 'Belum ada yang mengerjakan' : 'Tidak ada hasil cocok'}
            </h3>
            <p className="text-gray-500 text-sm">
              {results.length === 0 
                ? 'Siswa belum ada yang mengerjakan ujian ini.' 
                : 'Coba ubah filter atau keyword pencarian.'}
            </p>
          </div>
        ) : (
          <div className="card-elevated rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-gray-50 to-teal-50/30 dark:from-slate-800 dark:to-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300">Nama</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hidden md:table-cell">Sekolah</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 text-center">Skor</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 text-center hidden sm:table-cell">Benar</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 text-right hidden lg:table-cell">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {filteredResults.map((r, idx) => {
                    const u = users[r.userId] || {};
                    const passed = r.score >= passingScore;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                                {(u.name || 'S')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {u.name || 'Siswa'}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate hidden sm:block">{u.email || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          <div className="truncate max-w-[180px]">
                            {u.school || '-'}
                            <span className="text-gray-400"> • {u.level || '-'} {u.grade || ''}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-extrabold ${getScoreColor(r.score, passingScore)}`}>
                            {r.score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {r.correctCount || 0}/{r.totalQuestions || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {passed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
                              <CheckCircle className="w-3 h-3" /> LULUS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                              <XCircle className="w-3 h-3" /> BELUM
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500 hidden lg:table-cell">
                          {r.submittedAt ? new Date(r.submittedAt.toDate()).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          {r.autoSubmitted && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                              ⏰ Auto
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExamResults;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getCountFromServer, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { BookOpen, Users, FileText, PlusCircle, Settings, ListChecks, Loader, ChevronRight, Trophy, Sparkles, Upload, BarChart3, FileCheck } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    materials: 0,
    totalQuizzes: 0,
    users: 0,
    quizResults: 0,
    formulas: 0,
    exams: 0,
    loading: true,
  });
  const [recentMaterials, setRecentMaterials] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const matSnap = await getCountFromServer(collection(db, 'materials'));
        const userSnap = await getCountFromServer(collection(db, 'users'));
        const quizSnap = await getCountFromServer(collection(db, 'quizResults'));
        
        let formulasCount = 0;
        try {
          const formulaSnap = await getCountFromServer(collection(db, 'formulas'));
          formulasCount = formulaSnap.data().count;
        } catch (e) { console.warn('Collection formulas belum ada'); }

        let examsCount = 0;
        try {
          const examSnap = await getCountFromServer(collection(db, 'examPackages'));
          examsCount = examSnap.data().count;
        } catch (e) { console.warn('Collection examPackages belum ada'); }

        // Asumsi 1 materi = 1 kuis. Jadi total kuis = total materi.
        // Jika ada collection 'quizzes' terpisah, silakan ganti logic di bawah ini.
        const totalQuizzes = matSnap.data().count; 

        setStats({
          materials: matSnap.data().count,
          totalQuizzes: totalQuizzes,
          users: userSnap.data().count,
          quizResults: quizSnap.data().count,
          formulas: formulasCount,
          exams: examsCount,
          loading: false,
        });

        const recentQuery = query(
          collection(db, 'materials'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const recentSnap = await getDocs(recentQuery);
        const recent = recentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecentMaterials(recent);
      } catch (error) {
        console.error('Gagal ambil statistik:', error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-4 shadow-sm">
          <Settings className="w-3.5 h-3.5" />
          ADMIN PANEL
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
          Dashboard Admin
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola materi dan pantau aktivitas GhiMath.</p>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        
        {/* Statistik — 6 kartu */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 sm:mb-8">
          
          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-teal-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '…' : stats.materials}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Materi</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                <ListChecks className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '…' : stats.totalQuizzes}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Total Kuis</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-400/20 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '…' : stats.users}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">User</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '…' : stats.quizResults}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Kuis Dikerjakan</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-fuchsia-400/20 to-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-fuchsia-500 via-purple-600 to-violet-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-fuchsia-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '…' : stats.formulas}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Rumus</div>
            </div>
          </div>

          <div className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400/20 to-orange-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.loading ? '…' : stats.exams}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Ujian</div>
            </div>
          </div>
        </div>

        {/* CTA Upload */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl mb-6 sm:mb-8 p-6 sm:p-8 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              CEPAT & MUDAH
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Upload Materi Baru</h2>
            <p className="text-cyan-50 mb-6 text-sm sm:text-base">Tambahkan materi baru yang akan langsung muncul di halaman siswa.</p>
            <Link 
              to="/admin/materi/baru" 
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              <Upload className="w-5 h-5" /> Upload Sekarang
            </Link>
          </div>
        </div>

        {/* Menu Cepat — 6 kartu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          
          <Link to="/admin/materi" className="card-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Kelola Materi</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Edit, hapus, publish.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link to="/admin/materi" className="card-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <ListChecks className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Kelola Soal</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Atur soal kuis.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link to="/admin/users" className="card-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Daftar User</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lihat semua siswa.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link to="/admin/analytics" className="card-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Statistik</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Insight & analytics.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link to="/admin/rumus" className="card-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-4 group border-2 border-fuchsia-200/60 dark:border-fuchsia-800/40">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 via-purple-600 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Bank Rumus</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI auto-extract rumus.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link to="/admin/ujian" className="card-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-4 group border-2 border-red-200/60 dark:border-red-800/40">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Kelola Ujian</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Paket TKA/PAS.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Materi Terbaru */}
        {!stats.loading && recentMaterials.length > 0 && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              Materi Terbaru
            </h3>
            <div className="space-y-2">
              {recentMaterials.map((mat) => (
                <Link 
                  key={mat.id} 
                  to={`/admin/materi/${mat.id}/edit`}
                  className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/30 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-slate-800 dark:hover:to-slate-700/50 rounded-lg transition-all border border-transparent hover:border-teal-200/60 dark:hover:border-teal-800/60"
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    mat.published 
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-500 shadow-sm shadow-teal-500/50' 
                      : 'bg-gray-300 dark:bg-slate-600'
                  }`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate font-medium">{mat.title}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {mat.level} • Kelas {mat.grade}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
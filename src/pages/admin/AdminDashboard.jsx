import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getCountFromServer, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { BookOpen, Users, FileText, PlusCircle, Settings, ListChecks, Loader, ChevronRight, Trophy } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    materials: 0,
    users: 0,
    quizResults: 0,
    loading: true,
  });
  const [recentMaterials, setRecentMaterials] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const matSnap = await getCountFromServer(collection(db, 'materials'));
        const userSnap = await getCountFromServer(collection(db, 'users'));
        const quizSnap = await getCountFromServer(collection(db, 'quizResults'));

        setStats({
          materials: matSnap.data().count,
          users: userSnap.data().count,
          quizResults: quizSnap.data().count,
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />

      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-semibold mb-2">
            <Settings className="w-4 h-4" /> ADMIN PANEL
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Dashboard Admin</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Kelola materi dan pantau aktivitas GhiMath.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        
        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border dark:border-slate-800">
            <BookOpen className="w-8 h-8 text-teal-600 mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.loading ? '…' : stats.materials}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Materi</div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border dark:border-slate-800">
            <Users className="w-8 h-8 text-amber-600 mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.loading ? '…' : stats.users}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total User</div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border dark:border-slate-800 col-span-2 md:col-span-1">
            <FileText className="w-8 h-8 text-teal-600 mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.loading ? '…' : stats.quizResults}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Kuis Dikerjakan</div>
          </div>
        </div>

        {/* CTA Upload */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-lg p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Upload Materi Baru</h2>
            <p className="text-teal-100 mb-6">Tambahkan materi baru yang akan langsung muncul di halaman siswa.</p>
            <Link 
              to="/admin/materi/baru" 
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors shadow-lg hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5" /> Upload Sekarang
            </Link>
          </div>
        </div>

        {/* Menu Cepat - 3 KARTU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/admin/materi" 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800 hover:shadow-md hover:border-teal-500 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white">Kelola Materi</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Edit, hapus, publish materi.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </Link>

          <Link 
            to="/admin/materi" 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800 hover:shadow-md hover:border-amber-500 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <ListChecks className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white">Kelola Soal Kuis</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lihat & kelola soal kuis.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </Link>

          {/* KARTU BARU - Daftar User */}
          <Link 
            to="/admin/users" 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800 hover:shadow-md hover:border-teal-500 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white">Daftar User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lihat progres semua siswa.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </Link>
        </div>

        {/* Materi Terbaru */}
        {!stats.loading && recentMaterials.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Materi Terbaru</h3>
            <div className="space-y-3">
              {recentMaterials.map((mat) => (
                <Link 
                  key={mat.id} 
                  to={`/admin/materi/${mat.id}/edit`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${mat.published ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{mat.title}</span>
                  <span className="text-xs text-gray-400">
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
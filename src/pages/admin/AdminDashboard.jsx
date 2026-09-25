import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { BookOpen, Users, FileText, PlusCircle, Settings } from 'lucide-react';

const AdminDashboard = () => {
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border dark:border-slate-800">
            <BookOpen className="w-8 h-8 text-teal-600 mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">6</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Materi</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border dark:border-slate-800">
            <Users className="w-8 h-8 text-amber-600 mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">1</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total User</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border dark:border-slate-800 col-span-2 md:col-span-1">
            <FileText className="w-8 h-8 text-blue-600 mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Kuis Dikerjakan</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-lg p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Upload Materi Baru</h2>
          <p className="text-teal-100 mb-6">Tambahkan materi baru yang akan langsung muncul di halaman siswa.</p>
          <Link to="/admin/materi/baru" className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors">
            <PlusCircle className="w-5 h-5" /> Upload Sekarang
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/admin/materi" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Kelola Materi</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Edit, hapus, atau publish materi.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
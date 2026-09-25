import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, Trophy, Clock, ChevronRight, PlayCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          
          // Kalau user belum pilih jenjang, arahkan ke onboarding
          if (!data.level) {
            navigate('/onboarding');
          }
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-xl font-semibold text-gray-500">Memuat data...</div>
      </div>
    );
  }

  // Data dummy untuk progress (nanti akan diambil dari Firestore)
  const progressPercent = 25;
  const totalMateri = 20;
  const selesaiMateri = 5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />  {/* <-- TAMBAHKAN INI */}
      {/* Header Sapaan */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Halo, {userData?.name || 'Siswa'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Jenjang: <span className="font-semibold text-teal-600 dark:text-teal-400">{userData?.level || 'Belum dipilih'}</span>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6">
        
        {/* Kartu Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 mb-8 border dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Progress Belajarmu
            </h2>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              {selesaiMateri} dari {totalMateri} materi
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-4 mb-2">
            <div 
              className="bg-teal-600 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
            {progressPercent}% Selesai
          </p>
        </div>

        {/* Grid Konten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Materi Terakhir */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" /> Lanjutkan Belajar
              </h2>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Persamaan Linear Satu Variabel</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SMP Kelas 7 • Aljabar</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber-500" /> Rekomendasi Untukmu
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Teorema Pythagoras</span>
                  <span className="ml-auto text-xs text-gray-400">SMP Kelas 8</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                  <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Persamaan Kuadrat</span>
                  <span className="ml-auto text-xs text-gray-400">SMA Kelas 10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Statistik Kuis */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border dark:border-slate-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skor Kuis Terakhir</h2>
              <div className="text-center py-4">
                <div className="text-5xl font-extrabold text-teal-600 dark:text-teal-400">85</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Persamaan Linear</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-2">Mau uji kemampuan?</h3>
              <p className="text-teal-100 text-sm mb-4">Kerjakan kuis untuk mengasah pemahamanmu.</p>
              <button className="w-full bg-white text-teal-700 font-semibold py-2 rounded-lg hover:bg-teal-50 transition-colors">
                Mulai Kuis
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
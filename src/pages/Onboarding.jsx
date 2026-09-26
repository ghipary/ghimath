import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, GraduationCap, ChevronRight, Sparkles, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePilihJenjang = async (jenjang) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { level: jenjang });
      toast.success(`Jenjang ${jenjang} berhasil dipilih! 🎓`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Gagal menyimpan pilihan: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-bg transition-colors min-h-screen flex items-center justify-center px-4 py-8">
      <div className="grid-pattern"></div>
      
      <div className="page-content max-w-2xl w-full text-center">
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-teal-700 dark:text-teal-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Langkah terakhir
        </div>

        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-4">
          Pilih Jenjang Belajarmu
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          Pilihan ini menentukan materi yang akan kamu lihat. Bisa diubah nanti di halaman profil.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SMP */}
          <button 
            onClick={() => handlePilihJenjang('SMP')}
            disabled={loading}
            className="group card-elevated p-6 sm:p-8 rounded-2xl transition-all text-left flex flex-col justify-between h-52 hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/40 group-hover:scale-110 transition-transform mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                SMP
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Kelas 7, 8, dan 9</p>
            </div>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-gray-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </button>

          {/* SMA */}
          <button 
            onClick={() => handlePilihJenjang('SMA')}
            disabled={loading}
            className="group card-elevated p-6 sm:p-8 rounded-2xl transition-all text-left flex flex-col justify-between h-52 hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400/20 to-pink-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                SMA
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Kelas 10, 11, dan 12</p>
            </div>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {loading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-teal-600 dark:text-teal-400">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Menyimpan pilihan...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
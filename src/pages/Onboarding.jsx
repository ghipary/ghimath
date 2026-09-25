import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, GraduationCap, ChevronRight } from 'lucide-react';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePilihJenjang = async (jenjang) => {
    try {
      setLoading(true);
      // Simpan pilihan jenjang ke Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        level: jenjang // "SMP" atau "SMA"
      });
      // Setelah disimpan, arahkan ke Dashboard
      navigate('/dashboard');
    } catch (error) {
      alert('Gagal menyimpan pilihan: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="max-w-2xl w-full text-center">
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Pilih Jenjang Belajarmu
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10">
          Pilihan ini akan menentukan materi yang akan kamu lihat. Kamu bisa mengubahnya nanti di halaman profil.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Kartu SMP */}
          <button 
            onClick={() => handlePilihJenjang('SMP')}
            disabled={loading}
            className="group bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-teal-500 transition-all text-left flex flex-col justify-between h-48"
          >
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 transition-colors">
                SMP
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Kelas 7, 8, dan 9</p>
            </div>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-gray-300 group-hover:text-teal-600 transition-colors" />
          </button>

          {/* Kartu SMA */}
          <button 
            onClick={() => handlePilihJenjang('SMA')}
            disabled={loading}
            className="group bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-amber-500 transition-all text-left flex flex-col justify-between h-48 relative"
          >
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 transition-colors">
                SMA
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Kelas 10, 11, dan 12</p>
            </div>
            <ChevronRight className="absolute bottom-8 right-8 w-6 h-6 text-gray-300 group-hover:text-amber-600 transition-colors" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default Onboarding;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { User, Mail, GraduationCap, Trophy, Clock, Edit2, Save, X, LogOut, Loader, BookOpen } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state untuk edit
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');

  // Ambil data user & riwayat kuis
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Ambil data user dari Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setEditName(data.name || '');
          setEditLevel(data.level || 'SMP');
        }

        // 2. Ambil riwayat kuis dari koleksi quizResults
        const q = query(
          collection(db, 'quizResults'),
          where('userId', '==', user.uid),
          orderBy('completedAt', 'desc')
        );
        const qSnap = await getDocs(q);
        const history = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuizHistory(history);
      } catch (error) {
        console.error('Gagal ambil data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Simpan perubahan profil
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName,
        level: editLevel
      });
      setUserData({ ...userData, name: editName, level: editLevel });
      setIsEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    }
    setSaving(false);
  };

  // Logout
  const handleLogout = async () => {
    if (window.confirm('Yakin ingin keluar?')) {
      await logout();
      navigate('/');
    }
  };

  // Hitung rata-rata skor
  const averageScore = quizHistory.length > 0
    ? Math.round(quizHistory.reduce((acc, curr) => acc + curr.score, 0) / quizHistory.length)
    : 0;

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

      {/* Header Profil */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Profil Saya</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola informasi akun dan lihat riwayat belajarmu.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-6">

        {/* Kartu Info User */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border dark:border-slate-800 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Avatar */}
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-teal-600 dark:text-teal-400" />
            </div>

            {/* Info & Form Edit */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenjang</label>
                    <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                      <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-medium">
                      <X className="w-4 h-4" /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userData?.name || 'Siswa'}</h2>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2">
                    <Mail className="w-4 h-4" /> <span className="text-sm">{userData?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                    <GraduationCap className="w-4 h-4" /> <span className="text-sm">Jenjang: <strong className="text-teal-600 dark:text-teal-400">{userData?.level || 'Belum dipilih'}</strong></span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline">
                      <Edit2 className="w-4 h-4" /> Edit Profil
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 font-medium hover:underline">
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistik Singkat */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-5 text-center">
            <Trophy className="w-7 h-7 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averageScore}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Rata-rata Skor</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-5 text-center">
            <BookOpen className="w-7 h-7 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{quizHistory.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Kuis Dikerjakan</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-5 text-center col-span-2 md:col-span-1">
            <Clock className="w-7 h-7 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {quizHistory.length > 0 ? new Date(quizHistory[0].completedAt?.toDate()).toLocaleDateString('id-ID') : '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Kuis Terakhir</div>
          </div>
        </div>

        {/* Riwayat Skor Kuis */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Riwayat Skor Kuis</h3>
          {quizHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Belum ada riwayat kuis. Ayo kerjakan kuis pertamamu!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b dark:border-slate-800">
                  <tr>
                    <th className="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Materi</th>
                    <th className="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Skor</th>
                    <th className="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {quizHistory.map((res) => (
                    <tr key={res.id}>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{res.materialTitle}</td>
                      <td className="py-3 text-center">
                        <span className={`text-sm font-bold ${res.score >= 70 ? 'text-teal-600' : 'text-amber-600'}`}>
                          {res.score}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500 dark:text-gray-400 text-right">
                        {res.completedAt ? new Date(res.completedAt.toDate()).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
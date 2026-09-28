import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, Mail, GraduationCap, Trophy, Clock, Edit2, Save, X, LogOut, Loader, BookOpen, Sparkles, School, Camera, ZoomIn, ZoomOut, Check, TrendingUp, BarChart3, Award, Flame, Target, BookMarked, Zap, Crown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';

const MIN_QUIZ = 3;

const getStreakConfig = (streak) => {
  if (streak >= 100) return { gradient: 'from-fuchsia-500 to-pink-500', Icon: Crown };
  if (streak >= 30) return { gradient: 'from-violet-500 to-purple-600', Icon: Zap };
  if (streak >= 14) return { gradient: 'from-amber-400 to-red-500', Icon: Flame };
  if (streak >= 7) return { gradient: 'from-yellow-400 to-orange-500', Icon: Zap };
  if (streak >= 3) return { gradient: 'from-cyan-400 to-teal-500', Icon: Flame };
  return { gradient: 'from-teal-400 to-cyan-500', Icon: Sparkles };
};

const StreakChip = ({ streak }) => {
  if (!streak || streak <= 0) return null;
  const config = getStreakConfig(streak);
  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${config.gradient} text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex-shrink-0`}>
      <config.Icon className="w-3 h-3" />
      {streak}
    </div>
  );
};

const fmtMinutes = (seconds) => {
  if (!seconds || seconds < 60) return '0 mnt';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}j ${rem}m` : `${h} jam`;
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [allUsers, setAllUsers] = useState({});
  const [allResults, setAllResults] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [photoError, setPhotoError] = useState(false);

  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const fileInputRef = useRef(null);

  const isValidPhoto = (photo) => {
    if (!photo) return false;
    if (typeof photo !== 'string') return false;
    if (!photo.startsWith('data:image')) return false;
    if (photo.length < 100) return false;
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setEditName(data.name || '');
          setEditLevel(data.level || 'SMP');
          setEditGrade(data.grade || 7);
          setEditSchool(data.school || '');
          
          if (isValidPhoto(data.photoURL)) {
            setEditPhoto(data.photoURL);
            setPhotoError(false);
          } else {
            setEditPhoto('');
            setPhotoError(true);
          }
        }

        // Fetch semua data untuk kalkulasi peringkat & statistik
        const [usersSnap, resultsSnap, progressSnap, examsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'quizResults')),
          getDocs(collection(db, 'progress')),
          getDocs(collection(db, 'examResults')).catch(() => ({ docs: [] })),
        ]);

        const usersMap = {};
        usersSnap.forEach((d) => { usersMap[d.id] = d.data(); });
        setAllUsers(usersMap);

        const resultsList = resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllResults(resultsList);

        const progressList = progressSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllProgress(progressList);

        const examsList = examsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllExams(examsList);

        // Filter history untuk user ini (termasuk kuis harian)
        const myResults = resultsList.filter(r => r.userId === user.uid);
        myResults.sort((a, b) => {
          const dateA = a.completedAt?.toDate() || 0;
          const dateB = b.completedAt?.toDate() || 0;
          return dateA - dateB;
        });

        // Deduplikasi hanya untuk tampilan riwayat (agar tidak spam jika mengulang kuis)
        // Tapi rata-rata skor akan dihitung dari SEMUA hasil (termasuk harian)
        const seenMaterials = new Map();
        myResults.forEach((r) => {
          if (!seenMaterials.has(r.materialId)) {
            seenMaterials.set(r.materialId, r);
          }
        });
        const deduped = Array.from(seenMaterials.values())
          .sort((a, b) => {
            const dateA = a.completedAt?.toDate() || 0;
            const dateB = b.completedAt?.toDate() || 0;
            return dateB - dateA;
          });

        setQuizHistory(deduped);
        setExamResults(examsList.filter(e => e.userId === user.uid));

      } catch (error) {
        console.error('Gagal ambil data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // ⚡ KALKULASI STATISTIK LENGKAP (Sama seperti Leaderboard)
  const myStats = useMemo(() => {
    if (!user || Object.keys(allUsers).length === 0) return null;

    const userResultsMap = {};
    allResults.forEach((r) => {
      if (!userResultsMap[r.userId]) userResultsMap[r.userId] = new Map();
      const existing = userResultsMap[r.userId].get(r.materialId);
      if (!existing || (r.score || 0) > (existing.score || 0)) {
        userResultsMap[r.userId].set(r.materialId, r);
      }
    });

    const userProgressMap = {};
    allProgress.forEach((p) => {
      if (!userProgressMap[p.userId]) userProgressMap[p.userId] = { readingSeconds: 0, completedCount: 0 };
      userProgressMap[p.userId].readingSeconds += (p.readingSeconds || 0);
      if (p.completed) userProgressMap[p.userId].completedCount += 1;
    });

    const userExamMap = {};
    allExams.forEach((e) => {
      if (!userExamMap[e.userId]) userExamMap[e.userId] = [];
      userExamMap[e.userId].push(e);
    });

    const list = [];
    Object.entries(allUsers).forEach(([uid, userInfo]) => {
      const map = userResultsMap[uid] || new Map();
      const results = Array.from(map.values());
      const count = results.length;
      const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
      const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

      const exams = userExamMap[uid] || [];
      const avgExam = exams.length > 0 ? Math.round(exams.reduce((s, e) => s + (e.score || 0), 0) / exams.length) : 0;

      // Fastest Avg (rata-rata waktu tercepat dari semua kuis, exclude ujian)
      const validTimes = results.filter(r => r.bestTime && r.bestTime > 0);
      const fastestAvg = validTimes.length > 0 ? validTimes.reduce((s, r) => s + r.bestTime, 0) / validTimes.length : 0;

      // Highest Avg (rata-rata nilai tertinggi)
      const highestAvg = count > 0 ? Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / count) : 0;

      list.push({
        uid,
        name: userInfo.name || 'Siswa',
        photoURL: userInfo.photoURL || '',
        currentStreak: userInfo.currentStreak || 0,
        avgScore,
        quizCount: count,
        avgExam,
        fastestAvg,
        highestAvg,
        readingSeconds: userProgressMap[uid]?.readingSeconds || 0,
        completedMaterials: userProgressMap[uid]?.completedCount || 0,
        qualified: count >= MIN_QUIZ,
        isAdmin: userInfo.role === 'admin',
      });
    });

    list.sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? 1 : -1;
      if (a.qualified !== b.qualified) return b.qualified - a.qualified;
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return b.quizCount - a.quizCount;
    });

    const myData = list.find(i => i.uid === user.uid);
    if (myData) myData.rank = list.findIndex(i => i.uid === user.uid) + 1;
    return myData;
  }, [user, allUsers, allResults, allProgress, allExams]);

  const lineChartData = [...quizHistory]
    .reverse()
    .map((q, idx) => ({
      name: `Kuis ${idx + 1}`,
      fullTitle: q.materialTitle,
      skor: q.score || 0,
    }));

  const getTopicFromTitle = (title) => {
    if (!title) return 'Lainnya';
    const t = title.toLowerCase();
    if (t.includes('aljabar') || t.includes('persamaan') || t.includes('variabel') || t.includes('kuadrat') || t.includes('plsv') || t.includes('spltv')) return 'Aljabar';
    if (t.includes('geometri') || t.includes('pythagoras') || t.includes('sudut') || t.includes('garis') || t.includes('segitiga') || t.includes('bangun')) return 'Geometri';
    if (t.includes('statistik') || t.includes('data') || t.includes('diagram')) return 'Statistika';
    if (t.includes('trigonometri') || t.includes('sinus') || t.includes('cosinus') || t.includes('tangen')) return 'Trigonometri';
    if (t.includes('kalkulus') || t.includes('limit') || t.includes('turunan') || t.includes('integral')) return 'Kalkulus';
    if (t.includes('bilangan')) return 'Bilangan';
    return 'Lainnya';
  };

  const topicStats = {};
  quizHistory.forEach((q) => {
    const topic = getTopicFromTitle(q.materialTitle);
    if (!topicStats[topic]) topicStats[topic] = { total: 0, count: 0 };
    topicStats[topic].total += q.score || 0;
    topicStats[topic].count += 1;
  });

  const barChartData = Object.entries(topicStats).map(([topic, data]) => ({
    topik: topic,
    rataRata: Math.round(data.total / data.count),
    jumlah: data.count,
  })).sort((a, b) => b.rataRata - a.rataRata);

  const getBarColor = (value) => {
    if (value >= 85) return '#14b8a6';
    if (value >= 70) return '#06b6d4';
    if (value >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700">
          <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
            {payload[0].payload.fullTitle || label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Skor: <span className="font-bold text-teal-600 dark:text-teal-400">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700">
          <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
            {payload[0].payload.topik}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Rata-rata: <span className="font-bold text-teal-600 dark:text-teal-400">{payload[0].value}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {payload[0].payload.jumlah} kuis
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('File harus gambar!');
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB!');

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImage(event.target.result);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      if (!cropImage || !croppedAreaPixels) return;
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = cropImage;
      });

      const canvas = document.createElement('canvas');
      const SIZE = 180;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, SIZE, SIZE
      );

      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      setEditPhoto(base64);
      setPhotoError(false);
      setShowCropModal(false);
      setCropImage('');
      toast.success('Foto di-crop! Klik Simpan untuk menerapkan. 📸');
    } catch (err) {
      toast.error('Gagal: ' + err.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName, 
        level: editLevel, 
        grade: Number(editGrade),
        school: editSchool, 
        photoURL: editPhoto
      });
      setUserData({ 
        ...userData, 
        name: editName, 
        level: editLevel, 
        grade: Number(editGrade), 
        school: editSchool, 
        photoURL: editPhoto 
      });
      setIsEditing(false);
      toast.success('Profil diperbarui! ✅');
    } catch (error) {
      toast.error('Gagal: ' + error.message);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditName(userData?.name || '');
    setEditLevel(userData?.level || 'SMP');
    setEditGrade(userData?.grade || 7);
    setEditSchool(userData?.school || '');
    setEditPhoto(isValidPhoto(userData?.photoURL) ? userData.photoURL : '');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Yakin ingin keluar?')) {
      await logout();
      toast.success('Berhasil keluar. Sampai jumpa! 👋');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const showPhoto = isValidPhoto(editPhoto) && !photoError;
  const initial = (userData?.name || 'S')[0].toUpperCase();

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-4xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-teal-700 dark:text-teal-400 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Profil Akun
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
          Profil Saya
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Kelola informasi akun dan lihat riwayat belajarmu.</p>
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 space-y-6">

        {/* KARTU INFO USER */}
        <div className="card-elevated rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            <div className="relative flex-shrink-0">
              {showPhoto ? (
                <img 
                  src={editPhoto} 
                  alt={userData?.name || 'Foto Profil'} 
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg shadow-teal-500/30 border-4 border-white dark:border-slate-700"
                  onError={() => {
                    console.warn('Foto gagal dimuat, fallback ke inisial');
                    setPhotoError(true);
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <span className="text-4xl font-bold text-white">{initial}</span>
                </div>
              )}
              
              {isEditing && (
                <>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-110 transition-transform border-3 border-white dark:border-slate-700">
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </>
              )}
            </div>

            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenjang</label>
                      <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas</label>
                      <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                        {[7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Kelas {g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asal Sekolah</label>
                    <input type="text" value={editSchool} onChange={(e) => setEditSchool(e.target.value)}
                      placeholder="Misal: SMP Negeri 1 Jakarta"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-md">
                      <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button onClick={handleCancel} className="flex items-center gap-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-medium">
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
                    <GraduationCap className="w-4 h-4" /> 
                    <span className="text-sm">
                      Jenjang: <strong className="text-teal-600 dark:text-teal-400">{userData?.level || 'Belum dipilih'}</strong>
                      {userData?.grade && <> • Kelas <strong className="text-teal-600 dark:text-teal-400">{userData.grade}</strong></>}
                    </span>
                  </div>
                  {userData?.school && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                      <School className="w-4 h-4" /> <span className="text-sm">{userData.school}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <Link 
                      to="/sertifikat"
                      className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-500 hover:to-pink-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:-translate-y-0.5"
                    >
                      <Award className="w-4 h-4" /> Sertifikat Saya
                    </Link>
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline px-2 py-2.5">
                      <Edit2 className="w-4 h-4" /> Edit Profil
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 font-medium hover:underline px-2 py-2.5">
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ⚡ KARTU STATISTIK LENGKAP (Sama seperti Leaderboard) */}
        {myStats && (
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-slate-700/50">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center gap-4 flex-wrap">
              {showPhoto ? (
                <img src={editPhoto} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white text-2xl font-bold">
                  {initial}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm mb-1 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Peringkat Kamu
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-1">#{myStats.rank}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-slate-300 text-xs sm:text-sm">
                    Rata-rata Kuis: <span className="font-bold text-white">{myStats.avgScore}</span> • Ujian: <span className="font-bold text-white">{myStats.avgExam}</span>
                  </p>
                  <StreakChip streak={myStats.currentStreak} />
                  {myStats.isAdmin && (
                    <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      ⚙️ Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl sm:text-6xl font-extrabold drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">{myStats.avgScore}</div>
                <p className="text-slate-300 text-xs font-medium">rata-rata</p>
              </div>
            </div>
            
            {/* ⚡ KOTAK STATISTIK BERWARNA (MEWAH & KONTRAS) */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
              <div className="text-center bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl p-3 shadow-lg shadow-fuchsia-500/30 border border-fuchsia-400/30 hover:-translate-y-1 transition-transform">
                <Target className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myStats.avgExam}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Rata-rata Ujian</p>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-3 shadow-lg shadow-blue-500/30 border border-blue-400/30 hover:-translate-y-1 transition-transform">
                <Clock className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{fmtMinutes(myStats.readingSeconds)}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Waktu Baca</p>
              </div>
              <div className="text-center bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl p-3 shadow-lg shadow-emerald-500/30 border border-emerald-400/30 hover:-translate-y-1 transition-transform">
                <BookMarked className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myStats.completedMaterials} materi</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Selesai</p>
              </div>
              <div className="text-center bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-3 shadow-lg shadow-amber-500/30 border border-amber-400/30 hover:-translate-y-1 transition-transform">
                <Trophy className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myStats.quizCount} kuis</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Dikerjakan</p>
              </div>
              <div className="text-center bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-3 shadow-lg shadow-rose-500/30 border border-rose-400/30 hover:-translate-y-1 transition-transform">
                <Zap className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{fmtMinutes(myStats.fastestAvg)}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Tercepat (Avg)</p>
              </div>
              <div className="text-center bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-3 shadow-lg shadow-violet-500/30 border border-violet-400/30 hover:-translate-y-1 transition-transform">
                <TrendingUp className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myStats.highestAvg}</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Nilai Tertinggi</p>
              </div>
              <div className="text-center bg-gradient-to-br from-cyan-400 to-sky-500 rounded-xl p-3 shadow-lg shadow-cyan-500/30 border border-cyan-400/30 col-span-2 hover:-translate-y-1 transition-transform">
                <BarChart3 className="w-5 h-5 text-white mx-auto mb-1.5 drop-shadow-md" />
                <p className="text-sm font-bold text-white drop-shadow-md">{myStats.quizCount} Kuis & {myStats.completedMaterials} Materi</p>
                <p className="text-[10px] text-white/90 font-medium drop-shadow-md">Progres Terbanyak</p>
              </div>
            </div>
          </div>
        )}

        {/* LINE CHART */}
        {lineChartData.length > 0 && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Grafik Skor Kuis</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lihat perkembangan skormu seiring waktu</p>
              </div>
            </div>

            <div className="w-full h-64 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    animationDuration={200}
                    cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="skor" 
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', strokeWidth: 2, r: 5, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BAR CHART */}
        {barChartData.length >= 2 && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Kemampuan per Topik</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata skor kamu di setiap topik</p>
              </div>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barChartData} 
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e2e8f0" 
                    className="dark:opacity-20" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="topik" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={<BarTooltip />} 
                    cursor={{ fill: 'rgba(20, 184, 166, 0.08)' }}
                    animationDuration={200}
                  />
                  <Bar 
                    dataKey="rataRata" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={80}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.rataRata)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#14b8a6' }}></span> ≥ 85 (Sangat Baik)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#06b6d4' }}></span> 70-84 (Baik)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }}></span> 50-69 (Cukup)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }}></span> &lt; 50 (Perlu Belajar)
              </span>
            </div>
          </div>
        )}

        {/* Cuma 1 topik */}
        {barChartData.length === 1 && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Kemampuan per Topik</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Kerjakan kuis dari topik lain untuk melihat grafik kemampuanmu!
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 px-3 py-2 rounded-lg text-sm font-bold text-violet-700 dark:text-violet-400">
              📚 Saat ini baru: {barChartData[0].topik} ({barChartData[0].rataRata})
            </div>
          </div>
        )}

        {/* RIWAYAT SKOR */}
        <div className="card-elevated rounded-2xl p-5 sm:p-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              Riwayat Skor Kuis
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-11">
              Nilai pertama per materi (permanen & tidak bisa diubah)
            </p>
          </div>

          {quizHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Belum ada riwayat kuis. Ayo kerjakan kuis pertamamu!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b dark:border-slate-700">
                  <tr>
                    <th className="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Materi</th>
                    <th className="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Skor</th>
                    <th className="py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700/50">
                  {quizHistory.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{res.materialTitle}</td>
                      <td className="py-3 text-center">
                        <span className={`text-sm font-bold ${res.score >= 70 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
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

      {/* MODAL CROP */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" /> Atur Posisi Foto
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Drag untuk menggeser, zoom untuk memperbesar</p>
            </div>
            <div className="relative w-full h-[300px] bg-slate-900">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-5 h-5 text-gray-400" />
                <input type="range" min={1} max={3} step={0.1} value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-teal-600" />
                <ZoomIn className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowCropModal(false); setCropImage(''); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all">
                  <X className="w-4 h-4" /> Batal
                </button>
                <button type="button" onClick={createCroppedImage}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-500/30 transition-all">
                  <Check className="w-4 h-4" /> Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
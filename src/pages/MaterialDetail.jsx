import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, BookOpen, Video, ListChecks, Loader, Clock, TrendingUp, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TARGET_SECONDS = 900; // 15 menit = 100%
const AUTO_SAVE_INTERVAL = 30000; // 30 detik

const MaterialDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);

  const readingSecondsRef = useRef(0);
  const isCompletedRef = useRef(false);

  // Helper hitung persen
  const calcPercent = (sec) => Math.min(100, Math.round((sec / TARGET_SECONDS) * 100));

  // Helper format waktu mm:ss
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ===== Fetch materi + progress =====
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'materials', id));
        if (!docSnap.exists()) {
          navigate('/materi');
          return;
        }
        setMaterial({ id: docSnap.id, ...docSnap.data() });

        if (user) {
          const progressRef = doc(db, 'progress', `${user.uid}_${id}`);
          const progressSnap = await getDoc(progressRef);

          let existingSeconds = 0;
          let existingCompleted = false;
          if (progressSnap.exists()) {
            const p = progressSnap.data();
            existingSeconds = p.readingSeconds || 0;
            existingCompleted = p.completed || false;
          }

          setReadingSeconds(existingSeconds);
          readingSecondsRef.current = existingSeconds;
          setPercentage(calcPercent(existingSeconds));
          setIsCompleted(existingCompleted);
          isCompletedRef.current = existingCompleted;

          await setDoc(progressRef, {
            userId: user.uid,
            materialId: id,
            materialTitle: docSnap.data().title,
            materialLevel: docSnap.data().level,
            materialGrade: docSnap.data().grade,
            materialTopic: docSnap.data().topic,
            completed: existingCompleted,
            readingSeconds: existingSeconds,
            percentage: calcPercent(existingSeconds),
            lastOpenedAt: serverTimestamp(),
          }, { merge: true });
        }
      } catch (error) {
        console.error('Gagal ambil materi:', error);
      }
      setLoading(false);
    };
    fetchMaterial();
  }, [id, navigate, user]);

  // ===== Cek tab aktif (visibility API) =====
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsTabActive(!document.hidden);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ===== Timer display pakai requestAnimationFrame (LEBIH SMOOTH) =====
  useEffect(() => {
    if (loading || !user || !isTabActive) return;
    
    let lastTick = Date.now();
    let rafId;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTick) / 1000);
      
      if (elapsed >= 1) {
        lastTick += elapsed * 1000;
        readingSecondsRef.current += elapsed;
        setReadingSeconds(readingSecondsRef.current);
        setPercentage(calcPercent(readingSecondsRef.current));
      }
      
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [loading, user, isTabActive]);

  // ===== Auto-save setiap 30 detik =====
  useEffect(() => {
    if (loading || !user) return;
    const interval = setInterval(async () => {
      if (readingSecondsRef.current === 0) return;
      try {
        await setDoc(doc(db, 'progress', `${user.uid}_${id}`), {
          readingSeconds: readingSecondsRef.current,
          percentage: calcPercent(readingSecondsRef.current),
          lastOpenedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.error('Gagal auto-save:', e);
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [loading, user, id]);

  // ===== Save saat keluar halaman =====
  useEffect(() => {
    return () => {
      if (!user || loading) return;
      if (readingSecondsRef.current === 0) return;
      setDoc(doc(db, 'progress', `${user.uid}_${id}`), {
        readingSeconds: readingSecondsRef.current,
        percentage: calcPercent(readingSecondsRef.current),
        lastOpenedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    };
  }, [user, id, loading]);

  // ===== Tandai Selesai =====
  const handleTandaiSelesai = async () => {
    if (!user) return;
    try {
      const newStatus = !isCompleted;
      setIsCompleted(newStatus);
      isCompletedRef.current = newStatus;

      if (newStatus && readingSecondsRef.current < TARGET_SECONDS) {
        readingSecondsRef.current = TARGET_SECONDS;
        setReadingSeconds(TARGET_SECONDS);
        setPercentage(100);
      }

      await setDoc(doc(db, 'progress', `${user.uid}_${id}`), {
        userId: user.uid,
        materialId: id,
        materialTitle: material.title,
        materialLevel: material.level,
        materialGrade: material.grade,
        materialTopic: material.topic,
        completed: newStatus,
        completedAt: newStatus ? serverTimestamp() : null,
        readingSeconds: readingSecondsRef.current,
        percentage: newStatus ? 100 : calcPercent(readingSecondsRef.current),
        lastOpenedAt: serverTimestamp(),
      }, { merge: true });

      if (newStatus) {
        toast.success('Materi ditandai selesai! ✅');
      } else {
        toast('Materi ditandai belum selesai', { icon: '↩️' });
      }
    } catch (error) {
      toast.error('Gagal menyimpan: ' + error.message);
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!material) return null;

  const finalPercent = isCompleted ? 100 : percentage;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/materi')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Materi
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${material.level === 'SMP' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              {material.level}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Kelas {material.grade}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{material.topic}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{material.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{material.description}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* ===== PROGRESS BAR CARD ===== */}
        {user && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                ) : isTabActive ? (
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                ) : (
                  <PauseCircle className="w-5 h-5 text-amber-600" />
                )}
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {isCompleted 
                    ? 'Materi Selesai ✅' 
                    : isTabActive 
                      ? 'Progress Baca Kamu' 
                      : 'Timer Dijeda ⏸️'}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={`flex items-center gap-1 ${!isTabActive && !isCompleted ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <Clock className="w-4 h-4" /> {fmtTime(readingSeconds)}
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {finalPercent}%
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600' 
                    : 'bg-gradient-to-r from-teal-400 to-teal-500'
                }`}
                style={{ width: `${finalPercent}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isCompleted 
                ? 'Kamu sudah menyelesaikan materi ini. Bagus! 🎉' 
                : !isTabActive
                  ? '⏸️ Timer dijeda karena kamu pindah tab. Balik ke sini untuk melanjutkan.'
                  : finalPercent >= 100 
                    ? 'Progress sudah 100%! Klik "Tandai Selesai" untuk konfirmasi.' 
                    : `Baca terus untuk menambah progress. Target 15 menit baca.`
              }
            </p>
          </div>
        )}

        {/* ===== PDF VIEWER ===== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Materi Bacaan (PDF)</h2>
          </div>
          <iframe src={material.fileUrl} title={material.title} className="w-full h-[500px] md:h-[700px] bg-gray-100 dark:bg-slate-800" />
        </div>

        {/* ===== VIDEO ===== */}
        {material.videoUrl && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <Video className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-gray-900 dark:text-white">Video Penjelasan</h2>
            </div>
            <div className="aspect-video">
              <iframe src={getYoutubeEmbedUrl(material.videoUrl)} title={`Video ${material.title}`} className="w-full h-full" allowFullScreen />
            </div>
          </div>
        )}

        {/* ===== TOMBOL AKSI ===== */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleTandaiSelesai} 
            className={`flex-1 flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all ${
              isCompleted 
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-200' 
                : 'bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:border-teal-600'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            {isCompleted ? 'Sudah Ditandai Selesai' : 'Tandai Selesai 100%'}
          </button>
          <Link to={`/materi/${material.id}/kuis`} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl">
            <ListChecks className="w-5 h-5" /> Latihan Soal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
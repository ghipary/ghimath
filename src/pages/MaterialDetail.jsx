import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, BookOpen, Video, ListChecks, Loader, Clock, TrendingUp, PauseCircle, Lock, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const TARGET_SECONDS = 900;
const AUTO_SAVE_INTERVAL = 30000;

const sanitizeHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sstyle='[^']*'/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/\sclass='[^']*'/gi, '')
    .replace(/\sdata-[a-z-]+="[^"]*"/gi, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00AD/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '');
};

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
  const [saving, setSaving] = useState(false);

  const readingSecondsRef = useRef(0);

  const calcPercent = (sec) => Math.min(100, Math.round((sec / TARGET_SECONDS) * 100));
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const isHtml = (str) => str && /<[a-z][\s\S]*>/i.test(str);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'materials', id));
        if (!docSnap.exists()) { navigate('/materi'); return; }
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

          await setDoc(progressRef, {
            userId: user.uid, materialId: id,
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
      } catch (error) { console.error('Gagal ambil materi:', error); }
      setLoading(false);
    };
    fetchMaterial();
  }, [id, navigate, user]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsTabActive(!document.hidden);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (loading || !user || !isTabActive || isCompleted) return;
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
  }, [loading, user, isTabActive, isCompleted]);

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
      } catch (e) { console.error(e); }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [loading, user, id]);

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

  const handleTandaiSelesai = async () => {
    if (!user || isCompleted) return;
    try {
      setSaving(true);
      setIsCompleted(true);
      if (readingSecondsRef.current < TARGET_SECONDS) {
        readingSecondsRef.current = TARGET_SECONDS;
        setReadingSeconds(TARGET_SECONDS);
        setPercentage(100);
      }
      await setDoc(doc(db, 'progress', `${user.uid}_${id}`), {
        userId: user.uid, materialId: id,
        materialTitle: material.title,
        materialLevel: material.level,
        materialGrade: material.grade,
        materialTopic: material.topic,
        completed: true,
        completedAt: serverTimestamp(),
        readingSeconds: readingSecondsRef.current,
        percentage: 100,
        lastOpenedAt: serverTimestamp(),
      }, { merge: true });
      toast.success('Materi ditandai selesai! ✅');
    } catch (error) {
      toast.error('Gagal menyimpan: ' + error.message);
      setIsCompleted(false);
    }
    setSaving(false);
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`;
    return url;
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!material) return null;

  const finalPercent = isCompleted ? 100 : percentage;
  const cleanContent = sanitizeHtml(material.content);
  const cleanDescription = sanitizeHtml(material.description);
  const hasContent = cleanContent && cleanContent.replace(/<[^>]*>/g, '').trim().length > 0;
  const hasPdf = material.fileUrl && material.fileUrl.trim().length > 0;
  const descIsHtml = isHtml(cleanDescription);

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-5xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <button onClick={() => navigate('/materi')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Materi
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              material.level === 'SMP' 
                ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400' 
                : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400'
            }`}>
              {material.level}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kelas {material.grade}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{material.topic}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            {material.title}
          </h1>
        </div>

        {/* PROGRESS BAR */}
        {user && (
          <div className="card-elevated rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-teal-400 to-cyan-600 shadow-teal-500/30' 
                    : isTabActive 
                      ? 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-teal-500/30' 
                      : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-white" /> : isTabActive ? <TrendingUp className="w-5 h-5 text-white" /> : <PauseCircle className="w-5 h-5 text-white" />}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                  {isCompleted ? 'Materi Selesai ✅' : isTabActive ? 'Progress Baca Kamu' : 'Timer Dijeda ⏸️'}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={`flex items-center gap-1 font-medium ${!isTabActive && !isCompleted ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <Clock className="w-4 h-4" /> {fmtTime(readingSeconds)}
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{finalPercent}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${finalPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isCompleted ? 'Kamu sudah menyelesaikan materi ini. Bagus! 🎉' : !isTabActive ? '⏸️ Timer dijeda karena kamu pindah tab.' : finalPercent >= 100 ? 'Progress sudah 100%! Klik "Tandai Selesai".' : `Baca terus untuk menambah progress. Target 15 menit baca.`}
            </p>
          </div>
        )}

        {/* DESKRIPSI */}
        {cleanDescription && (
          <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/30">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Tentang Materi</h2>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              {descIsHtml ? (
                <div className="material-content" dangerouslySetInnerHTML={{ __html: cleanDescription }} />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{cleanDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* KONTEN MATERI */}
        {hasContent && (
          <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Materi Bacaan</h2>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              <div className="material-content" dangerouslySetInnerHTML={{ __html: cleanContent }} />
            </div>
          </div>
        )}

        {/* PDF FALLBACK */}
        {!hasContent && hasPdf && (
          <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Materi Bacaan (PDF)</h2>
            </div>
            <iframe src={material.fileUrl} title={material.title} className="w-full h-[400px] sm:h-[500px] md:h-[700px] bg-gray-100 dark:bg-slate-800" />
          </div>
        )}

        {/* VIDEO */}
        {material.videoUrl && (
          <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
                <Video className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Video Penjelasan</h2>
            </div>
            <div className="aspect-video">
              <iframe src={getYoutubeEmbedUrl(material.videoUrl)} title={`Video ${material.title}`} className="w-full h-full" allowFullScreen />
            </div>
          </div>
        )}

        {/* TOMBOL AKSI */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={handleTandaiSelesai} 
            disabled={isCompleted || saving}
            className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 sm:py-4 rounded-xl transition-all text-sm sm:text-base ${
              isCompleted 
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 cursor-not-allowed shadow-inner' 
                : 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:border-teal-500 cursor-pointer shadow-md hover:shadow-lg'
            }`}
          >
            {isCompleted ? (
              <><Lock className="w-5 h-5" /> Sudah Selesai (Permanen)</>
            ) : (
              <><CheckCircle className="w-5 h-5" />{saving ? 'Menyimpan...' : 'Tandai Selesai 100%'}</>
            )}
          </button>
          <Link 
            to={`/materi/${material.id}/kuis`} 
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30 hover:shadow-xl text-sm sm:text-base"
          >
            <ListChecks className="w-5 h-5" /> Latihan Soal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, BookOpen, Video, ListChecks, Loader, Clock, TrendingUp, PauseCircle, Lock, FileText, Sparkles, UserPlus, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AITutor from '../components/AITutor';

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
    .replace(/&nbsp;/g, ' ');
};

const isMarkdownContent = (str) => {
  if (!str) return false;
  if (/<(p|h[1-6]|ul|ol|li|div|blockquote|table|pre|code|span)[\s>]/i.test(str)) return false;
  if (/\$\$[\s\S]+?\$\$/.test(str)) return true;
  if (/\$[^$\n]+\$/.test(str)) return true;
  if (/^#{1,6}\s/m.test(str)) return true;
  if (/\*\*[^*\n]+\*\*/.test(str)) return true;
  if (/^\s*[-*]\s+/m.test(str)) return true;
  return false;
};

const isHtmlContent = (str) => {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
};

// ⚡ Helper: buat slug dari teks heading
const slugify = (text) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
};

// ⚡ Helper: fallback copy (di luar component biar rapi)
const fallbackCopy = (text, onSuccess) => {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    onSuccess && onSuccess();
  } catch {
    toast.error('Gagal menyalin link');
  }
  document.body.removeChild(ta);
};

// ⚡ Helper: copy ke clipboard
const copyToClipboard = (text, onSuccess) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      fallbackCopy(text, onSuccess);
    });
  } else {
    fallbackCopy(text, onSuccess);
  }
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
  const contentRef = useRef(null);

  const calcPercent = (sec) => Math.min(100, Math.round((sec / TARGET_SECONDS) * 100));
  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  // ⚡ AUTO-GENERATE ID & SHARE BUTTON untuk setiap heading di materi
  useEffect(() => {
    if (loading || !material) return;

    // Beri jeda sedikit agar MarkdownRenderer selesai render
    const timer = setTimeout(() => {
      const container = contentRef.current;
      if (!container) return;

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const usedIds = new Set();

      headings.forEach((h, idx) => {
        // Skip jika heading di dalam tombol/link dsb
        if (h.closest('button, a')) return;

        // Generate ID jika belum ada
        if (!h.id) {
          let baseSlug = slugify(h.textContent || `section-${idx + 1}`);
          if (!baseSlug) baseSlug = `section-${idx + 1}`;

          let uniqueId = baseSlug;
          let counter = 1;
          while (usedIds.has(uniqueId)) {
            uniqueId = `${baseSlug}-${counter}`;
            counter++;
          }
          h.id = uniqueId;
        }
        usedIds.add(h.id);

        // Skip kalau tombol share sudah ada
        if (h.querySelector('.share-anchor-btn')) return;

        // Buat tombol share
        const btn = document.createElement('button');
        btn.className = 'share-anchor-btn';
        btn.type = 'button';
        btn.title = 'Salin link ke bagian ini';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;

        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = `${window.location.origin}${window.location.pathname}#${h.id}`;

          copyToClipboard(url, () => {
            toast.success('Link section dicopy! 🔗');
            window.history.replaceState(null, '', `#${h.id}`);
          });
        };
        h.appendChild(btn);
      });

      // ⚡ Scroll ke hash jika ada
      const hash = window.location.hash.substring(1);
      if (hash) {
        const target = document.getElementById(hash);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.classList.add('highlight-target');
            setTimeout(() => target.classList.remove('highlight-target'), 2500);
          }, 300);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, material]);

  // ⚡ Update hash saat user scroll manual
  useEffect(() => {
    const handleScroll = () => {
      const container = contentRef.current;
      if (!container) return;
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let currentId = '';
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 150 && rect.top > -100) currentId = h.id;
      });
      if (currentId && window.location.hash !== `#${currentId}`) {
        window.history.replaceState(null, '', `#${currentId}`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, material]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsTabActive(!document.hidden);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (loading || !isTabActive || isCompleted) return;
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
  }, [loading, isTabActive, isCompleted]);

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
    if (!user) {
      toast.error('Login dulu untuk menandai selesai dan menyimpan progresmu!');
      navigate('/login');
      return;
    }
    if (isCompleted || readingSecondsRef.current < TARGET_SECONDS) return;

    try {
      setSaving(true);
      setIsCompleted(true);
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

  const getVideoEmbedUrl = (url) => {
    if (!url) return { type: 'none', url: '' };
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[2]}` };
    }
    const tiktokRegExp = /\/video\/(\d+)/;
    const tiktokMatch = url.match(tiktokRegExp);
    if (tiktokMatch && tiktokMatch[1]) {
      return { type: 'tiktok', url: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}` };
    }
    return { type: 'unknown', url: url };
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
  const isReadyToComplete = finalPercent >= 100;

  const rawContent = material.content || '';
  const rawDescription = material.description || '';
  const cleanContent = sanitizeHtml(rawContent);
  const cleanDescription = sanitizeHtml(rawDescription);

  const contentIsMarkdown = isMarkdownContent(rawContent);
  const descIsMarkdown = isMarkdownContent(rawDescription);
  const descIsHtml = !descIsMarkdown && isHtmlContent(cleanDescription);
  const contentIsHtml = !contentIsMarkdown && isHtmlContent(cleanContent);

  const hasContent = (rawContent && rawContent.replace(/<[^>]*>/g, '').trim().length > 0) || contentIsMarkdown;
  const hasPdf = material.fileUrl && material.fileUrl.trim().length > 0;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />
      <AITutor material={material} />

      <div className="page-content max-w-5xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <button onClick={() => navigate('/materi')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Materi
        </button>

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
            {contentIsMarkdown && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-400 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> LaTeX
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            {material.title}
          </h1>

          {/* ⚡ TOMBOL COPY LINK MATERI */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button
              onClick={() => {
                const url = `${window.location.origin}/materi/${material.id}`;
                copyToClipboard(url, () => toast.success('Link materi dicopy! 🔗'));
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 px-3 py-1.5 rounded-lg transition-all hover:shadow-md"
            >
              <Link2 className="w-3.5 h-3.5" />
              Copy Link Materi
            </button>

            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Hover judul sub-bab di bawah & klik 🔗 untuk share bagian tertentu
            </span>
          </div>
        </div>

        {/* PROGRESS CARD / GUEST BANNER */}
        {user ? (
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
        ) : (
          <div className="card-elevated rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-l-4 border-l-teal-500 bg-gradient-to-r from-teal-50/50 to-cyan-50/30 dark:from-teal-900/10 dark:to-cyan-900/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/30 flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Kamu sedang membaca sebagai Tamu</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Login untuk menyimpan progres belajarmu, mengerjakan kuis, dan mendapatkan sertifikat.
                  </p>
                </div>
              </div>
              <Link to="/login" className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all text-center flex-shrink-0">
                Login Sekarang
              </Link>
            </div>
          </div>
        )}

        {/* VIDEO PENJELASAN */}
        {material.videoUrl && (() => {
          const videoInfo = getVideoEmbedUrl(material.videoUrl);
          const isTiktok = videoInfo.type === 'tiktok';
          
          return (
            <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
              <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Video Penjelasan</h2>
              </div>
              <div className={`w-full flex justify-center bg-gray-50 dark:bg-slate-900/50 ${isTiktok ? 'py-6' : ''}`}>
                <div className={isTiktok 
                  ? 'w-full max-w-[400px] aspect-[9/16] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-slate-700' 
                  : 'w-full aspect-video'
                }>
                  <iframe 
                    src={videoInfo.url} 
                    title={`Video ${material.title}`} 
                    className="w-full h-full border-0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen 
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* TENTANG MATERI */}
        {cleanDescription && (
          <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/30">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Tentang Materi</h2>
            </div>
            <div className="p-4 sm:p-6 md:p-8">
              {descIsMarkdown ? (
                <MarkdownRenderer content={rawDescription} />
              ) : descIsHtml ? (
                <div className="material-content" dangerouslySetInnerHTML={{ __html: cleanDescription }} />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{cleanDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* MATERI BACAAN — DIBUNGKUS .material-body */}
        {hasContent && (
          <div className="card-elevated rounded-2xl overflow-hidden mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Materi Bacaan</h2>
              {contentIsMarkdown && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-400 px-2 py-0.5 rounded-full">
                  ✨ Rendered
                </span>
              )}
            </div>
            <div className="p-4 sm:p-6 md:p-8" ref={contentRef}>
              <div className="material-body">
                {contentIsMarkdown ? (
                  <MarkdownRenderer content={rawContent} />
                ) : contentIsHtml ? (
                  <div className="material-content" dangerouslySetInnerHTML={{ __html: cleanContent }} />
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {cleanContent}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PDF Fallback */}
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

        {/* TOMBOL AKSI */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            onClick={handleTandaiSelesai} 
            disabled={user ? (isCompleted || saving || !isReadyToComplete) : false}
            className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 sm:py-4 rounded-xl transition-all text-sm sm:text-base ${
              !user
                ? 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:border-teal-500 cursor-pointer shadow-md hover:shadow-lg'
                : isCompleted 
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 cursor-not-allowed shadow-inner' 
                  : !isReadyToComplete
                    ? 'bg-gray-100 text-gray-400 dark:bg-slate-800/50 dark:text-gray-500 cursor-not-allowed border-2 border-transparent'
                    : 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:border-teal-500 cursor-pointer shadow-md hover:shadow-lg'
            }`}
          >
            {!user ? (
              <><Lock className="w-5 h-5" /> Login untuk Tandai Selesai</>
            ) : isCompleted ? (
              <><Lock className="w-5 h-5" /> Sudah Selesai (Permanen)</>
            ) : !isReadyToComplete ? (
              <><Lock className="w-5 h-5" /> Baca Dulu 15 Menit</>
            ) : (
              <><CheckCircle className="w-5 h-5" />{saving ? 'Menyimpan...' : 'Tandai Selesai 100%'}</>
            )}
          </button>
          
          <Link 
            to={`/materi/${material.id}/kuis`} 
            onClick={() => {
              if (!user) {
                toast.success('Mode Tamu: Kamu bisa mencoba kuis, tapi nilai tidak akan disimpan. Login untuk menyimpan nilai!', { 
                  duration: 5000,
                  icon: 'ℹ️'
                });
              }
            }}
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
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, ArrowLeft, Loader, AlertTriangle, Sparkles, Target, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const NUM_QUESTIONS = 5;

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DailyChallenge = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [challengeData, setChallengeData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saving, setSaving] = useState(false);

  const today = getTodayDate();
  const challengeId = user ? `${user.uid}_${today}` : null;

  // Init
  useEffect(() => {
    const init = async () => {
      if (!user || !challengeId) return;
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        setUserProfile(profileSnap.exists() ? profileSnap.data() : null);

        const challengeRef = doc(db, 'dailyChallenges', challengeId);
        const challengeSnap = await getDoc(challengeRef);

        if (challengeSnap.exists()) {
          const data = challengeSnap.data();
          setChallengeData(data);

          // Load questions + materialTitle
          const qIds = data.questionIds || [];
          const qs = await Promise.all(
            qIds.map(async (qid) => {
              const qSnap = await getDoc(doc(db, 'quizQuestions', qid));
              if (!qSnap.exists()) return null;
              const qData = qSnap.data();
              // ⚡ Ambil materialTitle dari materi terkait
              let materialTitle = '';
              if (qData.materialId) {
                try {
                  const mSnap = await getDoc(doc(db, 'materials', qData.materialId));
                  if (mSnap.exists()) materialTitle = mSnap.data().title || '';
                } catch (e) {}
              }
              return { id: qSnap.id, ...qData, materialTitle };
            })
          );
          setQuestions(qs.filter(Boolean));

          if (data.completed) {
            setFinished(true);
            setElapsedTime(data.elapsedTime || 0);
            setAnswers(data.answersSnapshot || {});
          }
        }
      } catch (error) {
        console.error('Gagal init daily challenge:', error);
      }
      setLoading(false);
    };
    init();
  }, [user, challengeId]);

  const generateChallenge = async () => {
    if (!user || !userProfile?.level) {
      toast.error('Selesaikan onboarding dulu ya!');
      return;
    }
    setGenerating(true);

    try {
      const materialsQ = query(
        collection(db, 'materials'),
        where('level', '==', userProfile.level),
        where('published', '==', true)
      );
      const materialsSnap = await getDocs(materialsQ);
      const materialIds = materialsSnap.docs.map((d) => d.id);

      if (materialIds.length === 0) {
        toast.error('Belum ada materi untuk jenjangmu');
        setGenerating(false);
        return;
      }

      const allQuestions = [];
      const chunkSize = 10;
      for (let i = 0; i < materialIds.length; i += chunkSize) {
        const chunk = materialIds.slice(i, i + chunkSize);
        const qQuery = query(
          collection(db, 'quizQuestions'),
          where('materialId', 'in', chunk)
        );
        const qSnap = await getDocs(qQuery);
        qSnap.forEach((d) => allQuestions.push({ id: d.id, ...d.data() }));
      }

      if (allQuestions.length === 0) {
        toast.error('Belum ada soal untuk jenjangmu');
        setGenerating(false);
        return;
      }

      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(NUM_QUESTIONS, shuffled.length));
      const questionIds = picked.map((q) => q.id);

      const challengeRef = doc(db, 'dailyChallenges', challengeId);
      const newChallenge = {
        userId: user.uid,
        date: today,
        level: userProfile.level,
        questionIds,
        completed: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(challengeRef, newChallenge);
      setChallengeData(newChallenge);
      setQuestions(picked);
      setCurrentIndex(0);
      setAnswers({});
      setElapsedTime(0);
      toast.success('Kuis Harian siap! 🎯');
    } catch (error) {
      console.error('Gagal generate:', error);
      toast.error('Gagal membuat kuis harian');
    }
    setGenerating(false);
  };

  // Timer
  useEffect(() => {
    if (loading || finished || questions.length === 0 || !challengeData) return;
    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [loading, finished, questions.length, challengeData]);

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return {
      correct,
      total: questions.length,
      score: Math.round((correct / questions.length) * 100),
    };
  };

    const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm('Masih ada soal yang belum dijawab. Yakin mau selesai?')) return;
    }

    const result = calculateScore();
    setFinished(true);
    setSaving(true);

    try {
      // 1️⃣ Simpan ke dailyChallenges
      const challengeRef = doc(db, 'dailyChallenges', challengeId);
      await setDoc(
        challengeRef,
        {
          completed: true,
          score: result.score,
          correctCount: result.correct,
          totalQuestions: result.total,
          elapsedTime,
          answersSnapshot: answers,
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ⚡ FIX: Update state lokal biar halaman hasil langsung tampil nilai benar
      setChallengeData((prev) => ({
        ...prev,
        completed: true,
        score: result.score,
        correctCount: result.correct,
        totalQuestions: result.total,
        elapsedTime,
      }));

      // 2️⃣ Simpan ke quizResults — Cek dulu biar gak duplikat
      const dailyMaterialId = `daily-${today}`;
      const existingQ = query(
        collection(db, 'quizResults'),
        where('userId', '==', user.uid),
        where('materialId', '==', dailyMaterialId)
      );
      const existingSnap = await getDocs(existingQ);

      if (existingSnap.empty) {
        // Belum ada → create baru
        await addDoc(collection(db, 'quizResults'), {
          userId: user.uid,
          materialId: dailyMaterialId,
          materialTitle: `🎯 Kuis Harian - ${today}`,
          materialLevel: userProfile?.level || '',
          materialTopic: 'Kuis Harian',
          score: result.score,
          bestScore: result.score,
          bestTime: elapsedTime,
          correctCount: result.correct,
          totalQuestions: result.total,
          attempts: 1,
          isDailyChallenge: true,
          completedAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp(),
        });
      }

      toast.success('Kuis Harian selesai! 🎉');
    } catch (error) {
      console.error('Gagal simpan:', error);
      toast.error('Gagal menyimpan hasil: ' + (error.message || 'Unknown'));
    }
    setSaving(false);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimeUntilTomorrow = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  // ================= HASIL AKHIR =================
  if (finished && challengeData) {
    const result = {
      correct: challengeData.correctCount || 0,
      total: challengeData.totalQuestions || questions.length,
      score: challengeData.score || 0,
    };

    return (
      <div className="page-bg transition-colors pb-20 min-h-screen">
        <div className="grid-pattern"></div>
        <Navbar />

        <div className="page-content max-w-2xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>

          <div className="card-elevated rounded-3xl p-8 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/15 to-orange-500/10 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg shadow-orange-500/30">
                <Sparkles className="w-3.5 h-3.5" /> Kuis Harian Selesai!
              </div>

              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
                result.score >= 70
                  ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 shadow-teal-500/40'
                  : 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-orange-500/40'
              }`}>
                <span className="text-5xl font-extrabold text-white">{result.score}</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {result.score >= 70 ? 'Keren Banget! 🎉' : result.score >= 50 ? 'Lumayan! 💪' : 'Coba Lagi Besok! 📚'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Kamu menjawab benar <strong className="text-teal-600 dark:text-teal-400">{result.correct}</strong> dari <strong>{result.total}</strong> soal
              </p>
              <p className="text-xs text-gray-400">Waktu: {formatTime(challengeData.elapsedTime || 0)}</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-2xl p-4">
                  <Target className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Skor</p>
                  <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{result.score}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 border border-violet-200/60 dark:border-violet-800/50 rounded-2xl p-4">
                  <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Besok Lagi</p>
                  <p className="text-lg font-extrabold text-violet-600 dark:text-violet-400">{getTimeUntilTomorrow()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-bold mb-1">Kuis Harian 1x per hari ⏰</p>
              <p className="text-xs leading-relaxed">
                Balik lagi besok untuk kuis baru dengan soal berbeda! Nilaimu sudah otomatis masuk ke statistik utama.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ================= BELUM ADA CHALLENGE (Intro) =================
  if (!challengeData) {
    return (
      <div className="page-bg transition-colors pb-20 min-h-screen">
        <div className="grid-pattern"></div>
        <Navbar />

        <div className="page-content max-w-2xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>

          <div className="card-elevated rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/15 to-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-teal-400/10 to-cyan-500/10 rounded-full blur-3xl"></div>

            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-orange-500/40">
                <Target className="w-12 h-12 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" /> KUIS HARIAN
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent mb-3">
                Siap Tantang Dirimu?
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Setiap hari, dapatkan <strong>5 soal acak</strong> dari semua materi jenjang <strong>{userProfile?.level || 'kamu'}</strong>. Bisa dikerjakan 1x per hari.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-xl p-3">
                  <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">5</div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">SOAL</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 border border-violet-200/60 dark:border-violet-800/50 rounded-xl p-3">
                  <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">1x</div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">PER HARI</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-xl p-3">
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">100</div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">SKOR MAX</p>
                </div>
              </div>

              <button
                onClick={generateChallenge}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl"
              >
                {generating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" /> Menyiapkan Soal...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Mulai Kuis Harian
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= SOAL =================
  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-3xl mx-auto px-4 pt-8 sm:pt-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-4 shadow-sm">
          <Target className="w-3.5 h-3.5" /> KUIS HARIAN — {today}
        </div>

        {/* Header Progress */}
        <div className="card-elevated rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Soal {currentIndex + 1} dari {questions.length}
            </span>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{answeredCount} dari {questions.length} soal terjawab</p>
        </div>

        {/* Kartu Soal */}
        <div className="card-elevated rounded-2xl p-6 md:p-8 mb-6">
          {currentQ.materialTitle && (
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-2 uppercase tracking-wide">
              {currentQ.materialTitle}
            </div>
          )}
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-6">
            {currentQ.question}
          </h2>
          <div className="space-y-3">
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentQ.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [currentQ.id]: i })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold'
                      : 'border-gray-200 dark:border-slate-700 hover:border-amber-400 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isSelected ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigasi */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex-1 py-3 rounded-xl font-semibold bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-500 transition-all"
          >
            ← Sebelumnya
          </button>
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white transition-all shadow-lg"
            >
              {saving ? 'Menyimpan...' : 'Selesai ✓'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white transition-all shadow-lg"
            >
              Selanjutnya →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyChallenge;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, RotateCcw, ArrowLeft, ListChecks, Loader, AlertTriangle, Trophy, TrendingUp, Sparkles } from 'lucide-react';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [material, setMaterial] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [bestResult, setBestResult] = useState(null); // Hasil terbaik sebelumnya
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matSnap = await getDoc(doc(db, 'materials', id));
        if (matSnap.exists()) setMaterial({ id: matSnap.id, ...matSnap.data() });

        const q = query(collection(db, 'quizQuestions'), where('materialId', '==', id));
        const qSnap = await getDocs(q);
        const data = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(data);

        // Cek hasil terbaik sebelumnya
        if (user) {
          const rq = query(
            collection(db, 'quizResults'),
            where('userId', '==', user.uid),
            where('materialId', '==', id)
          );
          const rSnap = await getDocs(rq);
          if (!rSnap.empty) {
            setBestResult({ id: rSnap.docs[0].id, ...rSnap.docs[0].data() });
          }
        }
      } catch (error) {
        console.error('Gagal ambil data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  // Timer
  useEffect(() => {
    if (loading || finished || questions.length === 0) return;
    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [loading, finished, questions.length]);

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return {
      correct,
      total: questions.length,
      score: Math.round((correct / questions.length) * 100)
    };
  };

  const handleFinish = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm('Masih ada soal yang belum dijawab. Yakin mau selesai?')) return;
    }

    const result = calculateScore();
    setFinished(true);
    setSaving(true);

    try {
      const newScore = result.score;
      const oldScore = bestResult?.score ?? -1;
      const isHigher = newScore > oldScore;

      if (!bestResult) {
        // Belum pernah kerjakan → create baru
        await addDoc(collection(db, 'quizResults'), {
          userId: user.uid,
          materialId: id,
          materialTitle: material?.title || 'Materi',
          score: newScore,
          bestScore: newScore,
          correctCount: result.correct,
          totalQuestions: result.total,
          attempts: 1,
          completedAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp(),
        });
        setIsNewRecord(true);
      } else if (isHigher) {
        // Nilai baru lebih tinggi → update ke nilai tertinggi
        await updateDoc(doc(db, 'quizResults', bestResult.id), {
          score: newScore,
          bestScore: newScore,
          correctCount: result.correct,
          totalQuestions: result.total,
          attempts: (bestResult.attempts || 1) + 1,
          lastAttemptAt: serverTimestamp(),
        });
        setIsNewRecord(true);
      } else {
        // Nilai baru lebih rendah/sama → hanya tambah attempts
        await updateDoc(doc(db, 'quizResults', bestResult.id), {
          attempts: (bestResult.attempts || 1) + 1,
          lastAttemptAt: serverTimestamp(),
        });
        setIsNewRecord(false);
      }
    } catch (error) {
      console.error('Gagal simpan skor:', error);
    }
    setSaving(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setFinished(false);
    setElapsedTime(0);
    setIsNewRecord(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  // ===== BELUM ADA SOAL =====
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ListChecks className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Soal</h2>
          <p className="text-gray-500 mb-6">Admin belum menambahkan soal untuk materi ini.</p>
          <button onClick={() => navigate(`/materi/${id}`)} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold">
            Kembali ke Materi
          </button>
        </div>
      </div>
    );
  }

  // ===== HASIL AKHIR =====
  if (finished) {
    const result = calculateScore();
    const oldBest = bestResult?.score ?? null;
    const bestSoFar = Math.max(result.score, oldBest ?? 0);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          
          {/* Kartu Skor Utama */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border dark:border-slate-800 p-8 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative">
              {/* Badge "Rekor Baru" */}
              {isNewRecord && oldBest !== null && (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg shadow-orange-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Rekor Baru!
                </div>
              )}
              {isNewRecord && oldBest === null && (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg shadow-teal-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Kuis Selesai!
                </div>
              )}

              {/* Lingkaran Skor */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
                result.score >= 70 
                  ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 shadow-teal-500/40' 
                  : 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-orange-500/40'
              }`}>
                <span className="text-5xl font-extrabold text-white">
                  {result.score}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {result.score >= 70 ? 'Hebat! 🎉' : result.score >= 50 ? 'Lumayan! 💪' : 'Ayo Coba Lagi! 📚'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Kamu menjawab benar <strong className="text-teal-600 dark:text-teal-400">{result.correct}</strong> dari <strong>{result.total}</strong> soal
              </p>
              <p className="text-xs text-gray-400 mb-6">Waktu: {formatTime(elapsedTime)}</p>

              {/* Statistik */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-2xl p-4">
                  <Trophy className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nilai Terbaik</p>
                  <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{bestSoFar}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 border border-violet-200/60 dark:border-violet-800/50 rounded-2xl p-4">
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Percobaan</p>
                  <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                    {(bestResult?.attempts || 0) + 1}x
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Nilai Tertinggi yang Disimpan */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-bold mb-1">Hanya nilai tertinggi yang disimpan 📊</p>
              <p className="text-xs leading-relaxed">
                Kamu bisa mengulang kuis ini berkali-kali. Yang tercatat adalah nilai tertinggi kamu, jadi jangan takut untuk mencoba lagi!
              </p>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30 hover:shadow-xl"
            >
              <RotateCcw className="w-5 h-5" /> Coba Lagi
            </button>
            <button 
              onClick={() => navigate(`/materi/${id}`)} 
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:border-teal-500 font-semibold py-4 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" /> Kembali ke Materi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== TAMPILAN SOAL =====
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Info Nilai Terbaik Sebelumnya */}
        {bestResult && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-xl p-3 mb-4 flex items-center gap-3 text-sm">
            <Trophy className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-teal-800 dark:text-teal-300">
                Nilai terbaikmu sebelumnya: <strong className="text-teal-700 dark:text-teal-400">{bestResult.score}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
              {bestResult.attempts || 1}x
            </span>
          </div>
        )}

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Tips:</strong> Jawaban tidak akan ditampilkan setelah selesai. Fokus pada pemahaman, bukan menghafal jawaban. Kamu bisa mengulang kuis ini kapan saja!
          </span>
        </div>

        {/* Header Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Soal {currentIndex + 1} dari {questions.length}
            </span>
            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{answeredCount} dari {questions.length} soal terjawab</p>
        </div>

        {/* Kartu Soal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border dark:border-slate-800 p-6 md:p-8 mb-6">
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
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold'
                      : 'border-gray-200 dark:border-slate-700 hover:border-teal-400 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
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
          <button onClick={() => setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0}
            className="flex-1 py-3 rounded-xl font-semibold bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-teal-600 transition-all">
            ← Sebelumnya
          </button>
          {currentIndex === questions.length - 1 ? (
            <button onClick={handleFinish} disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white transition-all shadow-lg">
              {saving ? 'Menyimpan...' : 'Selesai ✓'}
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(currentIndex + 1)}
              className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white transition-all shadow-lg">
              Selanjutnya →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Quiz;
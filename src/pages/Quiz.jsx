import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, RotateCcw, ArrowLeft, ListChecks, Loader, AlertTriangle, Trophy, TrendingUp, Sparkles, CheckCircle, XCircle, Award, PartyPopper, Lightbulb, X, RefreshCw } from 'lucide-react';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [material, setMaterial] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [bestResult, setBestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isNewFastest, setIsNewFastest] = useState(false);

  // ⚡ STATE RETRY (Salah Saya)
  const [retryingQuestion, setRetryingQuestion] = useState(null);
  const [retryAnswer, setRetryAnswer] = useState(null);
  const [retryResult, setRetryResult] = useState(null);
  const [retryCompleted, setRetryCompleted] = useState({}); // { qId: true }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matSnap = await getDoc(doc(db, 'materials', id));
        if (matSnap.exists()) setMaterial({ id: matSnap.id, ...matSnap.data() });

        const q = query(collection(db, 'quizQuestions'), where('materialId', '==', id));
        const qSnap = await getDocs(q);
        const data = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(data);

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
      const newTime = elapsedTime;
      const oldScore = bestResult?.score ?? -1;
      const oldTime = bestResult?.bestTime ?? Infinity;
      
      const isHigher = newScore > oldScore;
      const canRecordTime = newScore >= 50;
      const isFaster = canRecordTime && newTime < oldTime;

      if (!bestResult) {
        await addDoc(collection(db, 'quizResults'), {
          userId: user.uid,
          materialId: id,
          materialTitle: material?.title || 'Materi',
          materialLevel: material?.level || '',
          materialTopic: material?.topic || '',
          score: newScore,
          bestScore: newScore,
          bestTime: canRecordTime ? newTime : null,
          correctCount: result.correct,
          totalQuestions: result.total,
          attempts: 1,
          completedAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp(),
        });
        setIsNewRecord(true);
        setIsNewFastest(canRecordTime);
      } else {
        const updates = {
          attempts: (bestResult.attempts || 1) + 1,
          lastAttemptAt: serverTimestamp(),
        };
        if (isHigher) {
          updates.score = newScore;
          updates.bestScore = newScore;
          updates.correctCount = result.correct;
          updates.totalQuestions = result.total;
        }
        if (isFaster) {
          updates.bestTime = newTime;
        }
        await updateDoc(doc(db, 'quizResults', bestResult.id), updates);
        setIsNewRecord(isHigher);
        setIsNewFastest(isFaster);
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
    setIsNewFastest(false);
    setRetryCompleted({});
    setRetryingQuestion(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ⚡ Buka soal salah untuk retry
  const openRetry = (question) => {
    setRetryingQuestion(question);
    setRetryAnswer(null);
    setRetryResult(null);
  };

  // ⚡ Submit jawaban retry
  const submitRetry = () => {
    if (retryAnswer === null) return;
    const isCorrect = retryAnswer === retryingQuestion.correctAnswer;
    setRetryResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setRetryCompleted((prev) => ({ ...prev, [retryingQuestion.id]: true }));
    }
  };

  const closeRetry = () => {
    setRetryingQuestion(null);
    setRetryAnswer(null);
    setRetryResult(null);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

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

  if (finished) {
    const result = calculateScore();
    const oldBest = bestResult?.score ?? null;
    const bestSoFar = Math.max(result.score, oldBest ?? 0);
    const oldBestTime = bestResult?.bestTime;
    const bestTimeSoFar = 
      result.score >= 50 && (oldBestTime === null || oldBestTime === undefined || elapsedTime < oldBestTime)
        ? elapsedTime
        : oldBestTime;

    const isPerfect = result.score === 100;

    // ⚡ Kumpulkan soal yang salah
    const wrongQuestions = questions.filter((q) => answers[q.id] !== q.correctAnswer);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          
          {/* Kartu Skor */}
          <div className={`rounded-3xl shadow-xl border p-8 text-center mb-6 relative overflow-hidden ${
            isPerfect
              ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/10 dark:to-orange-900/20 border-amber-300 dark:border-amber-700'
              : 'bg-white dark:bg-slate-900 dark:border-slate-800'
          }`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative">
              {isPerfect && (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full mb-4 shadow-lg shadow-amber-500/40 animate-pulse">
                  <PartyPopper className="w-4 h-4" /> SEMPURNA! NILAI 100!
                </div>
              )}
              {!isPerfect && isNewRecord && oldBest !== null && (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg shadow-orange-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Rekor Nilai Baru!
                </div>
              )}
              {!isPerfect && isNewRecord && oldBest === null && (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg shadow-teal-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Kuis Selesai!
                </div>
              )}

              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl relative ${
                isPerfect
                  ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 shadow-amber-500/50'
                  : result.score >= 70 
                    ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 shadow-teal-500/40' 
                    : 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-orange-500/40'
              }`}>
                {isPerfect && (
                  <Award className="w-10 h-10 text-white absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-lg" />
                )}
                <span className="text-5xl font-extrabold text-white">{result.score}</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isPerfect ? 'Luar Biasa! Sempurna! 🏆' : result.score >= 70 ? 'Hebat! 🎉' : result.score >= 50 ? 'Lumayan! 💪' : 'Ayo Coba Lagi! 📚'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Kamu menjawab benar <strong className="text-teal-600 dark:text-teal-400">{result.correct}</strong> dari <strong>{result.total}</strong> soal
              </p>
              <p className="text-xs text-gray-400 mb-6">Waktu: {formatTime(elapsedTime)}</p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-2xl p-4">
                  <Trophy className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nilai Terbaik</p>
                  <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">{bestSoFar}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10 border border-violet-200/60 dark:border-violet-800/50 rounded-2xl p-4">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Waktu Tercepat</p>
                  <p className="text-xl font-extrabold text-violet-600 dark:text-violet-400">
                    {bestTimeSoFar ? formatTime(bestTimeSoFar) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ⚡ PEMBAHASAN KHUSUS NILAI 100 */}
          {isPerfect && (
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/10 dark:via-yellow-900/5 dark:to-orange-900/10 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-amber-200 dark:border-amber-800/50">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">🎁 Hadiah Spesial: Pembahasan Lengkap!</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Karena kamu dapat nilai sempurna, ini jawaban & pembahasan lengkapnya!</p>
                </div>
              </div>

              <div className="space-y-5">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-amber-200/60 dark:border-amber-800/30">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-relaxed">
                        {idx + 1}. {q.question}
                      </p>
                    </div>
                    <div className="ml-9 space-y-1.5">
                      {q.options.map((opt, i) => {
                        const isRightAnswer = i === q.correctAnswer;
                        return (
                          <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                            isRightAnswer 
                              ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50' 
                              : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                              isRightAnswer ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className={isRightAnswer ? 'font-semibold text-teal-700 dark:text-teal-300' : ''}>
                              {opt}
                              {isRightAnswer && (
                                <span className="ml-2 text-[10px] bg-teal-100 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-full font-bold">
                                  JAWABAN BENAR
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="ml-9 mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">💡 Pembahasan:</p>
                        <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⚡ SALAH SAYA (Kalau ada soal yang salah) */}
          {!isPerfect && wrongQuestions.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 border-2 border-red-200 dark:border-red-800/60 rounded-3xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-red-200 dark:border-red-800/50">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/40">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-200">📚 Belajar dari Kesalahan</h3>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Kamu salah di {wrongQuestions.length} soal. Yuk, coba lagi sampai benar!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {wrongQuestions.map((q) => {
                  const qIndex = questions.findIndex((qq) => qq.id === q.id);
                  const isSolved = retryCompleted[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => openRetry(q)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${
                        isSolved 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800/60'
                          : 'bg-white/70 dark:bg-slate-800/50 border-red-200 dark:border-red-800/40 hover:border-red-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                          isSolved 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                            : 'bg-gradient-to-br from-red-400 to-rose-600'
                        }`}>
                          {isSolved ? <CheckCircle className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSolved 
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                            }`}>
                              Soal #{qIndex + 1}
                            </span>
                            {isSolved && (
                              <span className="text-[10px] font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                                ✅ Berhasil!
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {q.question}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            {isSolved ? 'Klik untuk lihat pembahasan lagi' : 'Klik untuk coba lagi'} →
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Salah itu wajar! Yang penting kamu <strong>belajar dari kesalahannya</strong> dan <strong>berani coba lagi</strong>. 💪</span>
              </div>
            </div>
          )}

          {!isPerfect && wrongQuestions.length === 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-2xl p-4 mb-6 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">Dapatkan nilai 100 untuk lihat semua pembahasan! 🎁</p>
                <p className="text-xs leading-relaxed">Kamu bisa coba lagi kapan saja. Nilai tertinggi tetap tersimpan.</p>
              </div>
            </div>
          )}

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

        {/* ⚡ MODAL RETRY SOAL SALAH */}
        {retryingQuestion && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto" onClick={closeRetry}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl my-8 relative" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className={`p-5 rounded-t-3xl ${
                retryResult === 'correct' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : retryResult === 'wrong'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      {retryResult === 'correct' ? <CheckCircle className="w-5 h-5 text-white" /> : retryResult === 'wrong' ? <XCircle className="w-5 h-5 text-white" /> : <RefreshCw className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {retryResult === 'correct' ? '🎉 Benar!' : retryResult === 'wrong' ? 'Belum Tepat' : 'Coba Lagi Soal Ini'}
                      </h3>
                      <p className="text-xs text-white/80">
                        {retryResult === 'correct' ? 'Hebat! Kamu berhasil!' : retryResult === 'wrong' ? 'Coba lagi ya, jangan menyerah!' : 'Pilih jawaban yang benar'}
                      </p>
                    </div>
                  </div>
                  <button onClick={closeRetry} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6">
                <p className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">
                  {retryingQuestion.question}
                </p>

                <div className="space-y-2.5">
                  {retryingQuestion.options.map((opt, i) => {
                    const isSelected = retryAnswer === i;
                    const isRight = i === retryingQuestion.correctAnswer;
                    const showCorrect = retryResult === 'correct' && isRight;
                    const showWrong = retryResult === 'wrong' && isSelected && !isRight;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (retryResult === 'correct') return;
                          setRetryAnswer(i);
                          setRetryResult(null);
                        }}
                        disabled={retryResult === 'correct'}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          showCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : showWrong
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : isSelected
                                ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                                : 'border-gray-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                          showCorrect ? 'bg-green-600 text-white' :
                          showWrong ? 'bg-red-600 text-white' :
                          isSelected ? 'bg-teal-600 text-white' :
                          'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className={`text-sm ${
                          showCorrect ? 'font-semibold text-green-700 dark:text-green-300' :
                          showWrong ? 'text-red-700 dark:text-red-300' :
                          isSelected ? 'font-semibold text-teal-700 dark:text-teal-300' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Pembahasan (muncul kalau udah benar) */}
                {retryResult === 'correct' && retryingQuestion.explanation && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1.5 flex items-center gap-1">
                      💡 Pembahasan:
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                      {retryingQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex gap-3 mt-5">
                  {retryResult === 'correct' ? (
                    <button
                      onClick={closeRetry}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg"
                    >
                      Mantap! ✓
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={closeRetry}
                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold"
                      >
                        Nanti Saja
                      </button>
                      <button
                        onClick={submitRetry}
                        disabled={retryAnswer === null}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold shadow-lg"
                      >
                        Jawab
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ HALAMAN SOAL ============
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {bestResult && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-xl p-3 mb-4 flex items-center gap-3 text-sm">
            <Trophy className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-teal-800 dark:text-teal-300">
                Nilai terbaikmu: <strong className="text-teal-700 dark:text-teal-400">{bestResult.score}</strong>
                {bestResult.bestTime && (
                  <> • Waktu tercepat: <strong className="text-teal-700 dark:text-teal-400">{formatTime(bestResult.bestTime)}</strong></>
                )}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
              {bestResult.attempts || 1}x
            </span>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Bonus:</strong> Dapatkan <strong>nilai 100</strong> untuk buka pembahasan lengkap, atau coba lagi soal yang salah di akhir kuis! 🔓
          </span>
        </div>

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
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InlineMarkdown from '../components/InlineMarkdown';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, Loader, Award, CheckCircle, XCircle, AlertTriangle, ArrowLeft, FileText, Play, Timer, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const prepareQuestions = (exam) => {
  let qs = [...(exam.questions || [])];
  if (exam.shuffleQuestions) qs = shuffle(qs);

  return qs.map((q) => {
    let options = [...(q.options || [])];
    let correctAnswer = q.correctAnswer;

    if (exam.shuffleOptions) {
      const indexed = options.map((opt, i) => ({ opt, isCorrect: i === q.correctAnswer }));
      const shuffled = shuffle(indexed);
      options = shuffled.map((x) => x.opt);
      correctAnswer = shuffled.findIndex((x) => x.isCorrect);
    }

    return { ...q, options, correctAnswer };
  });
};

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('intro');
  const [existingResult, setExistingResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);
  const answersRef = useRef({});
  const timeLeftRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const examSnap = await getDoc(doc(db, 'examPackages', id));
        if (!examSnap.exists()) { navigate('/ujian'); return; }
        const examData = { id: examSnap.id, ...examSnap.data() };
        setExam(examData);

        if (user) {
          const resultSnap = await getDoc(doc(db, 'examResults', `${user.uid}_${id}`));
          if (resultSnap.exists()) {
            const res = resultSnap.data();
            setExistingResult(res);
            setFinalResult(res);
            setPhase('result');
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat ujian');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user, navigate]);

  useEffect(() => {
    if (phase !== 'taking' || submitted) return;

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, submitted]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const handleStart = () => {
    if (!user) { toast.error('Login dulu untuk ikut ujian'); return; }
    if (existingResult) { toast.error('Kamu sudah mengerjakan ujian ini!'); return; }

    const prepared = prepareQuestions(exam);
    setQuestions(prepared);
    setCurrentIndex(0);
    setAnswers({});
    answersRef.current = {};
    const totalSecs = (exam.duration || 60) * 60;
    setTimeLeft(totalSecs);
    timeLeftRef.current = totalSecs;
    setSubmitted(false);
    submittedRef.current = false;
    setPhase('taking');
    toast.success('Ujian dimulai! Semangat! 💪');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ⚡ Pakai INDEX (bukan id) karena soal ujian mungkin tidak punya id unik
  const calculateResult = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answersRef.current[idx] === q.correctAnswer) correct++;
    });
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, score };
  };

  const submitExam = async (autoSubmitted = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    setSaving(true);

    const result = calculateResult();
    const elapsedTime = ((exam.duration || 60) * 60) - timeLeftRef.current;

    const resultData = {
      userId: user.uid,
      examId: id,
      examTitle: exam.title,
      score: result.score,
      correctCount: result.correct,
      totalQuestions: result.total,
      answersSnapshot: { ...answersRef.current },
      elapsedTime,
      autoSubmitted,
      submittedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'examResults', `${user.uid}_${id}`), resultData);
      setFinalResult({ ...resultData, submittedAt: { toDate: () => new Date() } });
      setPhase('result');
      toast.success(autoSubmitted ? '⏰ Waktu habis! Auto-submit.' : 'Ujian selesai! 🎉', { duration: 4000 });
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan hasil');
    }
    setSaving(false);
  };

  const handleAutoSubmit = () => {
    if (submittedRef.current) return;
    toast.loading('⏰ Waktu habis, auto-submit...', { id: 'auto-submit' });
    submitExam(true).then(() => {
      toast.dismiss('auto-submit');
    });
  };

  const handleManualSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const total = questions.length;
    if (answeredCount < total) {
      if (!window.confirm(`Masih ada ${total - answeredCount} soal belum dijawab. Yakin submit?`)) return;
    }
    submitExam(false);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!exam) return null;

  // ═══ PHASE: INTRO ═══
  if (phase === 'intro') {
    const isLocked = !!existingResult;
    return (
      <div className="page-bg transition-colors pb-20 min-h-screen">
        <div className="grid-pattern"></div>
        <Navbar />
        <div className="page-content max-w-2xl mx-auto px-4 pt-8 sm:pt-12">
          <button onClick={() => navigate('/ujian')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Ujian
          </button>

          <div className="card-elevated rounded-3xl p-6 sm:p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/30">
              <FileText className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-5 text-sm leading-relaxed">
                {exam.description}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl p-3 text-center">
                <Timer className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-red-600 dark:text-red-400">{exam.duration}</div>
                <div className="text-[10px] text-gray-500 font-semibold">MENIT</div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200/50 dark:border-teal-800/50 rounded-xl p-3 text-center">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-teal-600 dark:text-teal-400">{exam.questions?.length || 0}</div>
                <div className="text-[10px] text-gray-500 font-semibold">SOAL</div>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/50 dark:border-violet-800/50 rounded-xl p-3 text-center">
                <Award className="w-5 h-5 text-violet-600 dark:text-violet-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-violet-600 dark:text-violet-400">{exam.passingScore || 70}</div>
                <div className="text-[10px] text-gray-500 font-semibold">LULUS</div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <p className="font-bold text-sm">Perhatian!</p>
                <ul className="space-y-1">
                  <li>✅ Soal & opsi diacak otomatis</li>
                  <li>⏰ Waktu habis → auto-submit</li>
                  <li>🔒 <strong>Hanya 1x percobaan</strong> (tidak bisa ulang)</li>
                  <li>📵 Jangan tutup tab saat ujian berlangsung</li>
                </ul>
              </div>
            </div>

            {isLocked ? (
              <div className="text-center">
                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-2xl p-5 mb-4">
                  <CheckCircle className="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto mb-3" />
                  <p className="font-bold text-gray-900 dark:text-white mb-1">Kamu sudah mengerjakan!</p>
                  <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mb-2">{existingResult.score}</p>
                  <p className="text-xs text-gray-500">
                    {existingResult.correctCount}/{existingResult.totalQuestions} benar
                  </p>
                </div>
                <button
                  onClick={() => setPhase('result')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold shadow-lg"
                >
                  Lihat Pembahasan
                </button>
              </div>
            ) : (
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-bold shadow-xl shadow-red-500/30 hover:-translate-y-0.5 transition-all"
              >
                <Play className="w-5 h-5" /> Mulai Ujian Sekarang
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══ PHASE: TAKING ═══
  if (phase === 'taking') {
    const currentQ = questions[currentIndex];
    if (!currentQ) return null;

    const progress = ((currentIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;
    const isLowTime = timeLeft <= 60;
    const isMidTime = timeLeft <= 300 && timeLeft > 60;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
        <Navbar />

        <div className={`sticky top-16 z-40 backdrop-blur-lg border-b shadow-sm ${
          isLowTime 
            ? 'bg-red-50/95 dark:bg-red-950/95 border-red-300 dark:border-red-800' 
            : isMidTime
              ? 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-300 dark:border-amber-800'
              : 'bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-slate-700'
        }`}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{exam.title}</p>
              <p className="text-[10px] text-gray-500">{answeredCount}/{questions.length} terjawab</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold ${
              isLowTime
                ? 'bg-red-500 text-white animate-pulse'
                : isMidTime
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="text-lg tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Soal {currentIndex + 1} dari {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border dark:border-slate-800 p-6 md:p-8 mb-5">
            <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed">
              <InlineMarkdown content={currentQ.question} />
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                // ⚡ FIX BUG: pakai currentIndex sebagai key
                const isSelected = answers[currentIndex] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers({ ...answers, [currentIndex]: i })}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 font-semibold'
                        : 'border-gray-200 dark:border-slate-700 hover:border-red-400 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      isSelected ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1"><InlineMarkdown content={opt} /></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex-1 py-3 rounded-xl font-semibold bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-600 transition-all"
            >
              ← Sebelumnya
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleManualSubmit}
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Submit Ujian ✓'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg"
              >
                Selanjutnya →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══ PHASE: RESULT ═══
  if (phase === 'result' && finalResult) {
    const passed = finalResult.score >= (exam.passingScore || 70);
    const isPerfect = finalResult.score === 100;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/ujian')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Ujian
          </button>

          <div className={`rounded-3xl shadow-xl border p-8 text-center mb-6 ${
            passed 
              ? 'bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-teal-900/20 border-teal-300 dark:border-teal-700'
              : 'bg-gradient-to-br from-red-50 via-orange-50 to-red-100 dark:from-red-900/20 dark:via-orange-900/10 dark:to-red-900/20 border-red-300 dark:border-red-700'
          }`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
              isPerfect
                ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-amber-500/50'
                : passed
                  ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 shadow-teal-500/50'
                  : 'bg-gradient-to-br from-red-400 via-orange-500 to-red-600 shadow-red-500/50'
            }`}>
              {passed ? <Award className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
            </div>

            {isPerfect && (
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3 shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> SEMPURNA!
              </div>
            )}

            <div className={`text-6xl font-extrabold mb-2 ${passed ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {finalResult.score}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {passed ? '🎉 SELAMAT! Kamu LULUS!' : 'Belum Lulus, Coba Lagi Nanti'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Passing grade: <strong>{exam.passingScore || 70}</strong>
            </p>

            <p className="text-xs text-gray-500">
              Benar {finalResult.correctCount} dari {finalResult.totalQuestions} soal
            </p>

            {finalResult.autoSubmitted && (
              <div className="mt-4 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <Timer className="w-4 h-4" /> ⏰ Auto-submit karena waktu habis
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-5 sm:p-6 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-500" /> Pembahasan Jawaban
            </h3>

            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                // ⚡ FIX BUG: pakai idx (index) sebagai key, bukan q.id
                const userAnswer = finalResult.answersSnapshot?.[idx];
                const isCorrect = userAnswer === q.correctAnswer;

                return (
                  <div key={idx} className="border-b border-gray-100 dark:border-slate-800 pb-4 last:border-0">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {idx + 1}. <InlineMarkdown content={q.question} />
                      </div>
                    </div>
                    <div className="ml-7 space-y-1.5 text-sm">
                      {q.options.map((opt, i) => {
                        const isRightAnswer = i === q.correctAnswer;
                        const isUserPick = i === userAnswer;
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-2 p-2 rounded-lg ${
                              isRightAnswer
                                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-semibold'
                                : isUserPick && !isCorrect
                                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through'
                                  : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                              isRightAnswer ? 'bg-teal-600 text-white' 
                              : isUserPick && !isCorrect ? 'bg-red-500 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1"><InlineMarkdown content={opt} /></span>
                            {isRightAnswer && <span className="text-[10px] font-bold">✓ BENAR</span>}
                            {isUserPick && !isCorrect && <span className="text-[10px] font-bold">✗ JAWABANMU</span>}
                          </div>
                        );
                      })}
                      {q.explanation && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                          💡 <strong>Pembahasan:</strong> <InlineMarkdown content={q.explanation} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => navigate('/ujian')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold shadow-lg"
          >
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamDetail;
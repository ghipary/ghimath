import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InlineMarkdown from '../components/InlineMarkdown';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader, ChevronLeft, Gamepad2, CheckCircle, ArrowRight, Flag, Trophy, Clock, RefreshCw, Home, AlertTriangle, Brain, Flame, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const DUMMY_QUESTIONS = [
  { id: 'd1', materialTitle: 'Matematika Dasar', difficulty: 'mudah', question: 'Berapakah hasil dari $12 + 15$?', options: ['$25$', '$27$', '$28$', '$30$'], correctAnswer: '$27$' },
  { id: 'd2', materialTitle: 'Aljabar', difficulty: 'mudah', question: 'Jika $x = 5$, berapakah nilai dari $3x + 2$?', options: ['$15$', '$16$', '$17$', '$18$'], correctAnswer: '$17$' },
  { id: 'd3', materialTitle: 'Geometri', difficulty: 'mudah', question: 'Rumus luas persegi panjang adalah...', options: ['$s \\times s$', '$p + l$', '$p \\times l$', '$2(p + l)$'], correctAnswer: '$p \\times l$' },
  { id: 'd4', materialTitle: 'Statistika', difficulty: 'sedang', question: 'Nilai yang paling sering muncul disebut...', options: ['Mean', 'Median', 'Modus', 'Range'], correctAnswer: 'Modus' },
  { id: 'd5', materialTitle: 'Trigonometri', difficulty: 'sedang', question: 'Nilai dari $\\sin 90°$ adalah...', options: ['$0$', '$\\frac{1}{2}$', '$1$', 'Tidak terdefinisi'], correctAnswer: '$1$' },
  { id: 'd6', materialTitle: 'Kalkulus', difficulty: 'sedang', question: 'Turunan dari $f(x) = x^2$ adalah...', options: ['$x$', '$2x$', '$x^2$', '$2$'], correctAnswer: '$2x$' },
  { id: 'd7', materialTitle: 'Bilangan', difficulty: 'mudah', question: 'Bilangan prima terkecil adalah...', options: ['$0$', '$1$', '$2$', '$3$'], correctAnswer: '$2$' },
  { id: 'd8', materialTitle: 'Aljabar', difficulty: 'sulit', question: 'Jika $x^2 - 5x + 6 = 0$, nilai $x$ adalah...', options: ['$1$ dan $6$', '$2$ dan $3$', '$3$ dan $4$', '$4$ dan $5$'], correctAnswer: '$2$ dan $3$' },
  { id: 'd9', materialTitle: 'Geometri', difficulty: 'sulit', question: 'Volume kubus dengan sisi $5$ cm adalah...', options: ['$25$ cm³', '$75$ cm³', '$100$ cm³', '$125$ cm³'], correctAnswer: '$125$ cm³' },
  { id: 'd10', materialTitle: 'Matematika Dasar', difficulty: 'sulit', question: 'Hasil dari $2^5 + 3^3$ adalah...', options: ['$59$', '$67$', '$72$', '$81$'], correctAnswer: '$59$' },
];

const QUIZ_LENGTH = 10;

const getDifficultyStyle = (diff) => {
  switch (diff) {
    case 'mudah': return { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-500/40', label: 'Mudah', emoji: '🟢' };
    case 'sulit': return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-500/40', label: 'Sulit', emoji: '🔴' };
    default: return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-500/40', label: 'Sedang', emoji: '🟡' };
  }
};

const QuizGabut = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUsingDummy, setIsUsingDummy] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user) return;
      try {
        const matQuery = query(collection(db, 'materials'), where('published', '==', true));
        const matSnap = await getDocs(matQuery);
        const materials = matSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let allQ = [];

        try {
          const qQuery = query(collection(db, 'questions'));
          const qSnap = await getDocs(qQuery);
          if (!qSnap.empty) {
            allQ = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) { console.warn("Collection 'questions' error:", e.message); }

        if (allQ.length === 0 && materials.length > 0) {
          materials.forEach(mat => {
            if (mat.questions && Array.isArray(mat.questions)) {
              mat.questions.forEach((q, idx) => {
                allQ.push({
                  id: `${mat.id}-q${idx}`,
                  materialId: mat.id,
                  materialTitle: mat.title,
                  difficulty: q.difficulty || 'sedang',
                  ...q
                });
              });
            }
          });
        }

        if (allQ.length === 0) {
          allQ = [...DUMMY_QUESTIONS];
          setIsUsingDummy(true);
        }

        setAllQuestions(allQ);
        startNewGame(allQ);
      } catch (error) {
        console.error('Gagal ambil soal:', error);
        setErrorMsg('Terjadi kesalahan saat memuat soal: ' + error.message);
      }
      setLoading(false);
    };
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startNewGame = (questionPool) => {
    if (!questionPool || questionPool.length === 0) return;

    const mudah = questionPool.filter(q => (q.difficulty || 'sedang') === 'mudah');
    const sedang = questionPool.filter(q => (q.difficulty || 'sedang') === 'sedang');
    const sulit = questionPool.filter(q => (q.difficulty || 'sedang') === 'sulit');

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const pickN = (arr, n) => shuffle(arr).slice(0, n);

    let selected = [
      ...pickN(mudah, 3),
      ...pickN(sedang, 4),
      ...pickN(sulit, 3),
    ];

    if (selected.length < QUIZ_LENGTH) {
      const selectedIds = new Set(selected.map(q => q.id));
      const rest = shuffle(questionPool.filter(q => !selectedIds.has(q.id)));
      selected = [...selected, ...rest].slice(0, QUIZ_LENGTH);
    }

    const mudahPicked = selected.filter(q => (q.difficulty || 'sedang') === 'mudah');
    const sedangPicked = selected.filter(q => (q.difficulty || 'sedang') === 'sedang');
    const sulitPicked = selected.filter(q => (q.difficulty || 'sedang') === 'sulit');
    const final = [...mudahPicked, ...sedangPicked, ...sulitPicked];

    while (final.length < QUIZ_LENGTH && questionPool.length > final.length) {
      const remaining = shuffle(questionPool).find(q => !final.includes(q));
      if (remaining) final.push(remaining);
      else break;
    }

    setQuestions(final.slice(0, QUIZ_LENGTH));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setIsFinished(false);
    setScore(0);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setErrorMsg('');
  };

  useEffect(() => {
    let interval;
    if (startTime && !isFinished) {
      interval = setInterval(() => setTimeElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  const fmtTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option) => setSelectedAnswer(option);

  const handleNext = () => {
    if (selectedAnswer === null) {
      toast.error('Pilih jawaban dulu!');
      return;
    }
    const currentQ = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    const newAnswer = { questionId: currentQ.id, selected: selectedAnswer, correct: currentQ.correctAnswer, isCorrect };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    if (isCorrect) setScore(prev => prev + 1);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      handleFinish(updatedAnswers);
    }
  };

  const handleFinish = async (finalAnswers = answers) => {
    if (selectedAnswer !== null && finalAnswers.length < currentIndex + 1) {
      const currentQ = questions[currentIndex];
      const isCorrect = selectedAnswer === currentQ.correctAnswer;
      finalAnswers.push({ questionId: currentQ.id, selected: selectedAnswer, correct: currentQ.correctAnswer, isCorrect });
      if (isCorrect) setScore(prev => prev + 1);
    }
    if (finalAnswers.length === 0) { toast.error('Belum ada jawaban!'); return; }

    setIsFinished(true);
    setSaving(true);
    const finalScore = Math.round((finalAnswers.filter(a => a.isCorrect).length / questions.length) * 100);
    const totalTime = Math.floor((Date.now() - startTime) / 1000);

    try {
      await addDoc(collection(db, 'quizResults'), {
        userId: user.uid,
        materialId: isUsingDummy ? 'random-quiz-dummy' : 'random-quiz-gabut',
        materialTitle: isUsingDummy ? 'Kuis Acak (Soal Cadangan)' : 'Kuis Acak (Game Gabut)',
        materialLevel: 'Campuran',
        materialGrade: 'Campuran',
        materialTopic: 'Campuran',
        score: finalScore,
        correctCount: finalAnswers.filter(a => a.isCorrect).length,
        totalQuestions: questions.length,
        bestTime: totalTime,
        completedAt: serverTimestamp(),
        type: 'random_quiz'
      });
      toast.success('Skor berhasil disimpan! 🎉');
    } catch (error) {
      console.error('Gagal simpan skor:', error);
      toast.error('Gagal menyimpan skor.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Menyiapkan soal acak...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="page-bg min-h-screen">
        <Navbar />
        <div className="page-content max-w-2xl mx-auto px-4 pt-12 text-center">
          <Gamepad2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h1>
          <p className="text-gray-500 mb-6">{errorMsg}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all">
            <Home className="w-5 h-5" /> Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat soal...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    const isPass = percentage >= 70;

    return (
      <div className="page-bg min-h-screen">
        <Navbar />
        <div className="page-content max-w-2xl mx-auto px-4 pt-8 sm:pt-12 pb-20">
          <div className={`relative overflow-hidden rounded-3xl p-8 text-center text-white shadow-2xl ${isPass ? 'bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700' : 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-500'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
                {isPass ? <Trophy className="w-10 h-10 text-white" /> : <RefreshCw className="w-10 h-10 text-white" />}
              </div>
              <h1 className="text-3xl font-bold mb-2">{isPass ? 'Luar Biasa! 🎉' : 'Tetap Semangat! 💪'}</h1>
              <p className="text-white/90 mb-6">{isPass ? 'Kamu berhasil menyelesaikan kuis acak.' : 'Coba lagi untuk hasil lebih baik!'}</p>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
                <div className="text-6xl font-extrabold mb-2">{percentage}</div>
                <p className="text-sm text-white/80 font-medium">SKOR AKHIR</p>
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
                  <div><div className="text-2xl font-bold">{correctCount}</div><p className="text-xs text-white/80">Benar</p></div>
                  <div><div className="text-2xl font-bold">{questions.length}</div><p className="text-xs text-white/80">Total Soal</p></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => startNewGame(allQuestions)}
                  className="flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition-all shadow-lg">
                  <RefreshCw className="w-5 h-5" /> Main Lagi
                </button>
                <Link to="/dashboard"
                  className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-all">
                  <Home className="w-5 h-5" /> Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const currentDiff = getDifficultyStyle(currentQ.difficulty);
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="page-bg min-h-screen">
      <Navbar />
      <div className="page-content max-w-3xl mx-auto px-4 pt-6 sm:pt-10 pb-20">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Keluar
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4 text-purple-500" />
              {fmtTime(timeElapsed)}
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-bold">
              Soal {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        {isUsingDummy && (
          <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3.5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">Mode Uji Coba</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
                Menggunakan soal cadangan. Admin bisa isi soal asli lewat <strong>Admin → Kelola Soal</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span>Tingkat kesulitan:</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 ${currentDiff.bg} ${currentDiff.text} ${currentDiff.border} border px-2.5 py-1 rounded-full font-bold text-[11px]`}>
            <span>{currentDiff.emoji}</span>
            <span>{currentDiff.label}</span>
          </div>
        </div>

        <div className="card-elevated rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-fuchsia-500"></div>
          <div className="mb-6 flex justify-between items-center">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
              {currentQ.materialTitle || 'Materi Campuran'}
            </span>
          </div>

          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
            <InlineMarkdown content={currentQ.question || currentQ.text || 'Soal tidak tersedia'} />
          </div>

          <div className="space-y-3">
            {(currentQ.options || []).map((option, idx) => {
              const isSelected = selectedAnswer === option;
              return (
                <button key={idx} onClick={() => handleSelectAnswer(option)}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                    {letters[idx]}
                  </div>
                  <span className={`text-sm sm:text-base ${isSelected ? 'font-semibold text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    <InlineMarkdown content={option} />
                  </span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-purple-500 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleFinish} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50">
            <Flag className="w-5 h-5" /> {saving ? 'Menyimpan...' : 'Finish'}
          </button>
          <button onClick={handleNext} disabled={selectedAnswer === null}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/30 transition-all">
            {currentIndex === questions.length - 1 ? 'Selesai' : 'Lanjut'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGabut;
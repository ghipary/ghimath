import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, RotateCcw, ArrowLeft, ListChecks, Loader } from 'lucide-react';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [material, setMaterial] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
  const [finished, setFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Ambil materi & soal
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil info materi
        const matSnap = await getDoc(doc(db, 'materials', id));
        if (matSnap.exists()) setMaterial({ id: matSnap.id, ...matSnap.data() });

        // Ambil soal
        const q = query(collection(db, 'quizQuestions'), where('materialId', '==', id));
        const qSnap = await getDocs(q);
        const data = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(data);
      } catch (error) {
        console.error('Gagal ambil soal:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Timer
  useEffect(() => {
    if (loading || finished || questions.length === 0) return;
    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [loading, finished, questions.length]);

  // Hitung skor
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

    // Simpan skor ke Firestore
    try {
      await addDoc(collection(db, 'quizResults'), {
        userId: user.uid,
        materialId: id,
        materialTitle: material?.title || 'Materi',
        score: result.score,
        correctCount: result.correct,
        totalQuestions: result.total,
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Gagal simpan skor:', error);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // === Tampilan LOADING ===
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  // === Kalau belum ada soal ===
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

  // === Tampilan HASIL (setelah selesai) ===
  if (finished) {
    const result = calculateScore();
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border dark:border-slate-800 p-8 text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              result.score >= 70 ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <span className={`text-3xl font-bold ${result.score >= 70 ? 'text-teal-600' : 'text-amber-600'}`}>
                {result.score}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {result.score >= 70 ? 'Hebat! 🎉' : 'Semangat! 💪'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Kamu menjawab benar {result.correct} dari {result.total} soal.
            </p>
            <p className="text-sm text-gray-400 mt-2">Waktu: {formatTime(elapsedTime)}</p>
          </div>

          {/* Pembahasan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 md:p-8 mb-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Pembahasan</h3>
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                  <div key={q.id} className="border-b dark:border-slate-800 pb-4 last:border-0">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="font-semibold text-gray-900 dark:text-white">{idx + 1}. {q.question}</p>
                    </div>
                    <div className="ml-7 space-y-1 text-sm">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-2 ${
                          i === q.correctAnswer ? 'text-teal-600 dark:text-teal-400 font-semibold' :
                          i === userAnswer && !isCorrect ? 'text-red-500 line-through' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          <span>{String.fromCharCode(65 + i)}.</span> {opt}
                          {i === q.correctAnswer && <span className="text-xs">(Benar)</span>}
                          {i === userAnswer && !isCorrect && <span className="text-xs">(Jawabanmu)</span>}
                        </div>
                      ))}
                      {q.explanation && (
                        <p className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => {
              setFinished(false); setAnswers({}); setCurrentIndex(0); setElapsedTime(0);
            }} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-semibold py-4 rounded-xl hover:border-teal-600 transition-all">
              <RotateCcw className="w-5 h-5" /> Ulangi Kuis
            </button>
            <button onClick={() => navigate(`/materi/${id}`)} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg">
              <ArrowLeft className="w-5 h-5" /> Kembali ke Materi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Tampilan SOAL ===
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        
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
            <div className="bg-teal-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
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
            <button onClick={handleFinish}
              className="flex-1 py-3 rounded-xl font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-lg">
              Selesai ✓
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(currentIndex + 1)}
              className="flex-1 py-3 rounded-xl font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-lg">
              Selanjutnya →
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Quiz;

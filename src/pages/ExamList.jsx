import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, Loader, Award, CheckCircle, Lock, AlertTriangle, Sparkles, FileText, Timer } from 'lucide-react';

const ExamList = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'examPackages'), where('published', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        setExams(data);

        if (user) {
          const rq = query(collection(db, 'examResults'), where('userId', '==', user.uid));
          const rSnap = await getDocs(rq);
          const map = {};
          rSnap.forEach((d) => {
            const r = d.data();
            map[r.examId] = { id: d.id, ...r };
          });
          setMyResults(map);
        }
      } catch (err) {
        console.error('Gagal memuat ujian:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-teal-600 dark:text-teal-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score, passing) => {
    if (score >= passing) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">✅ LULUS</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">❌ BELUM LULUS</span>;
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-red-200/50 dark:border-red-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-red-700 dark:text-red-400 mb-4 shadow-sm">
          <Timer className="w-3.5 h-3.5" />
          {exams.length} ujian tersedia
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 dark:from-red-400 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
          📝 Ujian
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ujian resmi dengan timer & soal acak. Lihat deskripsi file soal sebelum mulai, lalu login untuk mengerjakan.
        </p>
      </div>

      <div className="page-content max-w-5xl mx-auto px-4 py-4">
        {exams.length === 0 ? (
          <div className="text-center py-20 card-elevated rounded-2xl">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Belum ada ujian</h3>
            <p className="text-gray-500 mt-2">Admin belum membuat paket ujian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const result = myResults[exam.id];
              const isDone = !!result;
              const passed = result && result.score >= (exam.passingScore || 70);

              return (
                <Link
                  key={exam.id}
                  to={`/ujian/${exam.id}`}
                  className={`card-elevated rounded-2xl p-5 relative group hover:-translate-y-1 transition-all overflow-hidden ${
                    isDone ? 'border-2 border-teal-300/50 dark:border-teal-700/50' : 'border-2 border-red-200/50 dark:border-red-800/50'
                  }`}
                >
                  {/* Decorative */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${isDone ? 'bg-teal-400/10' : 'bg-red-400/10'}`}></div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        isDone
                          ? 'bg-gradient-to-br from-teal-400 to-cyan-600 shadow-teal-500/30'
                          : 'bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/30'
                      }`}>
                        {isDone ? <CheckCircle className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
                      </div>

                      {isDone ? (
                        <div className="text-right">
                          <div className={`text-3xl font-extrabold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </div>
                          <div className="text-[10px] text-gray-500">skor</div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> {exam.duration} menit
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
                      {exam.title}
                    </h3>

                    {exam.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {exam.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                        <span>{exam.questions?.length || 0} soal</span>
                        <span>•</span>
                        <span>Passing: {exam.passingScore || 70}</span>
                      </div>

                      {isDone ? (
                        <div>{getScoreBadge(result.score, exam.passingScore || 70)}</div>
                      ) : (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          Mulai →
                        </span>
                      )}
                    </div>

                    {isDone && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">
                          Dikerjakan: {result.submittedAt ? new Date(result.submittedAt.toDate()).toLocaleDateString('id-ID') : '-'}
                        </span>
                        {result.autoSubmitted && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">⏰ Auto-submit</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;
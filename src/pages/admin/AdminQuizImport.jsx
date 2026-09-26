import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Upload, CheckCircle, Loader, Info, FileText, Settings, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminQuizImport = () => {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState('input');

  const parseQuizText = (raw) => {
    const parsedQuestions = [];
    const parseErrors = [];
    const blocks = raw.split(/\n(?=\s*\d+\.\s)/).map((b) => b.trim()).filter(Boolean);

    blocks.forEach((block, idx) => {
      try {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const questionLine = lines[0].replace(/^\d+\.\s*/, '').trim();
        if (!questionLine) throw new Error('Pertanyaan kosong');
        const options = ['', '', '', ''];
        let correctAnswer = -1;
        let explanation = '';
        lines.slice(1).forEach((line) => {
          const optMatch = line.match(/^([A-Da-d])\.\s*(.+)/);
          if (optMatch) {
            const letter = optMatch[1].toUpperCase();
            options[letter.charCodeAt(0) - 65] = optMatch[2].trim();
            return;
          }
          const answerMatch = line.match(/^Jawaban\s*:\s*([A-Da-d])/i);
          if (answerMatch) { correctAnswer = answerMatch[1].toUpperCase().charCodeAt(0) - 65; return; }
          const explMatch = line.match(/^Pembahasan\s*:\s*(.+)/i);
          if (explMatch) { explanation = explMatch[1].trim(); }
        });
        if (options.some((o) => !o)) throw new Error('Opsi A-D tidak lengkap');
        if (correctAnswer === -1) throw new Error('Jawaban tidak valid');
        parsedQuestions.push({ question: questionLine, options, correctAnswer, explanation });
      } catch (err) { parseErrors.push(`Soal #${idx + 1}: ${err.message}`); }
    });
    return { parsedQuestions, parseErrors };
  };

  const handleParse = () => {
    if (!text.trim()) return toast.error('Teks masih kosong!');
    const { parsedQuestions, parseErrors } = parseQuizText(text);
    setParsed(parsedQuestions);
    setErrors(parseErrors);
    setStep('preview');
    if (parsedQuestions.length === 0) toast.error('Tidak ada soal valid yang terdeteksi');
    else toast.success(`${parsedQuestions.length} soal berhasil diparse! ✅`);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return toast.error('Tidak ada soal untuk diimport');
    try {
      setImporting(true);
      let successCount = 0;
      for (const q of parsed) {
        await addDoc(collection(db, 'quizQuestions'), {
          materialId, question: q.question, options: q.options,
          correctAnswer: q.correctAnswer, explanation: q.explanation,
          createdAt: serverTimestamp(),
        });
        successCount++;
      }
      toast.success(`${successCount} soal berhasil diimport! 🎉`);
      setTimeout(() => navigate(`/admin/materi/${materialId}/soal`), 1500);
    } catch (err) { toast.error('Gagal import: ' + err.message); }
    setImporting(false);
  };

  const sampleFormat = `1. Berapakah hasil dari 2 + 2?
A. 3
B. 4
C. 5
D. 6
Jawaban: B
Pembahasan: 2 + 2 = 4

2. Berapakah hasil dari 3 × 3?
A. 6
B. 9
C. 12
D. 15
Jawaban: B
Pembahasan: 3 × 3 = 9`;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        <button onClick={() => navigate(`/admin/materi/${materialId}/soal`)} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelola Soal
        </button>
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 shadow-sm">
          <Upload className="w-3.5 h-3.5" /> IMPORT SOAL
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
          Import Soal Kuis 📥
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Paste soal sekaligus — nggak perlu input satu per satu!</p>
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 space-y-6">
        
        {step === 'input' && (
          <>
            <div className="card-elevated rounded-2xl p-5 sm:p-6 border-l-4 border-l-teal-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-500/30">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  <p className="font-bold mb-3">📝 Format Soal:</p>
                  <pre className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700">
{sampleFormat}
                  </pre>
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Aturan:</strong> Soal diawali angka + titik, opsi A-D, lalu "Jawaban: X". Pembahasan opsional. Pisahkan soal dengan 1 baris kosong.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-elevated rounded-2xl p-5 sm:p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Paste Soal Kamu di Sini
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                placeholder="Paste soal di sini..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">{text.length} karakter</span>
                <button onClick={() => setText(sampleFormat)} className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold">Isi contoh</button>
              </div>
            </div>

            <button onClick={handleParse} disabled={!text.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all">
              <Upload className="w-5 h-5" /> Proses & Preview
            </button>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="card-elevated rounded-2xl p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                Preview Soal
              </h2>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 rounded-xl p-4 text-center border border-teal-200/60 dark:border-teal-800/50">
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{parsed.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Soal Valid</div>
                </div>
                {errors.length > 0 && (
                  <div className="flex-1 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/10 rounded-xl p-4 text-center border border-red-200/60 dark:border-red-800/50">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{errors.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Gagal</div>
                  </div>
                )}
              </div>
              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Soal yang gagal:</p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                    {errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="card-elevated rounded-2xl p-5 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Daftar Soal</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {parsed.map((q, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-teal-50/30 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">{idx + 1}. {q.question}</p>
                    <ul className="space-y-1 text-sm mb-2">
                      {q.options.map((opt, i) => (
                        <li key={i} className={`flex items-center gap-2 ${i === q.correctAnswer ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                          <span>{String.fromCharCode(65 + i)}.</span> {opt}
                          {i === q.correctAnswer && <CheckCircle className="w-3.5 h-3.5" />}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-white dark:bg-slate-900 p-2 rounded border border-gray-100 dark:border-slate-700/50">💡 {q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setStep('input')}
                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white font-semibold py-4 rounded-xl transition-all hover:border-amber-500">
                <ArrowLeft className="w-5 h-5" /> Edit Teks
              </button>
              <button onClick={handleImport} disabled={importing || parsed.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/30">
                {importing ? <><Loader className="w-5 h-5 animate-spin" /> Mengimport...</> : <><Upload className="w-5 h-5" /> Import {parsed.length} Soal</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminQuizImport;
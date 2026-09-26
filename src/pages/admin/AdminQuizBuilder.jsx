import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Save, Loader, CheckCircle, Upload, AlertTriangle, X, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminQuizBuilder = () => {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });

  const fetchQuestions = async () => {
    try {
      const q = query(collection(db, 'quizQuestions'), where('materialId', '==', materialId));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQuestions(data);
    } catch (error) { toast.error('Gagal memuat soal'); }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [materialId]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim()) return toast.error('Pertanyaan tidak boleh kosong!');
    if (formData.options.some((opt) => !opt.trim())) return toast.error('Semua 4 opsi harus diisi!');
    try {
      setSaving(true);
      await addDoc(collection(db, 'quizQuestions'), {
        materialId, question: formData.question, options: formData.options,
        correctAnswer: Number(formData.correctAnswer), explanation: formData.explanation,
        createdAt: serverTimestamp()
      });
      toast.success('Soal berhasil ditambahkan! ✏️');
      setFormData({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });
      fetchQuestions();
    } catch (error) { toast.error('Gagal menyimpan: ' + error.message); }
    setSaving(false);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      await deleteDoc(doc(db, 'quizQuestions', questionId));
      setQuestions(questions.filter((q) => q.id !== questionId));
      toast.success('Soal berhasil dihapus! 🗑️');
    } catch (error) { toast.error('Gagal menghapus: ' + error.message); }
  };

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true);
      const deletePromises = questions.map((q) => deleteDoc(doc(db, 'quizQuestions', q.id)));
      await Promise.all(deletePromises);
      setQuestions([]);
      setShowConfirm(false);
      toast.success(`${deletePromises.length} soal berhasil dihapus! 🗑️`);
    } catch (error) { toast.error('Gagal menghapus semua soal: ' + error.message); }
    setDeletingAll(false);
  };

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        <button onClick={() => navigate('/admin/materi')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelola Materi
        </button>
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 shadow-sm">
          <Settings className="w-3.5 h-3.5" /> KELOLA SOAL
        </div>
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Kelola Soal Kuis
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Total: {questions.length} soal</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {questions.length > 0 && (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-red-500/30">
                <Trash2 className="w-4 h-4" /> Hapus Semua
              </button>
            )}
            <Link to={`/admin/materi/${materialId}/import`}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30">
              <Upload className="w-4 h-4" /> Import Soal 📥
            </Link>
          </div>
        </div>
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Banner Import */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
          <div className="relative flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-white/30">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Males Input Satu-satu? 📥</h3>
              <p className="text-amber-50 text-sm mb-3">Paste banyak soal sekaligus, sistem otomatis memparsing!</p>
              <Link to={`/admin/materi/${materialId}/import`} className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-4 py-2 rounded-lg text-sm hover:bg-orange-50 transition-colors shadow-md">
                Coba Sekarang →
              </Link>
            </div>
          </div>
        </div>

        {/* Form Tambah */}
        <form onSubmit={handleSubmit} className="card-elevated rounded-2xl p-5 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
            Tambah Soal Manual
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pertanyaan *</label>
            <textarea required rows={2} value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Misal: Berapakah hasil dari 2x + 3 = 11?" />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pilihan Jawaban *</label>
            {formData.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="radio" name="correct" checked={formData.correctAnswer === i}
                  onChange={() => setFormData({ ...formData, correctAnswer: i })}
                  className="w-5 h-5 text-teal-600 focus:ring-teal-500" />
                <span className="font-bold text-gray-700 dark:text-gray-300 w-6">{String.fromCharCode(65 + i)}.</span>
                <input type="text" required value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
              </div>
            ))}
            <p className="text-xs text-gray-500 dark:text-gray-400">Klik tombol radio di kiri untuk menandai jawaban benar.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pembahasan (Opsional)</label>
            <textarea rows={2} value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Jelaskan kenapa jawabannya itu." />
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/30">
            <Save className="w-5 h-5" /> {saving ? 'Menyimpan...' : 'Tambah Soal'}
          </button>
        </form>

        {/* Daftar Soal */}
        <div className="card-elevated rounded-2xl p-5 sm:p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Soal ({questions.length})</h2>
            {questions.length > 0 && (
              <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-semibold hover:underline">
                <Trash2 className="w-4 h-4" /> Hapus Semua
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-10"><Loader className="w-8 h-8 text-teal-600 animate-spin mx-auto" /></div>
          ) : questions.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Belum ada soal. Tambahkan soal di atas atau import dari teks.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-gradient-to-br from-gray-50 to-teal-50/30 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl border border-gray-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">{idx + 1}. {q.question}</p>
                      <ul className="space-y-1 text-sm">
                        {q.options.map((opt, i) => (
                          <li key={i} className={`flex items-start gap-2 ${i === q.correctAnswer ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span className="flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                            <span className="flex-1">{opt}</span>
                            {i === q.correctAnswer && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                          </li>
                        ))}
                      </ul>
                      {q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Pembahasan: {q.explanation}</p>}
                    </div>
                    <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0 transition-colors" title="Hapus soal ini">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => !deletingAll && setShowConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowConfirm(false)} disabled={deletingAll}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/30">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Hapus Semua Soal?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
              Kamu akan menghapus <strong className="text-red-600 dark:text-red-400">{questions.length} soal</strong> dari kuis ini. Tindakan ini <strong>tidak bisa dibatalkan</strong>.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteAll} disabled={deletingAll}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/30">
                {deletingAll ? <><Loader className="w-5 h-5 animate-spin" /> Menghapus...</> : <><Trash2 className="w-5 h-5" /> Ya, Hapus Semua ({questions.length} soal)</>}
              </button>
              <button onClick={() => setShowConfirm(false)} disabled={deletingAll}
                className="w-full bg-white dark:bg-slate-700 text-gray-700 dark:text-white border-2 border-gray-200 dark:border-slate-600 hover:border-teal-600 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizBuilder;
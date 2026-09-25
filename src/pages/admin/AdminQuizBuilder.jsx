import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Save, Loader, CheckCircle } from 'lucide-react';

const AdminQuizBuilder = () => {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  const fetchQuestions = async () => {
    try {
      const q = query(collection(db, 'quizQuestions'), where('materialId', '==', materialId));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQuestions(data);
    } catch (error) {
      console.error('Gagal ambil soal:', error);
    }
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
    // Validasi
    if (!formData.question.trim()) return alert('Pertanyaan tidak boleh kosong!');
    if (formData.options.some((opt) => !opt.trim())) return alert('Semua 4 opsi harus diisi!');

    try {
      setSaving(true);
      await addDoc(collection(db, 'quizQuestions'), {
        materialId,
        question: formData.question,
        options: formData.options,
        correctAnswer: Number(formData.correctAnswer),
        explanation: formData.explanation,
        createdAt: serverTimestamp()
      });
      alert('Soal berhasil ditambahkan!');
      setFormData({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });
      fetchQuestions();
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      await deleteDoc(doc(db, 'quizQuestions', questionId));
      setQuestions(questions.filter((q) => q.id !== questionId));
      alert('Soal berhasil dihapus!');
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/admin/materi')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Kelola Materi
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Kelola Soal Kuis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Total: {questions.length} soal</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Form Tambah Soal */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 md:p-8 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-600" /> Tambah Soal Baru
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pertanyaan *</label>
            <textarea required rows={2} value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
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
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
              </div>
            ))}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Klik tombol radio di sebelah kiri untuk menandai jawaban yang benar.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pembahasan (Opsional)</label>
            <textarea rows={2} value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Jelaskan kenapa jawabannya itu." />
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 rounded-xl transition-all">
            <Save className="w-5 h-5" /> {saving ? 'Menyimpan...' : 'Tambah Soal'}
          </button>
        </form>

        {/* Daftar Soal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 md:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Daftar Soal</h2>
          {loading ? (
            <div className="text-center py-10"><Loader className="w-8 h-8 text-teal-600 animate-spin mx-auto" /></div>
          ) : questions.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Belum ada soal. Tambahkan soal di atas.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">{idx + 1}. {q.question}</p>
                      <ul className="space-y-1 text-sm">
                        {q.options.map((opt, i) => (
                          <li key={i} className={`flex items-center gap-2 ${i === q.correctAnswer ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span>{String.fromCharCode(65 + i)}.</span> {opt}
                            {i === q.correctAnswer && <CheckCircle className="w-4 h-4" />}
                          </li>
                        ))}
                      </ul>
                      {q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Pembahasan: {q.explanation}</p>}
                    </div>
                    <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuizBuilder;
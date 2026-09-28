import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import InlineMarkdown from '../../components/InlineMarkdown';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Plus, Trash2, Edit, X, Save, FileText, Clock, CheckCircle, Loader, AlertTriangle, Upload, Wand2, Square, CheckSquare, Trophy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_FORM = {
  title: '',
  description: '',
  duration: 60,
  passingScore: 70,
  shuffleQuestions: true,
  shuffleOptions: true,
  published: false,
  questions: [],
};

const TEMPLATE_EXAMPLE = `1. Akar-akar persamaan $x^2 - (k+2)x + (2k-1) = 0$ adalah $p$ dan $q$. Jika $p^2 + q^2 = 22$, maka nilai $k$ positif yang memenuhi adalah...
A. $4$
B. $7$
C. $8$
D. $10$
Jawaban: A
Pembahasan: Dari $p + q = k + 2$ dan $pq = 2k - 1$, maka $p^2 + q^2 = (p+q)^2 - 2pq = 22$. Substitusi: $(k+2)^2 - 2(2k-1) = 22$, jadi $k^2 = 16$, sehingga $k = 4$.

2. Berapakah nilai dari $|-7|$?
A. $-7$
B. $0$
C. $7$
D. $14$
Jawaban: C
Pembahasan: Nilai mutlak selalu positif, jadi $|-7| = 7$.

3. Nilai dari $\frac{1}{2} + \frac{1}{4}$ adalah...
A. $\frac{1}{6}$
B. $\frac{2}{6}$
C. $\frac{3}{4}$
D. $\frac{2}{8}$
Jawaban: C
Pembahasan: Samakan penyebut, $\frac{2}{4} + \frac{1}{4} = \frac{3}{4}$.`;

const AdminExamManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showQuestionPreview, setShowQuestionPreview] = useState(true);

  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('');
  const [deletingBulk, setDeletingBulk] = useState(false);

  const fetchExams = async () => {
    try {
      const snap = await getDocs(collection(db, 'examPackages'));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setExams(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat ujian');
    }
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const openCreate = () => {
    setFormData(DEFAULT_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (exam) => {
    setFormData({
      title: exam.title || '',
      description: exam.description || '',
      duration: exam.duration || 60,
      passingScore: exam.passingScore || 70,
      shuffleQuestions: exam.shuffleQuestions !== false,
      shuffleOptions: exam.shuffleOptions !== false,
      published: exam.published || false,
      questions: exam.questions || [],
    });
    setEditingId(exam.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return toast.error('Judul ujian wajib diisi!');
    if (formData.questions.length === 0) return toast.error('Minimal 1 soal!');

    setSaving(true);
    try {
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number(formData.duration) || 60,
        passingScore: Number(formData.passingScore) || 70,
        shuffleQuestions: !!formData.shuffleQuestions,
        shuffleOptions: !!formData.shuffleOptions,
        published: !!formData.published,
        questions: formData.questions,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'examPackages', editingId), dataToSave);
        toast.success('Ujian diupdate! ✅');
      } else {
        await addDoc(collection(db, 'examPackages'), {
          ...dataToSave,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
        toast.success('Ujian dibuat! 🎉');
      }

      setShowModal(false);
      setFormData(DEFAULT_FORM);
      setEditingId(null);
      fetchExams();
    } catch (err) {
      toast.error('Gagal simpan: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Hapus ujian "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'examPackages', id));
      toast.success('Ujian dihapus');
      setExams((prev) => prev.filter((e) => e.id !== id));
      setSelectedExamIds((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message);
    }
  };

  const toggleSelectExam = (id) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllExams = () => {
    if (selectedExamIds.length === exams.length) setSelectedExamIds([]);
    else setSelectedExamIds(exams.map((e) => e.id));
  };

  const handleDeleteSelectedExams = async () => {
    if (selectedExamIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedExamIds.length} ujian yang dipilih?`)) return;

    setDeletingBulk(true);
    try {
      const chunks = [];
      for (let i = 0; i < selectedExamIds.length; i += 500) {
        chunks.push(selectedExamIds.slice(i, i + 500));
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((id) => batch.delete(doc(db, 'examPackages', id)));
        await batch.commit();
      }
      toast.success(`${selectedExamIds.length} ujian dihapus! 🗑️`);
      setSelectedExamIds([]);
      fetchExams();
    } catch (err) {
      toast.error('Gagal: ' + err.message);
    }
    setDeletingBulk(false);
  };

  const handleDeleteAllExams = async () => {
    if (deleteAllConfirm !== 'HAPUS') return toast.error('Ketik "HAPUS" untuk konfirmasi');
    setDeletingBulk(true);
    try {
      const allIds = exams.map((e) => e.id);
      const chunks = [];
      for (let i = 0; i < allIds.length; i += 500) {
        chunks.push(allIds.slice(i, i + 500));
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((id) => batch.delete(doc(db, 'examPackages', id)));
        await batch.commit();
      }
      toast.success(`🧹 ${allIds.length} ujian DIHAPUS SEMUA!`);
      setShowDeleteAllModal(false);
      setDeleteAllConfirm('');
      setSelectedExamIds([]);
      fetchExams();
    } catch (err) {
      toast.error('Gagal: ' + err.message);
    }
    setDeletingBulk(false);
  };

  // ⚡ Parser Bulk Paste (support LaTeX)
  const parseBulkQuestions = (text) => {
    const questions = [];
    const blocks = text.trim().split(/\n(?=\s*\d+[\.\)]\s)/);

    blocks.forEach((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      let question = '';
      const options = [];
      let correctAnswer = -1;
      let explanation = '';

      lines.forEach((line, lineIdx) => {
        const qMatch = line.match(/^\d+[\.\)]\s*(.+)/);
        if (qMatch && lineIdx === 0) {
          question = qMatch[1].trim();
          return;
        }

        const optMatch = line.match(/^([A-Da-d])[\.\)]\s*(.+)/);
        if (optMatch) {
          options.push(optMatch[2].trim());
          return;
        }

        const ansMatch = line.match(/^(?:Jawaban|Answer|Ans)\s*[:=]\s*([A-Da-d])/i);
        if (ansMatch) {
          correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
          return;
        }

        const expMatch = line.match(/^(?:Pembahasan|Explanation)\s*[:=]\s*(.+)/i);
        if (expMatch) {
          explanation = expMatch[1].trim();
          return;
        }

        if (explanation && !qMatch && !optMatch && !ansMatch) {
          explanation += ' ' + line;
        } else if (!question) {
          question = line;
        }
      });

      if (question && options.length >= 2 && correctAnswer >= 0) {
        const paddedOptions = [...options];
        while (paddedOptions.length < 4) paddedOptions.push('');
        questions.push({
          question,
          options: paddedOptions.slice(0, 4),
          correctAnswer,
          explanation,
        });
      }
    });

    return questions;
  };

  const handleBulkPaste = () => {
    const parsed = parseBulkQuestions(bulkText);
    if (parsed.length === 0) {
      toast.error('Format tidak valid. Cek contoh format.');
      return;
    }
    setFormData((prev) => ({ ...prev, questions: [...prev.questions, ...parsed] }));
    toast.success(`${parsed.length} soal berhasil ditambahkan! 🎉`);
    setBulkText('');
    setShowBulkPaste(false);
  };

  const handleFillTemplate = () => {
    setBulkText(TEMPLATE_EXAMPLE);
    toast.success('Template contoh terisi! Klik "Parse & Tambah Soal" 📋');
  };

  const updateQuestion = (idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const removeQuestion = (idx) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return <div className="page-bg flex items-center justify-center min-h-screen"><Loader className="w-10 h-10 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Admin
        </button>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/30">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
              Kelola Ujian
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total: {exams.length} paket ujian</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-red-500/30"
          >
            <Plus className="w-5 h-5" /> Buat Ujian Baru
          </button>
        </div>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        {exams.length > 0 && (
          <div className="card-elevated rounded-2xl p-4 mb-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={toggleSelectAllExams}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {selectedExamIds.length === exams.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedExamIds.length === exams.length ? 'Batal Pilih' : 'Pilih Semua'}
            </button>

            {selectedExamIds.length > 0 && (
              <button
                onClick={handleDeleteSelectedExams}
                disabled={deletingBulk}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Hapus {selectedExamIds.length} Terpilih
              </button>
            )}

            <div className="flex-1"></div>

            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-sm font-bold shadow-lg"
            >
              <AlertTriangle className="w-4 h-4" /> Hapus Semua
            </button>
          </div>
        )}

        {exams.length === 0 ? (
          <div className="card-elevated rounded-2xl text-center py-16 px-4">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Belum ada ujian</h3>
            <p className="text-gray-500 text-sm mb-4">Klik "Buat Ujian Baru" untuk mulai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const isSelected = selectedExamIds.includes(exam.id);
              return (
                <div
                  key={exam.id}
                  className={`card-elevated rounded-2xl p-5 transition-all ${
                    isSelected ? 'ring-2 ring-red-400 dark:ring-red-600 border-red-300' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleSelectExam(exam.id)}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 dark:bg-slate-700 text-transparent'
                        }`}
                      >
                        {isSelected ? <CheckCircle className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{exam.title}</h3>
                          {exam.published ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">✓ Publish</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">Draft</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{exam.description || 'Tanpa deskripsi'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button 
                        onClick={() => navigate(`/admin/ujian/${exam.id}/results`)} 
                        className="p-2 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-600"
                        title="Lihat Nilai Siswa"
                      >
                        <Trophy className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(exam)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(exam.id, exam.title)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="text-center">
                      <Clock className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{exam.duration}</p>
                      <p className="text-[10px] text-gray-500">menit</p>
                    </div>
                    <div className="text-center">
                      <FileText className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{exam.questions?.length || 0}</p>
                      <p className="text-[10px] text-gray-500">soal</p>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="w-4 h-4 text-violet-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{exam.passingScore}</p>
                      <p className="text-[10px] text-gray-500">passing</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl my-8 relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-5 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Ujian' : 'Buat Ujian Baru'}</h2>
                  <p className="text-[10px] text-white/80">Atur waktu, soal, dan kriteria kelulusan</p>
                </div>
              </div>
              {!saving && (
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-white/20">
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Judul Ujian *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Misal: TKA Matematika Kelas 12"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi ujian (opsional)"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Durasi (menit) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Passing Score *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Acak Soal</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffleOptions}
                    onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Acak Pilihan</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Publish</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Soal Ujian ({formData.questions.length} soal)
                  </label>
                  <button
                    onClick={() => setShowBulkPaste(!showBulkPaste)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <Upload className="w-3.5 h-3.5" /> {showBulkPaste ? 'Tutup' : 'Bulk Paste Soal'}
                  </button>
                </div>

                {showBulkPaste && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">Format Bulk Paste (support LaTeX):</p>
                      <button
                        type="button"
                        onClick={handleFillTemplate}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        📋 Isi Template Contoh
                      </button>
                    </div>
                    <pre className="text-[10px] bg-white dark:bg-slate-800 p-3 rounded-lg mb-3 overflow-x-auto text-gray-700 dark:text-gray-300">
{`1. Berapakah $(+5) + (-3)$?
A. $-8$
B. $-2$
C. $+2$
D. $+8$
Jawaban: C
Pembahasan: $(+5) + (-3) = 5 - 3 = 2$`}
                    </pre>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="Paste soal di sini..."
                      rows={12}
                      className="w-full px-3 py-2 rounded-lg border border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                    />
                    <button
                      onClick={handleBulkPaste}
                      className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm shadow-lg"
                    >
                      <Wand2 className="w-4 h-4 inline mr-1.5" /> Parse & Tambah Soal
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setFormData({ ...formData, questions: [...formData.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }] })}
                  className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold text-sm mb-3"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Tambah Soal Manual
                </button>

                {formData.questions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowQuestionPreview(!showQuestionPreview)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-100 dark:bg-violet-900/20 hover:bg-violet-200 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold transition-all mb-3"
                  >
                    {showQuestionPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showQuestionPreview ? 'Sembunyikan Preview Render' : 'Tampilkan Preview Render (LaTeX)'}
                  </button>
                )}

                <div className="space-y-3">
                  {formData.questions.map((q, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500">Soal #{idx + 1}</span>
                        <button onClick={() => removeQuestion(idx)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                        placeholder="Soal... (bisa pakai $x^2$ untuk rumus)"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-sm mb-2 focus:ring-2 focus:ring-red-500 outline-none resize-none font-mono"
                      />

                      {showQuestionPreview && q.question.trim() && (
                        <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-violet-200 dark:border-violet-800/50">
                          <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1.5">
                            👁️ Preview Soal
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            <InlineMarkdown content={q.question} />
                          </div>
                        </div>
                      )}

                      {q.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5">
                          <button
                            onClick={() => updateQuestion(idx, 'correctAnswer', i)}
                            className={`w-6 h-6 rounded-full flex-shrink-0 text-[10px] font-bold ${
                              q.correctAnswer === i ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                            }`}
                            title="Tandai jawaban benar"
                          >
                            {String.fromCharCode(65 + i)}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[i] = e.target.value;
                              updateQuestion(idx, 'options', newOpts);
                            }}
                            placeholder={`Pilihan ${String.fromCharCode(65 + i)} (bisa pakai $x^2$)`}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-red-500 outline-none font-mono"
                          />
                          {showQuestionPreview && opt.trim() && (
                            <div className="text-xs text-gray-700 dark:text-gray-300 min-w-[60px] flex-shrink-0">
                              <InlineMarkdown content={opt} />
                            </div>
                          )}
                        </div>
                      ))}
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                        placeholder="Pembahasan (opsional, bisa pakai $x^2$)"
                        className="w-full mt-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-red-500 outline-none font-mono"
                      />
                      {showQuestionPreview && q.explanation && q.explanation.trim() && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 text-xs text-blue-800 dark:text-blue-300">
                          💡 <strong>Pembahasan:</strong> <InlineMarkdown content={q.explanation} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white font-bold shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> {editingId ? 'Update' : 'Buat Ujian'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS SEMUA */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => !deletingBulk && setShowDeleteAllModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Hapus SEMUA Ujian?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-5">
              Kamu akan menghapus <strong className="text-red-600 dark:text-red-400">{exams.length} ujian</strong> secara PERMANEN. Tindakan ini <strong>tidak bisa dibatalkan</strong>.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800 dark:text-amber-300 mb-2 font-semibold">Ketik "HAPUS" untuk konfirmasi:</p>
              <input
                type="text"
                value={deleteAllConfirm}
                onChange={(e) => setDeleteAllConfirm(e.target.value.toUpperCase())}
                placeholder="HAPUS"
                autoFocus
                disabled={deletingBulk}
                className="w-full px-3 py-2 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-center text-lg font-bold tracking-widest text-red-600 focus:ring-2 focus:ring-red-500 outline-none uppercase"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteAllModal(false); setDeleteAllConfirm(''); }}
                disabled={deletingBulk}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAllExams}
                disabled={deletingBulk || deleteAllConfirm !== 'HAPUS'}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deletingBulk ? <><Loader className="w-4 h-4 animate-spin" /> Hapus...</> : <><Trash2 className="w-4 h-4" /> HAPUS SEMUA</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExamManager;
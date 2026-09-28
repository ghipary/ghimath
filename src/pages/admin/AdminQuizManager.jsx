import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, Search, BookOpen, CheckCircle, ChevronLeft, Loader, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminQuizManager = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    materialTitle: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  // ⚡ FETCH DATA SOAL
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(collection(db, 'questions'));
      const data = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Urutkan berdasarkan tanggal dibuat (terbaru di atas)
      data.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      console.error('Gagal ambil soal:', error);
      toast.error('Gagal memuat data soal. Pastikan collection "questions" sudah ada.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ⚡ FILTER PENCARIAN
  useEffect(() => {
    if (!searchQuery) {
      setFilteredQuestions(questions);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredQuestions(questions.filter(q => 
        (q.question || '').toLowerCase().includes(lower) || 
        (q.materialTitle || '').toLowerCase().includes(lower)
      ));
    }
  }, [searchQuery, questions]);

  // ⚡ BUKA MODAL TAMBAH
  const handleOpenAdd = () => {
    setFormData({
      materialTitle: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    });
    setIsEditing(false);
    setCurrentId(null);
    setIsModalOpen(true);
  };

  // ⚡ BUKA MODAL EDIT
  const handleOpenEdit = (q) => {
    setFormData({
      materialTitle: q.materialTitle || '',
      question: q.question || '',
      options: q.options && q.options.length > 0 ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correctAnswer: q.correctAnswer || ''
    });
    setIsEditing(true);
    setCurrentId(q.id);
    setIsModalOpen(true);
  };

  // ⚡ HAPUS SOAL
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      toast.success('Soal berhasil dihapus! 🗑️');
      fetchQuestions();
    } catch (error) {
      toast.error('Gagal menghapus soal: ' + error.message);
    }
  };

  // ⚡ SIMPAN SOAL (TAMBAH / EDIT)
  const handleSave = async () => {
    // Validasi
    if (!formData.question || !formData.correctAnswer || !formData.materialTitle) {
      toast.error('Mohon isi Judul Materi, Pertanyaan, dan Kunci Jawaban!');
      return;
    }
    
    const cleanOptions = formData.options.filter(opt => opt.trim() !== '');
    if (cleanOptions.length < 2) {
      toast.error('Minimal harus ada 2 pilihan jawaban!');
      return;
    }

    if (!cleanOptions.includes(formData.correctAnswer)) {
      toast.error('Kunci jawaban harus salah satu dari pilihan yang diisi!');
      return;
    }

    setSaving(true);
    const payload = {
      materialTitle: formData.materialTitle,
      question: formData.question,
      options: cleanOptions,
      correctAnswer: formData.correctAnswer,
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'questions', currentId), payload);
        toast.success('Soal berhasil diperbarui! ✅');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'questions'), payload);
        toast.success('Soal baru berhasil ditambahkan! 🎉');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (error) {
      toast.error('Gagal menyimpan soal: ' + error.message);
    }
    setSaving(false);
  };

  // ⚡ HANDLE INPUT FORM
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Admin Panel
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                Kelola Soal Kuis
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Tambah, edit, dan hapus soal untuk Kuis Acak (Game Gabut).
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Tambah Soal Baru
          </button>
        </div>
      </div>

      <div className="page-content max-w-5xl mx-auto px-4 py-4">
        
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari soal atau materi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
          />
        </div>

        {/* Daftar Soal */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat soal...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="card-elevated rounded-2xl p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Soal</h3>
            <p className="text-gray-500 mb-6">Database soal masih kosong. Klik tombol "Tambah Soal Baru" untuk memulai.</p>
            <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all">
              <Plus className="w-5 h-5" /> Tambah Soal Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                    {q.materialTitle || 'Tanpa Materi'}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(q)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-2">{q.question}</h4>
                <div className="space-y-1.5">
                  {(q.options || []).map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${opt === q.correctAnswer ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${opt === q.correctAnswer ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-gray-100 dark:bg-slate-700'}`}>
                        {letters[i]}
                      </span>
                      <span className="truncate">{opt}</span>
                      {opt === q.correctAnswer && <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {isEditing ? <Edit2 className="w-5 h-5 text-teal-600" /> : <Plus className="w-5 h-5 text-teal-600" />}
                {isEditing ? 'Edit Soal' : 'Tambah Soal Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Judul Materi / Topik</label>
                <input 
                  type="text" 
                  value={formData.materialTitle} 
                  onChange={(e) => setFormData({...formData, materialTitle: e.target.value})}
                  placeholder="Contoh: Aljabar, Geometri, Trigonometri..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pertanyaan</label>
                <textarea 
                  value={formData.question} 
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  placeholder="Tulis pertanyaan di sini..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilihan Jawaban</label>
                <div className="space-y-3">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {letters[idx]}
                      </div>
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Pilihan ${letters[idx]}`}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Kunci Jawaban</label>
                <select 
                  value={formData.correctAnswer} 
                  onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">Pilih Kunci Jawaban</option>
                  {formData.options.filter(o => o.trim() !== '').map((opt, idx) => (
                    <option key={idx} value={opt}>{letters[formData.options.indexOf(opt)]}. {opt}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">* Pilih salah satu dari pilihan yang sudah diisi di atas.</p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3 justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Batal
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-teal-500/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Soal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizManager;
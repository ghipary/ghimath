import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Save, X, Search, BookOpen, CheckCircle, ChevronLeft, Loader, AlertTriangle, Download, FileText, Package, Filter, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTIES = [
  { value: 'mudah', label: 'Mudah', color: 'emerald', emoji: '🟢' },
  { value: 'sedang', label: 'Sedang', color: 'amber', emoji: '🟡' },
  { value: 'sulit', label: 'Sulit', color: 'red', emoji: '🔴' },
];

const getDifficultyStyle = (diff) => {
  switch (diff) {
    case 'mudah': return { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', label: 'Mudah', emoji: '🟢' };
    case 'sulit': return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-500/30', label: 'Sulit', emoji: '🔴' };
    default: return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', label: 'Sedang', emoji: '🟡' };
  }
};

// ⚡ CONTOH TEMPLATE UNTUK DIPASTE USER
const TEMPLATE_EXAMPLE = `# Format: Materi|Kesulitan|Pertanyaan|Opsi A|Opsi B|Opsi C|Opsi D|Jawaban
# Jawaban bisa huruf (A/B/C/D) atau langsung tulis teks jawabannya
# Hapus baris dengan tanda # (komentar) setelah selesai

Aljabar|Mudah|Berapakah hasil dari 5 + 7?|10|11|12|13|C
Aljabar|Mudah|Jika x = 3, berapakah nilai 2x?|4|5|6|7|6
Aljabar|Sedang|Berapakah nilai x dari 2x + 4 = 10?|2|3|4|5|3
Aljabar|Sulit|Jika x² - 5x + 6 = 0, berapakah nilai x?|1 dan 6|2 dan 3|3 dan 4|4 dan 5|2 dan 3
Geometri|Mudah|Berapa jumlah sudut segitiga?|90°|180°|270°|360°|B
Geometri|Sedang|Rumus luas lingkaran adalah...|2πr|πr²|πd|4πr²|πr²
Geometri|Sulit|Volume bola dengan r = 3 cm (π=3.14) adalah...|113.04 cm³|100.52 cm³|117.5 cm³|113.04 cm²|113.04 cm³`;

const AdminQuizManager = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [seeding, setSeeding] = useState(false);
  const [importing, setImporting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [templateText, setTemplateText] = useState('');

  const [formData, setFormData] = useState({
    materialTitle: '',
    difficulty: 'sedang',
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
      data.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      if (error.code !== 'permission-denied') {
        console.error('Gagal ambil soal:', error);
      }
      setQuestions([]);
      setFilteredQuestions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ⚡ FILTER PENCARIAN & DIFFICULTY
  useEffect(() => {
    let result = questions;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(q => 
        (q.question || '').toLowerCase().includes(lower) || 
        (q.materialTitle || '').toLowerCase().includes(lower)
      );
    }
    if (filterDifficulty !== 'all') {
      result = result.filter(q => (q.difficulty || 'sedang') === filterDifficulty);
    }
    setFilteredQuestions(result);
  }, [searchQuery, questions, filterDifficulty]);

  // ⚡ SEEDER
  const handleSeedData = async () => {
    if (!window.confirm('Tambahkan 10 soal contoh ke database?')) return;
    setSeeding(true);
    const t = toast.loading('Menambahkan soal contoh...');
    try {
      const seed = [
        { materialTitle: 'Matematika Dasar', difficulty: 'mudah', question: 'Berapakah hasil dari 12 + 15?', options: ['25', '27', '28', '30'], correctAnswer: '27' },
        { materialTitle: 'Aljabar', difficulty: 'mudah', question: 'Jika x = 5, berapakah nilai 3x + 2?', options: ['15', '16', '17', '18'], correctAnswer: '17' },
        { materialTitle: 'Geometri', difficulty: 'mudah', question: 'Rumus luas persegi panjang adalah...', options: ['s x s', 'p + l', 'p x l', '2 x (p + l)'], correctAnswer: 'p x l' },
        { materialTitle: 'Statistika', difficulty: 'sedang', question: 'Nilai yang paling sering muncul dalam data disebut...', options: ['Mean', 'Median', 'Modus', 'Range'], correctAnswer: 'Modus' },
        { materialTitle: 'Trigonometri', difficulty: 'sedang', question: 'Nilai dari sin 90° adalah...', options: ['0', '1/2', '1', 'Tidak terdefinisi'], correctAnswer: '1' },
        { materialTitle: 'Kalkulus', difficulty: 'sedang', question: 'Turunan dari f(x) = x² adalah...', options: ['x', '2x', 'x²', '2'], correctAnswer: '2x' },
        { materialTitle: 'Bilangan', difficulty: 'mudah', question: 'Bilangan prima terkecil adalah...', options: ['0', '1', '2', '3'], correctAnswer: '2' },
        { materialTitle: 'Aljabar', difficulty: 'sedang', question: 'Bentuk sederhana dari 2(x + 3) adalah...', options: ['2x + 3', '2x + 6', 'x + 6', '2x - 6'], correctAnswer: '2x + 6' },
        { materialTitle: 'Geometri', difficulty: 'sulit', question: 'Volume kubus dengan sisi 5 cm adalah...', options: ['25 cm³', '75 cm³', '100 cm³', '125 cm³'], correctAnswer: '125 cm³' },
        { materialTitle: 'Matematika Dasar', difficulty: 'mudah', question: 'Berapakah hasil dari 100 : 4?', options: ['20', '25', '30', '40'], correctAnswer: '25' },
      ];
      let ok = 0;
      for (const q of seed) {
        try {
          await addDoc(collection(db, 'questions'), { ...q, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          ok++;
        } catch (e) { console.warn(e.message); }
      }
      toast.success(`Berhasil menambahkan ${ok} soal! 🎉`, { id: t });
      fetchQuestions();
    } catch (err) {
      toast.error('Gagal: ' + err.message, { id: t });
    }
    setSeeding(false);
  };

  // ⚡ PARSE TEMPLATE & IMPORT
  const handleParseTemplate = async () => {
    if (!templateText.trim()) {
      toast.error('Template masih kosong!');
      return;
    }

    const lines = templateText.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    const parsed = [];
    const errors = [];

    lines.forEach((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 8) {
        errors.push(`Baris ${idx + 1}: kolom kurang dari 8`);
        return;
      }
      const [materialTitle, difficulty, question, optA, optB, optC, optD, answerRaw] = parts;

      const options = [optA, optB, optC, optD].filter(o => o !== '');
      if (options.length < 2) {
        errors.push(`Baris ${idx + 1}: minimal 2 opsi`);
        return;
      }

      // Cari jawaban: bisa huruf (A/B/C/D) atau teks langsung
      const letters = ['A', 'B', 'C', 'D'];
      let correctAnswer = answerRaw;
      const upperAnswer = answerRaw.toUpperCase();
      if (letters.includes(upperAnswer)) {
        const ansIdx = letters.indexOf(upperAnswer);
        correctAnswer = options[ansIdx] || answerRaw;
      }

      if (!options.includes(correctAnswer)) {
        errors.push(`Baris ${idx + 1}: jawaban "${answerRaw}" tidak cocok dengan opsi`);
        return;
      }

      const diff = ['mudah', 'sedang', 'sulit'].includes(difficulty.toLowerCase())
        ? difficulty.toLowerCase()
        : 'sedang';

      parsed.push({
        materialTitle,
        difficulty: diff,
        question,
        options,
        correctAnswer,
      });
    });

    if (parsed.length === 0) {
      toast.error('Tidak ada soal valid! Cek format template.');
      return;
    }

    setImporting(true);
    const t = toast.loading(`Mengimport ${parsed.length} soal...`);
    let ok = 0;
    for (const q of parsed) {
      try {
        await addDoc(collection(db, 'questions'), { ...q, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        ok++;
      } catch (e) { console.warn(e.message); }
    }

    if (ok > 0) {
      toast.success(`Berhasil import ${ok} soal! 🎉`, { id: t });
      if (errors.length > 0) {
        toast.error(`${errors.length} baris gagal: ${errors[0]}`, { duration: 5000 });
      }
      setIsTemplateModalOpen(false);
      setTemplateText('');
      fetchQuestions();
    } else {
      toast.error('Gagal import semua soal!', { id: t });
    }
    setImporting(false);
  };

  // ⚡ IMPORT DARI MATERIALS
  const handleImportFromMaterials = async () => {
    const t = toast.loading('Cek soal di collection materials...');
    setImporting(true);
    try {
      const matSnap = await getDocs(collection(db, 'materials'));
      const materials = matSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const allQ = [];
      materials.forEach(mat => {
        if (mat.questions && Array.isArray(mat.questions)) {
          mat.questions.forEach(q => {
            const options = q.options || q.pilihan || [];
            const answer = q.correctAnswer || q.jawabanBenar || q.answer || '';
            if (q.question && options.length >= 2 && answer) {
              allQ.push({
                materialTitle: mat.title || 'Umum',
                difficulty: q.difficulty || 'sedang',
                question: q.question,
                options,
                correctAnswer: answer,
              });
            }
          });
        }
      });

      if (allQ.length === 0) {
        toast.error('Tidak ada soal ditemukan di collection materials.', { id: t, duration: 4000 });
        setImporting(false);
        return;
      }

      let ok = 0;
      for (const q of allQ) {
        try {
          await addDoc(collection(db, 'questions'), { ...q, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
          ok++;
        } catch (e) { console.warn(e.message); }
      }

      toast.success(`Berhasil import ${ok} soal dari ${materials.length} materi! 🎉`, { id: t });
      fetchQuestions();
    } catch (err) {
      toast.error('Gagal: ' + err.message, { id: t });
    }
    setImporting(false);
  };

  // ⚡ MODAL TAMBAH
  const handleOpenAdd = () => {
    setFormData({ materialTitle: '', difficulty: 'sedang', question: '', options: ['', '', '', ''], correctAnswer: '' });
    setIsEditing(false);
    setCurrentId(null);
    setIsModalOpen(true);
  };

  // ⚡ MODAL EDIT
  const handleOpenEdit = (q) => {
    setFormData({
      materialTitle: q.materialTitle || '',
      difficulty: q.difficulty || 'sedang',
      question: q.question || '',
      options: q.options && q.options.length > 0 ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correctAnswer: q.correctAnswer || ''
    });
    setIsEditing(true);
    setCurrentId(q.id);
    setIsModalOpen(true);
  };

  // ⚡ HAPUS
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      toast.success('Soal berhasil dihapus! 🗑️');
      fetchQuestions();
    } catch (error) { toast.error('Gagal: ' + error.message); }
  };

  // ⚡ SIMPAN
  const handleSave = async () => {
    if (!formData.question || !formData.correctAnswer || !formData.materialTitle) {
      toast.error('Isi Judul Materi, Pertanyaan, dan Kunci Jawaban!');
      return;
    }
    const cleanOptions = formData.options.filter(opt => opt.trim() !== '');
    if (cleanOptions.length < 2) { toast.error('Minimal 2 pilihan!'); return; }
    if (!cleanOptions.includes(formData.correctAnswer)) { toast.error('Kunci harus salah satu pilihan!'); return; }

    setSaving(true);
    const payload = {
      materialTitle: formData.materialTitle,
      difficulty: formData.difficulty,
      question: formData.question,
      options: cleanOptions,
      correctAnswer: formData.correctAnswer,
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'questions', currentId), payload);
        toast.success('Soal diperbarui! ✅');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'questions'), payload);
        toast.success('Soal baru ditambahkan! 🎉');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (error) { toast.error('Gagal: ' + error.message); }
    setSaving(false);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const letters = ['A', 'B', 'C', 'D'];

  // Hitung statistik per difficulty
  const countByDiff = {
    mudah: questions.filter(q => (q.difficulty || 'sedang') === 'mudah').length,
    sedang: questions.filter(q => (q.difficulty || 'sedang') === 'sedang').length,
    sulit: questions.filter(q => (q.difficulty || 'sedang') === 'sulit').length,
  };

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
                Kelola bank soal dengan tingkat kesulitan untuk Kuis Acak.
              </p>
            </div>
          </div>
          <button onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5">
            <Plus className="w-5 h-5" /> Tambah Soal
          </button>
        </div>
      </div>

      <div className="page-content max-w-5xl mx-auto px-4 py-4">

        {/* ⚡ TOMBOL AKSI CEPAT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">Import via Template</p>
              <p className="text-[11px] text-white/80">Copy-paste banyak soal</p>
            </div>
          </button>

          <button onClick={handleImportFromMaterials} disabled={importing}
            className="flex items-center gap-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 disabled:opacity-50 text-white p-4 rounded-2xl shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">Import dari Materi</p>
              <p className="text-[11px] text-white/80">Ambil soal dari materials</p>
            </div>
          </button>

          <button onClick={handleSeedData} disabled={seeding}
            className="flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">Contoh Soal</p>
              <p className="text-[11px] text-white/80">10 soal siap pakai</p>
            </div>
          </button>
        </div>

        {/* ⚡ STATISTIK DIFFICULTY */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-elevated rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🟢</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Mudah</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{countByDiff.mudah}</p>
          </div>
          <div className="card-elevated rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🟡</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Sedang</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{countByDiff.sedang}</p>
          </div>
          <div className="card-elevated rounded-2xl p-4 border border-red-200 dark:border-red-800/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔴</span>
              <span className="text-xs font-bold text-red-700 dark:text-red-400">Sulit</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{countByDiff.sulit}</p>
          </div>
        </div>

        {/* ⚡ SEARCH & FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari soal atau materi..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
              className="pl-9 pr-8 py-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm appearance-none cursor-pointer">
              <option value="all">Semua Level</option>
              <option value="mudah">🟢 Mudah</option>
              <option value="sedang">🟡 Sedang</option>
              <option value="sulit">🔴 Sulit</option>
            </select>
          </div>
        </div>

        {/* ⚡ DAFTAR SOAL */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat soal...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="card-elevated rounded-2xl p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {questions.length === 0 ? 'Belum Ada Soal' : 'Tidak Ada Hasil'}
            </h3>
            <p className="text-gray-500 mb-6">
              {questions.length === 0
                ? 'Database soal masih kosong. Pilih salah satu cara di atas untuk menambahkan soal.'
                : 'Coba ubah kata kunci atau filter level.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => {
              const diffStyle = getDifficultyStyle(q.difficulty);
              return (
                <div key={q.id} className="card-elevated rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                        {q.materialTitle || 'Tanpa Materi'}
                      </span>
                      <span className={`text-[10px] font-bold ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border} border px-2 py-0.5 rounded-full`}>
                        {diffStyle.emoji} {diffStyle.label}
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
              );
            })}
          </div>
        )}
      </div>

      {/* ⚡ MODAL TEMPLATE IMPORT */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Import via Template</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Copy-paste banyak soal sekaligus!</p>
                </div>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5">
              {/* Instruksi */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 mb-4 flex gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  <p className="font-bold mb-1">Format (1 baris = 1 soal):</p>
                  <code className="block bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-[10px] font-mono mt-1">
                    Materi|Kesulitan|Pertanyaan|Opsi A|Opsi B|Opsi C|Opsi D|Jawaban
                  </code>
                  <p className="mt-1.5">• Kesulitan: <strong>mudah</strong> / <strong>sedang</strong> / <strong>sulit</strong></p>
                  <p>• Jawaban: huruf (A/B/C/D) atau teks lengkap</p>
                  <p>• Baris dengan awalan <strong>#</strong> diabaikan (komentar)</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={() => setTemplateText(TEMPLATE_EXAMPLE)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                  📋 Isi Template Contoh
                </button>
                <button onClick={() => setTemplateText('')}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-auto">
                  🗑️ Kosongkan
                </button>
              </div>

              <textarea value={templateText} onChange={(e) => setTemplateText(e.target.value)}
                placeholder="Paste template soal di sini..."
                rows={14}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 font-mono text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                Preview: <strong>{templateText.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).length}</strong> baris siap diimport
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3 justify-end">
              <button onClick={() => setIsTemplateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Batal
              </button>
              <button onClick={handleParseTemplate} disabled={importing}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
                <Download className="w-4 h-4" /> {importing ? 'Mengimport...' : 'Import Semua'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ MODAL TAMBAH/EDIT */}
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
                <input type="text" value={formData.materialTitle} onChange={(e) => setFormData({...formData, materialTitle: e.target.value})}
                  placeholder="Contoh: Aljabar, Geometri..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Kesulitan</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d.value} type="button" onClick={() => setFormData({...formData, difficulty: d.value})}
                      className={`py-2.5 px-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        formData.difficulty === d.value
                          ? d.value === 'mudah' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : d.value === 'sulit' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}>
                      {d.emoji} {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pertanyaan</label>
                <textarea value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})}
                  placeholder="Tulis pertanyaan..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pilihan Jawaban</label>
                <div className="space-y-3">
                  {formData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {letters[idx]}
                      </div>
                      <input type="text" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Pilihan ${letters[idx]}`}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Kunci Jawaban</label>
                <select value={formData.correctAnswer} onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Pilih Kunci Jawaban</option>
                  {formData.options.filter(o => o.trim() !== '').map((opt, idx) => (
                    <option key={idx} value={opt}>{letters[formData.options.indexOf(opt)]}. {opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-3 justify-end">
              <button onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-teal-500/30 transition-all disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizManager;
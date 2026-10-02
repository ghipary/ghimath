import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Save, ArrowLeft, Video, Info, BookOpen, Wand2, FileText, Loader, Settings, CheckCircle, Sparkles, Type, Code2, Eye, EyeOff, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';

const AdminMaterialForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '', level: 'SMP', grade: 7, topic: 'Aljabar',
    description: '', content: '', videoUrl: '', published: true
  });
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [rawText, setRawText] = useState('');
  const [showAutoImport, setShowAutoImport] = useState(!isEdit);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEdit);
  const [error, setError] = useState('');

  // ⚡ MODE EDITOR
  const [descriptionMode, setDescriptionMode] = useState('html');
  const [contentMode, setContentMode] = useState('html');
  const [showPreview, setShowPreview] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const topics = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  const gradesSMP = [7, 8, 9];
  const gradesSMA = [10, 11, 12];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'], ['clean']
    ],
  };
  const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'blockquote', 'code-block', 'color', 'background', 'link'];

  // ===== AUTO-FORMAT TEXT → HTML =====
  const autoFormatText = (rawText) => {
    if (/<(h1|h2|h3|ul|ol)[\s>]/i.test(rawText)) return rawText;
    const plainText = rawText
      .replace(/<\/(p|h1|h2|h3|li|div)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (!plainText) return rawText;

    const lines = plainText.split('\n').map((l) => l.trim()).filter(Boolean);
    let html = ''; let inList = false; let listTag = '';
    const closeList = () => { if (inList) { html += `</${listTag}>`; inList = false; listTag = ''; } };
    const isHeading = (line) => {
      if (/^[^:]+:$/.test(line) && !line.startsWith('-')) return true;
      if (/^\d+\.\s+[A-Z\u00C0-\u024F]/.test(line) && !/[.!?]$/.test(line) && line.length < 80) return true;
      if (/^[a-z]\.\s+[A-Z\u00C0-\u024F]/.test(line) && !/[.!?]$/.test(line) && line.length < 80) return true;
      if (/^[A-Z\u00C0-\u024F][a-z\u00C0-\u024F]*$/.test(line) && line.length < 30) return true;
      return false;
    };
    lines.forEach((line) => {
      const isBullet = line.match(/^[-•*]\s+(.+)/);
      const isNumberedList = line.match(/^\d+\)\s+(.+)/);
      if (isHeading(line)) { closeList(); html += `<h3>${line.replace(/:$/, '')}</h3>`; }
      else if (isBullet) {
        if (!inList || listTag !== 'ul') { closeList(); html += '<ul>'; inList = true; listTag = 'ul'; }
        html += `<li>${isBullet[1]}</li>`;
      } else if (isNumberedList) {
        if (!inList || listTag !== 'ol') { closeList(); html += '<ol>'; inList = true; listTag = 'ol'; }
        html += `<li>${isNumberedList[1]}</li>`;
      } else { closeList(); html += `<p>${line}</p>`; }
    });
    closeList(); return html;
  };

  // ===== PARSER =====
  const parseFullMaterial = (text) => {
    const result = { title: '', level: '', grade: '', topic: '', description: '', content: '', quizzes: [] };

    const levelMatch = text.match(/^\s*JENJANG\s*:\s*(SMP|SMA)\s*$/im);
    if (levelMatch) result.level = levelMatch[1].toUpperCase();

    const gradeMatch = text.match(/^\s*KELAS\s*:\s*(\d+)\s*$/im);
    if (gradeMatch) result.grade = Number(gradeMatch[1]);

    const topicMatch = text.match(/^\s*TOPIK\s*:\s*(.+)$/im);
    if (topicMatch) {
      const topicVal = topicMatch[1].trim();
      const validTopics = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
      const matched = validTopics.find(t => topicVal.toLowerCase().includes(t.toLowerCase()));
      result.topic = matched || 'Bilangan';
    }

    const judulMatch = text.match(/^\s*JUDUL\s*:\s*(.+)$/im);
    if (judulMatch) result.title = judulMatch[1].trim();
    else {
      const babMatch = text.match(/^\s*BAB\s+(\d+)\s*:\s*(.+)$/im);
      if (babMatch) result.title = `Bab ${babMatch[1]}: ${babMatch[2].trim()}`;
    }

    const descMatch = text.match(/BAGIAN\s+1\s*:\s*DESKRIPSI\s*\n([\s\S]*?)(?=BAGIAN\s+2\s*:|$)/i);
    if (descMatch) result.description = descMatch[1].trim();

    const contentMatch = text.match(/BAGIAN\s+2\s*:\s*KONTEN MATERI\s*\n([\s\S]*?)(?=BAGIAN\s+3\s*:|$)/i);
    if (contentMatch) result.content = contentMatch[1].trim();

    const quizMatch = text.match(/BAGIAN\s+3\s*:[\s\S]*?\n([\s\S]*)$/i);
    if (quizMatch) {
      const quizText = quizMatch[1].trim();
      const blocks = quizText.split(/\n(?=\s*\d+\.\s)/).map(b => b.trim()).filter(Boolean);
      blocks.forEach(block => {
        try {
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          const question = lines[0].replace(/^\d+\.\s*/, '').trim();
          if (!question) return;
          const options = ['', '', '', ''];
          let correctAnswer = -1;
          let explanation = '';
          lines.slice(1).forEach(line => {
            const optMatch = line.match(/^([A-Da-d])\.\s*(.+)/);
            if (optMatch) {
              options[optMatch[1].toUpperCase().charCodeAt(0) - 65] = optMatch[2].trim();
              return;
            }
            const ansMatch = line.match(/^Jawaban\s*:\s*([A-Da-d])/i);
            if (ansMatch) { correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65; return; }
            const explMatch = line.match(/^Pembahasan\s*:\s*(.+)/i);
            if (explMatch) explanation = explMatch[1].trim();
          });
          if (!options.some(o => !o) && correctAnswer >= 0) {
            result.quizzes.push({ question, options, correctAnswer, explanation });
          }
        } catch (e) {}
      });
    }
    return result;
  };

  const handleAutoImport = () => {
    if (!rawText.trim()) return toast.error('Paste teks materi dulu!');
    const parsed = parseFullMaterial(rawText);
    if (!parsed.title && !parsed.content) {
      return toast.error('Format tidak dikenali. Pastikan ada header JENJANG/KELAS/TOPIK/JUDUL dan BAGIAN 1/2/3.');
    }

    const looksMarkdown = (str) => {
      if (!str) return false;
      return /\$/.test(str) || /^#{1,6}\s/m.test(str) || /\*\*[^*]+\*\*/.test(str);
    };

    const useMarkdownDesc = looksMarkdown(parsed.description);
    const useMarkdownContent = looksMarkdown(parsed.content);

    setFormData(prev => ({
      ...prev,
      title: parsed.title || prev.title,
      level: parsed.level || prev.level,
      grade: parsed.grade || prev.grade,
      topic: parsed.topic || prev.topic,
      description: useMarkdownDesc ? parsed.description : (autoFormatText(parsed.description) || prev.description),
      content: useMarkdownContent ? parsed.content : (autoFormatText(parsed.content) || prev.content),
    }));

    if (useMarkdownDesc) setDescriptionMode('markdown');
    if (useMarkdownContent) setContentMode('markdown');

    setPendingQuizzes(parsed.quizzes);

    const info = [];
    if (parsed.level) info.push(`Jenjang: ${parsed.level}`);
    if (parsed.grade) info.push(`Kelas: ${parsed.grade}`);
    if (parsed.topic) info.push(`Topik: ${parsed.topic}`);
    toast.success(`✅ Auto-isi berhasil! ${info.join(' • ')} | ${parsed.quizzes.length} soal siap import.`, { duration: 4000 });
  };

  const handleFillTemplate = () => {
    setRawText(`JENJANG: SMP
KELAS: 7
TOPIK: Bilangan
JUDUL: Bab 1: Bilangan Bulat dan Operasinya

BAGIAN 1: DESKRIPSI
**Bilangan bulat** adalah bilangan yang terdiri atas bilangan positif, nol, dan bilangan negatif. Di bab ini, kita akan mempelajari bagaimana menggunakan bilangan positif dan negatif dalam kehidupan sehari-hari.

BAGIAN 2: KONTEN MATERI

# Bilangan Positif dan Negatif

## Penjelasan Materi

**Bilangan positif** adalah bilangan yang lebih besar dari $0$.

**Bilangan negatif** adalah bilangan yang lebih kecil dari $0$.

## Contoh

- Suhu $2°C$ di bawah $0$ ditulis $-2°C$
- Suhu $27°C$ di atas $0$ ditulis $+27°C$

## Rumus Penjumlahan

$$(+5) + (+3) = +8$$

$$(-5) + (-3) = -8$$

## Nilai Mutlak

Jarak bilangan dari $0$, contoh: $|-3| = 3$ dan $|+4| = 4$.

BAGIAN 3: 3 SOAL KUIS

1. Berapakah hasil dari $(+5) + (-3)$?
A. $-8$
B. $-2$
C. $+2$
D. $+8$
Jawaban: C
Pembahasan: $(+5) + (-3) = 5 - 3 = 2$

2. Berapakah nilai dari $|-7|$?
A. $-7$
B. $0$
C. $7$
D. $14$
Jawaban: C
Pembahasan: Nilai mutlak selalu positif, jadi $|-7| = 7$.

3. Suhu di puncak gunung $-5°C$. Suhu di pantai $30°C$. Berapa selisihnya?
A. $25°C$
B. $35°C$
C. $-25°C$
D. $-35°C$
Jawaban: B
Pembahasan: $30 - (-5) = 30 + 5 = 35°C$`);
    toast.success('Template contoh terisi! Klik "Auto-Isi SEMUA" untuk memproses. 📋');
  };

  const handleAutoFormatDescription = () => {
    if (!formData.description.replace(/<[^>]*>/g, '').trim()) return toast.error('Deskripsi masih kosong!');
    setFormData((prev) => ({ ...prev, description: autoFormatText(prev.description) }));
    toast.success('Deskripsi dirapikan! ✨');
  };
  const handleAutoFormatContent = () => {
    if (!formData.content.replace(/<[^>]*>/g, '').trim()) return toast.error('Konten masih kosong!');
    setFormData((prev) => ({ ...prev, content: autoFormatText(prev.content) }));
    toast.success('Konten dirapikan! ✨');
  };

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!isEdit) { setDataLoading(false); return; }
      try {
        const docSnap = await getDoc(doc(db, 'materials', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isMd = (str) => {
            if (!str) return false;
            if (/<(p|h[1-6]|ul|ol|li|div|blockquote|table|pre|code|span)[\s>]/i.test(str)) return false;
            return /\$/.test(str) || /^#{1,6}\s/m.test(str) || /\*\*[^*]+\*\*/.test(str);
          };
          setFormData({
            title: data.title || '', level: data.level || 'SMP', grade: data.grade || 7,
            topic: data.topic || 'Aljabar', description: data.description || '',
            content: data.content || '', videoUrl: data.videoUrl || '', published: data.published || false
          });
          setDescriptionMode(isMd(data.description) ? 'markdown' : 'html');
          setContentMode(isMd(data.content) ? 'markdown' : 'html');
        } else { toast.error('Materi tidak ditemukan'); navigate('/admin/materi'); }
      } catch (err) { toast.error('Gagal memuat materi'); }
      setDataLoading(false);
    };
    fetchMaterial();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'level') {
      const currentGrade = Number(formData.grade);
      if (finalValue === 'SMP' && currentGrade > 9) {
        setFormData(prev => ({ ...prev, level: finalValue, grade: 7 }));
        return;
      }
      if (finalValue === 'SMA' && currentGrade < 10) {
        setFormData(prev => ({ ...prev, level: finalValue, grade: 10 }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.content.replace(/<[^>]*>/g, '').trim()) return setError('Konten wajib diisi!');
    if (!formData.description.replace(/<[^>]*>/g, '').trim()) return setError('Deskripsi wajib diisi!');

    try {
      setLoading(true);
      const dataToSave = {
        title: formData.title, level: formData.level, grade: Number(formData.grade),
        topic: formData.topic, description: formData.description, content: formData.content,
        videoUrl: formData.videoUrl || null, published: formData.published,
        updatedAt: serverTimestamp()
      };
      
      let materialId = id;
      if (isEdit) {
        await updateDoc(doc(db, 'materials', id), dataToSave);
      } else {
        const docRef = await addDoc(collection(db, 'materials'), { 
          ...dataToSave, createdBy: user.uid, createdAt: serverTimestamp() 
        });
        materialId = docRef.id;
      }

      if (pendingQuizzes.length > 0 && !isEdit) {
        let successCount = 0;
        for (const q of pendingQuizzes) {
          await addDoc(collection(db, 'quizQuestions'), {
            materialId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            createdAt: serverTimestamp()
          });
          successCount++;
        }
        toast.success(`Materi + ${successCount} soal kuis berhasil disimpan! 🎉`);
      } else {
        toast.success(isEdit ? 'Materi berhasil diupdate! ✅' : 'Materi berhasil diupload! 🎉');
      }
      
      navigate('/admin/materi');
    } catch (err) { 
      setError('Gagal: ' + err.message); 
      toast.error('Gagal: ' + err.message); 
    }
    setLoading(false);
  };

  if (dataLoading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Memuat data materi...</p>
        </div>
      </div>
    );
  }

  const EditorModeToggle = ({ mode, setMode }) => (
    <div className="inline-flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 border border-gray-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setMode('html')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
          mode === 'html'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <Type className="w-3 h-3" /> Rich Text
      </button>
      <button
        type="button"
        onClick={() => setMode('markdown')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
          mode === 'markdown'
            ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <Code2 className="w-3 h-3" /> Markdown + LaTeX
      </button>
    </div>
  );

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        <button onClick={() => navigate('/admin/materi')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 shadow-sm">
          <Settings className="w-3.5 h-3.5" /> {isEdit ? 'EDIT' : 'UPLOAD'}
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
          {isEdit ? 'Edit Materi' : 'Upload Materi Baru'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          {isEdit ? 'Edit materi & soal kuis.' : 'Paste teks lengkap → auto-isi SEMUA. Atau tulis manual dengan mode Markdown + LaTeX. 🚀'}
        </p>
      </div>

      <div className="page-content max-w-4xl mx-auto px-4 space-y-6">
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}

        {/* AUTO-IMPORT */}
        {!isEdit && (
          <div className="card-elevated rounded-2xl p-5 sm:p-6 border-l-4 border-l-amber-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-500/5 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">⚡ Auto-Import Super</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Paste teks lengkap → semua otomatis terisi!</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAutoImport(!showAutoImport)}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                >
                  {showAutoImport ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>

              {showAutoImport && (
                <>
                  <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-bold mb-1 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Format yang didukung:
                    </p>
                    <ul className="space-y-0.5 ml-1">
                      <li>✅ <code className="bg-white dark:bg-slate-800 px-1 rounded">JENJANG: SMP/SMA</code> → auto jenjang</li>
                      <li>✅ <code className="bg-white dark:bg-slate-800 px-1 rounded">KELAS: 7-12</code> → auto kelas</li>
                      <li>✅ <code className="bg-white dark:bg-slate-800 px-1 rounded">TOPIK: Aljabar/Geometri/dll</code> → auto topik</li>
                      <li>✅ <code className="bg-white dark:bg-slate-800 px-1 rounded">JUDUL: Bab X: ...</code> → auto judul</li>
                      <li>✅ <code className="bg-white dark:bg-slate-800 px-1 rounded">BAGIAN 1/2/3</code> → auto deskripsi/konten/kuis</li>
                    </ul>
                  </div>

                  {/* ⚡ TOMBOL ISI TEMPLATE */}
                  <button
                    type="button"
                    onClick={handleFillTemplate}
                    className="w-full mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-md transition-all"
                  >
                    📋 Isi Template Contoh (Lihat Format)
                  </button>

                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={12}
                    placeholder={`Paste teks lengkap di sini...\n\nContoh:\nJENJANG: SMP\nKELAS: 7\nTOPIK: Bilangan\nJUDUL: Bab 1: Bilangan Bulat\n\nBAGIAN 1: DESKRIPSI\n...\n\nBAGIAN 2: KONTEN MATERI\n(markdown + LaTeX juga bisa)\n\nBAGIAN 3: 10 SOAL KUIS\n...`}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono text-xs"
                  />

                  <button
                    type="button"
                    onClick={handleAutoImport}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30"
                  >
                    <Sparkles className="w-5 h-5" /> Auto-Isi SEMUA + Import Kuis
                  </button>

                  {pendingQuizzes.length > 0 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-lg flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span><strong>{pendingQuizzes.length} soal kuis</strong> siap diimport. Tersimpan otomatis saat Publish!</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="card-elevated rounded-2xl p-5 sm:p-8 space-y-6">
          
          <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/10 border border-teal-200/60 dark:border-teal-800/50 rounded-xl flex gap-3 text-sm text-teal-800 dark:text-teal-300">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Tips:</strong> Gunakan mode <strong className="text-violet-600 dark:text-violet-400">Markdown + LaTeX</strong> untuk materi yang banyak rumus matematika. Rumus ditulis dengan <code className="bg-white dark:bg-slate-800 px-1 rounded">$x^2$</code> (inline) atau <code className="bg-white dark:bg-slate-800 px-1 rounded">$$...$$</code> (block).
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Judul Materi *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Misal: Bab 2: Bilangan Rasional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jenjang *</label>
              <select name="level" value={formData.level} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kelas *</label>
              <select name="grade" value={formData.grade} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {(formData.level === 'SMP' ? gradesSMP : gradesSMA).map((g) => (
                  <option key={g} value={g}>Kelas {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topik *</label>
            <select name="topic" value={formData.topic} onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* DESKRIPSI */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Deskripsi Singkat *
              </label>
              <div className="flex items-center gap-2">
                <EditorModeToggle mode={descriptionMode} setMode={setDescriptionMode} />
                {descriptionMode === 'html' && (
                  <button type="button" onClick={handleAutoFormatDescription}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                    <Wand2 className="w-3.5 h-3.5" /> Auto-Rapikan
                  </button>
                )}
              </div>
            </div>
            {descriptionMode === 'html' ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <ReactQuill theme="snow" value={formData.description} onChange={(v) => setFormData((p) => ({ ...p, description: v }))} modules={quillModules} formats={quillFormats} placeholder="Paste deskripsi di sini..." />
              </div>
            ) : (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={6}
                placeholder="Tulis deskripsi dengan format Markdown..."
                className="w-full px-4 py-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none font-mono text-xs"
              />
            )}
          </div>

          {/* KONTEN */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Konten Materi *
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => {
                  if (window.confirm('Yakin hapus semua konten materi?')) {
                    setFormData((p) => ({ ...p, content: '' }));
                  }
                }}
                  className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg">
                  🗑️ Clear
                </button>
                <button type="button" onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPreview ? 'Sembunyikan Preview' : 'Preview'}
                </button>
                <EditorModeToggle mode={contentMode} setMode={setContentMode} />
                {contentMode === 'html' && (
                  <button type="button" onClick={handleAutoFormatContent}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                    <Wand2 className="w-3.5 h-3.5" /> Auto-Rapikan
                  </button>
                )}
              </div>
            </div>

            {contentMode === 'html' ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <ReactQuill theme="snow" value={formData.content} onChange={(v) => setFormData((p) => ({ ...p, content: v }))} modules={quillModules} formats={quillFormats} placeholder="Paste konten materi di sini..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  rows={showPreview ? 30 : 20}
                  placeholder={`Tulis konten dengan Markdown + LaTeX...\n\nContoh:\n# Bilangan Bulat\n\n**Bilangan positif** adalah bilangan yang lebih besar dari $0$.\n\n$$a + b = b + a$$\n\n## Sub-bab\n\n- Poin 1\n- Poin 2`}
                  className="w-full px-4 py-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none font-mono text-xs"
                />
                {showPreview && (
                  <div className="border border-violet-200 dark:border-violet-800/50 rounded-xl bg-white dark:bg-slate-900 p-4 overflow-y-auto max-h-[600px]">
                    <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Eye className="w-3 h-3" /> Live Preview
                    </div>
                    {formData.content.trim() ? (
                      <MarkdownRenderer content={formData.content} />
                    ) : (
                      <p className="text-xs text-gray-400 italic">Preview akan muncul di sini...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <Video className="w-4 h-4" /> Link Video YouTube / TikTok (Opsional)
            </label>
            <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Contoh: https://www.youtube.com/watch?v=xxxxx atau https://www.tiktok.com/@user/video/xxxxx" />
            <p className="text-xs text-gray-500 mt-1.5">Cukup paste link video dari browser. Sistem akan otomatis menyesuaikan ukuran tampilannya.</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
            <input type="checkbox" name="published" checked={formData.published} onChange={handleChange}
              className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500" id="published" />
            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Publish materi ini (langsung muncul di halaman siswa)
            </label>
          </div>

          {/* ⚡ TOMBOL REVIEW HASIL IMPORT */}
          {pendingQuizzes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReview(!showReview)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/30 transition-all"
            >
              <ClipboardList className="w-5 h-5" />
              {showReview ? 'Sembunyikan Review' : `📋 Review Hasil Import (${pendingQuizzes.length} soal)`}
              {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30">
            <Save className="w-5 h-5" />
            {loading ? 'Menyimpan...' : (
              isEdit ? 'Update Materi' : 
              pendingQuizzes.length > 0 
                ? `Publish Materi + ${pendingQuizzes.length} Soal Kuis` 
                : 'Publish Materi'
            )}
          </button>
        </form>

        {/* ⚡ PANEL REVIEW HASIL IMPORT */}
        {showReview && pendingQuizzes.length > 0 && (
          <div className="card-elevated rounded-2xl p-5 border-2 border-violet-300 dark:border-violet-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              Review Hasil Import
            </h3>

            <div className="space-y-4">
              {/* Info Materi */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Judul</span>
                  <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm">{formData.title || '(kosong)'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenjang & Kelas</span>
                  <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm">{formData.level} • Kelas {formData.grade}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Topik</span>
                  <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm">{formData.topic}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mode Konten</span>
                  <p className="font-bold text-violet-600 dark:text-violet-400 mt-0.5 text-sm">
                    {contentMode === 'markdown' ? '✨ Markdown + LaTeX' : '📝 Rich Text'}
                  </p>
                </div>
              </div>
              {/* ⚡ Preview Deskripsi */}
              {formData.description && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                    📝 Preview Deskripsi
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg p-4">
                    {descriptionMode === 'markdown' ? (
                      <MarkdownRenderer content={formData.description} />
                    ) : (
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.description }} />
                    )}
                  </div>
                </div>
              )}
              {/* Preview Konten */}
              <div className="bg-violet-50/50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-200 dark:border-violet-800/50">
                <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">📖 Preview Konten Materi</div>
                <div className="max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg p-4">
                  {formData.content.trim() ? (
                    <MarkdownRenderer content={formData.content} />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Konten kosong</p>
                  )}
                </div>
              </div>

              {/* Daftar Soal */}
              <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-xl p-4 border border-teal-200 dark:border-teal-800/50">
                <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
                  📝 {pendingQuizzes.length} Soal Siap Diimport
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pendingQuizzes.map((q, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-teal-100 dark:border-teal-800/30">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                          <MarkdownRenderer content={q.question} />
                        </div>
                      </div>
                      <div className="ml-8 space-y-1">
                        {q.options.map((opt, i) => (
                          <div key={i} className={`text-xs flex items-start gap-2 ${i === q.correctAnswer ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500'}`}>
                            <span className="font-bold w-4 flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                            <div className="flex-1">
                              <MarkdownRenderer content={opt} />
                            </div>
                            {i === q.correctAnswer && <span className="text-[9px] bg-teal-100 dark:bg-teal-900/40 px-1.5 rounded flex-shrink-0">✓</span>}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="ml-8 mt-2 text-[11px] text-blue-600 dark:text-blue-400 italic">
                          💡 <MarkdownRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMaterialForm;
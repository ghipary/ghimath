import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Save, ArrowLeft, Video, Info, BookOpen, Wand2, FileText, Loader, Settings, CheckCircle, Sparkles } from 'lucide-react';
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

  const topics = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  
  // ⚡ PISAHKAN KELAS BERDASARKAN JENJANG
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

  // ===== PARSER: Split teks lengkap + META HEADER =====
  const parseFullMaterial = (text) => {
    const result = { 
      title: '', level: '', grade: '', topic: '', description: '', content: '', quizzes: [] 
    };

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
    if (judulMatch) {
      result.title = judulMatch[1].trim();
    } else {
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
            if (ansMatch) {
              correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
              return;
            }
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

    const descHtml = autoFormatText(parsed.description);
    const contentHtml = autoFormatText(parsed.content);

    setFormData(prev => ({
      ...prev,
      title: parsed.title || prev.title,
      level: parsed.level || prev.level,
      grade: parsed.grade || prev.grade,
      topic: parsed.topic || prev.topic,
      description: descHtml || prev.description,
      content: contentHtml || prev.content,
    }));
    setPendingQuizzes(parsed.quizzes);

    const info = [];
    if (parsed.level) info.push(`Jenjang: ${parsed.level}`);
    if (parsed.grade) info.push(`Kelas: ${parsed.grade}`);
    if (parsed.topic) info.push(`Topik: ${parsed.topic}`);
    
    toast.success(`✅ Auto-isi berhasil! ${info.join(' • ')} | ${parsed.quizzes.length} soal siap import.`, { duration: 4000 });
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
          setFormData({
            title: data.title || '', level: data.level || 'SMP', grade: data.grade || 7,
            topic: data.topic || 'Aljabar', description: data.description || '',
            content: data.content || '', videoUrl: data.videoUrl || '', published: data.published || false
          });
        } else { toast.error('Materi tidak ditemukan'); navigate('/admin/materi'); }
      } catch (err) { toast.error('Gagal memuat materi'); }
      setDataLoading(false);
    };
    fetchMaterial();
  }, [id, isEdit, navigate]);

  // ⚡ UPDATE: Logika handleChange untuk reset grade jika level berubah
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'level') {
      const currentGrade = Number(formData.grade);
      if (finalValue === 'SMP' && currentGrade > 9) {
        finalValue = 7; // Reset ke default SMP
        setFormData(prev => ({ ...prev, level: finalValue, grade: 7 }));
        return;
      }
      if (finalValue === 'SMA' && currentGrade < 10) {
        finalValue = 10; // Reset ke default SMA
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
          {isEdit ? 'Edit materi & soal kuis.' : 'Paste teks lengkap → auto-isi SEMUA (jenjang, kelas, topik, judul, konten, kuis)! 🚀'}
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

                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={12}
                    placeholder={`Paste teks lengkap di sini...\n\nContoh:\nJENJANG: SMP\nKELAS: 7\nTOPIK: Statistika\nJUDUL: Bab 9: Penyajian Data\n\nBAGIAN 1: DESKRIPSI\n...\n\nBAGIAN 2: KONTEN MATERI\n...\n\nBAGIAN 3: 10 SOAL KUIS\n...`}
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
              <strong>Tips:</strong> Kalau pakai Auto-Import, semua field di bawah otomatis terisi. Kamu bisa edit manual kalau perlu.
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
                {/* ⚡ DROPDOWN KELAS DINAMIS */}
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
              <button type="button" onClick={handleAutoFormatDescription}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                <Wand2 className="w-3.5 h-3.5" /> Auto-Rapikan
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
              <ReactQuill theme="snow" value={formData.description} onChange={(v) => setFormData((p) => ({ ...p, description: v }))} modules={quillModules} formats={quillFormats} placeholder="Paste deskripsi di sini..." />
            </div>
          </div>

          {/* KONTEN */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Konten Materi *
              </label>
              <button type="button" onClick={handleAutoFormatContent}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                <Wand2 className="w-3.5 h-3.5" /> Auto-Rapikan
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
              <ReactQuill theme="snow" value={formData.content} onChange={(v) => setFormData((p) => ({ ...p, content: v }))} modules={quillModules} formats={quillFormats} placeholder="Paste konten materi di sini..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
              <Video className="w-4 h-4" /> Link YouTube (Opsional)
            </label>
            <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="https://www.youtube.com/watch?v=xxxxx" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
            <input type="checkbox" name="published" checked={formData.published} onChange={handleChange}
              className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500" id="published" />
            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Publish materi ini (langsung muncul di halaman siswa)
            </label>
          </div>

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
      </div>
    </div>
  );
};

export default AdminMaterialForm;
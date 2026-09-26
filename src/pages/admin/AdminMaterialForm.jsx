import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Save, ArrowLeft, Video, Info, BookOpen, Wand2, FileText, Loader } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import toast from 'react-hot-toast';

const AdminMaterialForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    level: 'SMP',
    grade: 7,
    topic: 'Aljabar',
    description: '',
    content: '',
    videoUrl: '',
    published: false
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(isEdit);
  const [error, setError] = useState('');

  const topics = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  const grades = [7, 8, 9, 10, 11, 12];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'blockquote', 'code-block', 'color', 'background', 'link'
  ];

  // ===== AUTO-FORMAT v3 — dengan guard anti double-format =====
  const autoFormatText = (rawText) => {
    // ⚡ GUARD: Kalau sudah ada struktur HTML (h1/h2/h3/ul/ol), skip auto-format
    if (/<(h1|h2|h3|ul|ol)[\s>]/i.test(rawText)) {
      return rawText;
    }

    const plainText = rawText
      .replace(/<\/(p|h1|h2|h3|li|div)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    if (!plainText) return rawText;

    const lines = plainText.split('\n').map((l) => l.trim()).filter(Boolean);
    let html = '';
    let inList = false;
    let listTag = '';

    const closeList = () => {
      if (inList) {
        html += `</${listTag}>`;
        inList = false;
        listTag = '';
      }
    };

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

      if (isHeading(line)) {
        closeList();
        const cleanHeading = line.replace(/:$/, '');
        html += `<h3>${cleanHeading}</h3>`;
      } else if (isBullet) {
        if (!inList || listTag !== 'ul') {
          closeList();
          html += '<ul>';
          inList = true;
          listTag = 'ul';
        }
        html += `<li>${isBullet[1]}</li>`;
      } else if (isNumberedList) {
        if (!inList || listTag !== 'ol') {
          closeList();
          html += '<ol>';
          inList = true;
          listTag = 'ol';
        }
        html += `<li>${isNumberedList[1]}</li>`;
      } else {
        closeList();
        html += `<p>${line}</p>`;
      }
    });

    closeList();
    return html;
  };

  const handleAutoFormatDescription = () => {
    const plainText = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      toast.error('Deskripsi masih kosong!');
      return;
    }
    const formatted = autoFormatText(formData.description);
    setFormData((prev) => ({ ...prev, description: formatted }));
    toast.success('Deskripsi berhasil dirapikan! ✨');
  };

  const handleAutoFormatContent = () => {
    const plainText = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      toast.error('Konten masih kosong!');
      return;
    }
    const formatted = autoFormatText(formData.content);
    setFormData((prev) => ({ ...prev, content: formatted }));
    toast.success('Konten berhasil dirapikan! ✨');
  };

  // ===== Fetch data (mode edit) =====
  useEffect(() => {
    const fetchMaterial = async () => {
      if (!isEdit) {
        setDataLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, 'materials', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            level: data.level || 'SMP',
            grade: data.grade || 7,
            topic: data.topic || 'Aljabar',
            description: data.description || '',
            content: data.content || '',
            videoUrl: data.videoUrl || '',
            published: data.published || false
          });
        } else {
          toast.error('Materi tidak ditemukan');
          navigate('/admin/materi');
        }
      } catch (err) {
        console.error('Gagal ambil materi:', err);
        toast.error('Gagal memuat materi');
      }
      setDataLoading(false);
    };
    fetchMaterial();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const contentText = formData.content.replace(/<[^>]*>/g, '').trim();
    if (!contentText) {
      setError('Konten materi tidak boleh kosong!');
      toast.error('Konten materi wajib diisi! 📝');
      return;
    }

    const descText = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!descText) {
      setError('Deskripsi tidak boleh kosong!');
      toast.error('Deskripsi wajib diisi! 📝');
      return;
    }

    try {
      setLoading(true);

      // ⚡ Karena konten sudah diformat di editor (via tombol Auto-Rapikan),
      // kita SAVE APA ADANYA. Guard di autoFormatText memastikan tidak double-format.
      const dataToSave = {
        title: formData.title,
        level: formData.level,
        grade: Number(formData.grade),
        topic: formData.topic,
        description: formData.description,
        content: formData.content,
        videoUrl: formData.videoUrl || null,
        published: formData.published,
        updatedAt: serverTimestamp()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'materials', id), dataToSave);
      } else {
        await addDoc(collection(db, 'materials'), {
          ...dataToSave,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
      }
      toast.success(isEdit ? 'Materi berhasil diupdate! ✅' : 'Materi berhasil diupload! 🎉');
      navigate('/admin/materi');
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan materi: ' + err.message);
      toast.error('Gagal menyimpan: ' + err.message);
    }
    setLoading(false);
  };

  // Loading state
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Memuat data materi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/admin/materi')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Materi' : 'Upload Materi Baru'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tulis materi seperti di Word — tanpa perlu PDF! ✍️
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 md:p-8 space-y-6">
          
          <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex gap-3 text-sm text-teal-800 dark:text-teal-300">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Tips:</strong> Paste teks, klik <strong>"Auto-Rapikan"</strong> sekali saja. Hasilnya langsung tersimpan dengan format cantik.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Materi *</label>
            <input 
              type="text" 
              name="title" 
              required 
              value={formData.title} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" 
              placeholder="Misal: Persamaan Linear Satu Variabel" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenjang *</label>
              <select 
                name="level" 
                value={formData.level} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas *</label>
              <select 
                name="grade" 
                value={formData.grade} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {grades.map((g) => <option key={g} value={g}>Kelas {g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topik *</label>
            <select 
              name="topic" 
              value={formData.topic} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* DESKRIPSI DENGAN QUILL */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Deskripsi Singkat *
              </label>
              <button
                type="button"
                onClick={handleAutoFormatDescription}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-Rapikan
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-300 dark:border-slate-700">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Paste deskripsi di sini... (lalu klik Auto-Rapikan SEKALI saja)"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Paste teks → klik <strong>Auto-Rapikan sekali</strong> → selesai. Jangan klik 2x.
            </p>
          </div>

          {/* KONTEN MATERI */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Konten Materi *
              </label>
              <button
                type="button"
                onClick={handleAutoFormatContent}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-Rapikan
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-300 dark:border-slate-700">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Tulis atau paste materi di sini... (lalu klik Auto-Rapikan SEKALI saja)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <Video className="w-4 h-4" /> Link YouTube (Opsional)
            </label>
            <input 
              type="text" 
              name="videoUrl" 
              value={formData.videoUrl} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" 
              placeholder="https://www.youtube.com/watch?v=xxxxx" 
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <input 
              type="checkbox" 
              name="published" 
              checked={formData.published} 
              onChange={handleChange} 
              className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500" 
              id="published" 
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Publish materi ini (langsung muncul di halaman siswa)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-4 rounded-xl transition-all shadow-lg"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Menyimpan...' : (isEdit ? 'Update Materi' : 'Publish Materi')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminMaterialForm;
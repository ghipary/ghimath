import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Save, ArrowLeft, FileText, Video, Link as LinkIcon, Info } from 'lucide-react';

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
    pdfUrl: '',
    videoUrl: '',
    published: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topics = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  const grades = [7, 8, 9, 10, 11, 12];

  // Fungsi untuk mengubah link Google Drive share menjadi link preview
  // Contoh: https://drive.google.com/file/d/XXX/view?usp=sharing
  // Menjadi: https://drive.google.com/file/d/XXX/preview
  const convertGoogleDriveLink = (url) => {
    if (!url) return '';
    // Cek apakah ini link Google Drive
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    // Kalau bukan link Google Drive, kembalikan apa adanya
    return url;
  };

  // Kalau mode edit, ambil data lama
  useEffect(() => {
    if (isEdit) {
      const fetchMaterial = async () => {
        const docSnap = await getDoc(doc(db, 'materials', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            level: data.level || 'SMP',
            grade: data.grade || 7,
            topic: data.topic || 'Aljabar',
            description: data.description || '',
            pdfUrl: data.fileUrl || '',
            videoUrl: data.videoUrl || '',
            published: data.published || false
          });
        }
      };
      fetchMaterial();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.pdfUrl) return setError('Silakan isi link PDF materi terlebih dahulu!');
    try {
      setLoading(true);
      // Konversi link Google Drive ke link preview
      const previewUrl = convertGoogleDriveLink(formData.pdfUrl);
      
      const dataToSave = {
        title: formData.title,
        level: formData.level,
        grade: Number(formData.grade),
        topic: formData.topic,
        description: formData.description,
        fileUrl: previewUrl,
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
      alert(isEdit ? 'Materi berhasil diupdate!' : 'Materi berhasil diupload!');
      navigate('/admin/materi');
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan materi: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/admin/materi')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Materi' : 'Upload Materi Baru'}
          </h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Materi *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Misal: Persamaan Linear Satu Variabel" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenjang *</label>
              <select name="level" value={formData.level} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas *</label>
              <select name="grade" value={formData.grade} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {grades.map((g) => <option key={g} value={g}>Kelas {g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topik *</label>
            <select name="topic" value={formData.topic} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi Singkat *</label>
            <textarea name="description" required rows={3} value={formData.description} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none" placeholder="Jelaskan isi materi ini dalam 1-2 kalimat." />
          </div>

          {/* Input Link PDF Google Drive */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Link PDF (Google Drive) *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                name="pdfUrl" 
                required
                value={formData.pdfUrl} 
                onChange={handleChange} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="https://drive.google.com/file/d/xxxx/view?usp=sharing" 
              />
            </div>
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Cara upload PDF:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-0.5">
                  <li>Buka Google Drive, upload file PDF kamu.</li>
                  <li>Klik kanan file → Share → "Anyone with the link" → Copy link.</li>
                  <li>Tempel link-nya di sini. Nanti akan otomatis dikonversi.</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <Video className="w-4 h-4" /> Link YouTube (Opsional)
            </label>
            <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://www.youtube.com/embed/xxxxx" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500" id="published" />
            <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Publish materi ini (langsung muncul di halaman siswa)
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-4 rounded-xl transition-all shadow-lg">
            <Save className="w-5 h-5" />
            {loading ? 'Menyimpan...' : (isEdit ? 'Update Materi' : 'Publish Materi')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminMaterialForm;
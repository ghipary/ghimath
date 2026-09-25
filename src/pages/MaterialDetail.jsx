import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, BookOpen, Video, ListChecks, Loader } from 'lucide-react';

const MaterialDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'materials', id));
        if (docSnap.exists()) {
          setMaterial({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/materi');
        }
      } catch (error) {
        console.error('Gagal ambil materi:', error);
        navigate('/materi');
      }
      setLoading(false);
    };
    fetchMaterial();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!material) return null;

  const handleTandaiSelesai = () => {
    setIsCompleted(!isCompleted);
    alert(isCompleted ? "Materi ditandai belum selesai." : "Materi ditandai selesai! ✅");
  };

    // Fungsi untuk mengubah link YouTube biasa menjadi link embed
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    // Regex untuk mengambil ID video dari berbagai format link YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    // Kalau sudah format embed, kembalikan langsung
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/materi')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Materi
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${material.level === 'SMP' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              {material.level}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Kelas {material.grade}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{material.topic}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{material.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{material.description}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Materi Bacaan (PDF)</h2>
          </div>
          <iframe src={material.fileUrl} title={material.title} className="w-full h-[500px] md:h-[700px] bg-gray-100 dark:bg-slate-800" />
        </div>

        {material.videoUrl && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <Video className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-gray-900 dark:text-white">Video Penjelasan</h2>
            </div>
            <div className="aspect-video">
              <iframe src={getYoutubeEmbedUrl(material.videoUrl)} title={`Video ${material.title}`} className="w-full h-full" allowFullScreen />
            </div>
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleTandaiSelesai} className={`flex-1 flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all ${isCompleted ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 hover:bg-teal-200' : 'bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white hover:border-teal-600'}`}>
            <CheckCircle className="w-5 h-5" />
            {isCompleted ? 'Sudah Ditandai Selesai' : 'Tandai Selesai'}
          </button>
          <Link to={`/materi/${material.id}/kuis`} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl">
            <ListChecks className="w-5 h-5" /> Latihan Soal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
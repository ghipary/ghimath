import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader, ListChecks, Settings, BookOpen, AlertTriangle, X, ShieldAlert, Filter, Trash, CheckCircle, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

// Komponen Tabel Reusable
const MaterialTable = ({ data, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50/50 to-teal-50/30 dark:from-slate-800/50 dark:to-slate-800/30">
        <tr>
          <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Judul</th>
          <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kelas</th>
          <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Topik</th>
          <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
          <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
        {data.map((mat) => (
          <tr key={mat.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4">
              <div className="font-medium text-gray-900 dark:text-white">{mat.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{mat.level}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mat.grade}</td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mat.topic}</td>
            <td className="px-6 py-4">
              {mat.published ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                  <Eye className="w-3 h-3" /> Publish
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  <EyeOff className="w-3 h-3" /> Draft
                </span>
              )}
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <Link to={`/admin/materi/${mat.id}/soal`} className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 transition-colors" title="Kelola Soal Kuis">
                  <ListChecks className="w-4 h-4" />
                </Link>
                <Link to={`/admin/materi/${mat.id}/edit`} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit Materi">
                  <Edit className="w-4 h-4" />
                </Link>
                <button onClick={() => onDelete(mat.id, mat.title)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors" title="Hapus Materi">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">
              Belum ada materi untuk jenjang ini.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const AdminMaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⚡ STATE UNTUK BULK DELETE
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [allData, setAllData] = useState({ quizQuestions: [], progress: [], quizResults: [], dailyChallenges: [] });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, step: '' });
  
  // Filter state
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  
  // 3 Lapis konfirmasi
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [preview, setPreview] = useState({ materials: 0, questions: 0, progress: 0, results: 0, dailyChallenges: 0 });

  const topics = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  const grades = [7, 8, 9, 10, 11, 12];

  const fetchMaterials = async () => {
    try {
      const q = query(collection(db, 'materials'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMaterials(data);
    } catch (error) {
      console.error('Gagal ambil materi:', error);
      toast.error('Gagal memuat materi');
    }
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Yakin ingin menghapus materi "${title}"?`)) {
      try {
        await deleteDoc(doc(db, 'materials', id));
        setMaterials(materials.filter((m) => m.id !== id));
        toast.success('Materi berhasil dihapus! 🗑️');
      } catch (error) {
        toast.error('Gagal menghapus: ' + error.message);
      }
    }
  };

  // ⚡ BUKA MODAL & FETCH SEMUA DATA
  const openBulkModal = async () => {
    setShowBulkModal(true);
    setStep(1);
    setConfirmText('');
    setLoadingPreview(true);

    try {
      const [quizSnap, progressSnap, resultsSnap, dailySnap] = await Promise.all([
        getDocs(collection(db, 'quizQuestions')),
        getDocs(collection(db, 'progress')),
        getDocs(collection(db, 'quizResults')),
        getDocs(collection(db, 'dailyChallenges')),
      ]);

      setAllData({
        quizQuestions: quizSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        progress: progressSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        quizResults: resultsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        dailyChallenges: dailySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      });
    } catch (error) {
      console.error('Gagal fetch data:', error);
      toast.error('Gagal memuat data preview');
    }
    setLoadingPreview(false);
  };

  // ⚡ HITUNG PREVIEW SETIAP FILTER BERUBAH
  useEffect(() => {
    if (!showBulkModal || loadingPreview) return;

    const filteredMaterials = materials.filter((m) => {
      if (filterLevel !== 'all' && m.level !== filterLevel) return false;
      if (filterGrade !== 'all' && Number(m.grade) !== Number(filterGrade)) return false;
      if (filterTopic !== 'all' && m.topic !== filterTopic) return false;
      return true;
    });

    const materialIds = new Set(filteredMaterials.map((m) => m.id));

    const questionsCount = allData.quizQuestions.filter((q) => materialIds.has(q.materialId)).length;
    const progressCount = allData.progress.filter((p) => materialIds.has(p.materialId)).length;
    const resultsCount = allData.quizResults.filter((r) => materialIds.has(r.materialId)).length;

    const questionIdsToDelete = new Set(
      allData.quizQuestions.filter((q) => materialIds.has(q.materialId)).map((q) => q.id)
    );
    const dailyCount = allData.dailyChallenges.filter((dc) =>
      (dc.questionIds || []).some((qid) => questionIdsToDelete.has(qid))
    ).length;

    setPreview({
      materials: filteredMaterials.length,
      questions: questionsCount,
      progress: progressCount,
      results: resultsCount,
      dailyChallenges: dailyCount,
    });
  }, [filterLevel, filterGrade, filterTopic, showBulkModal, loadingPreview, materials, allData]);

  // ⚡ EXECUTE BULK DELETE
  const executeBulkDelete = async () => {
    setDeleting(true);
    setDeleteProgress({ current: 0, total: 0, step: 'Mempersiapkan...' });

    try {
      const filteredMaterials = materials.filter((m) => {
        if (filterLevel !== 'all' && m.level !== filterLevel) return false;
        if (filterGrade !== 'all' && Number(m.grade) !== Number(filterGrade)) return false;
        if (filterTopic !== 'all' && m.topic !== filterTopic) return false;
        return true;
      });

      const materialIds = new Set(filteredMaterials.map((m) => m.id));
      const questionIdsToDelete = new Set(
        allData.quizQuestions.filter((q) => materialIds.has(q.materialId)).map((q) => q.id)
      );

      const toDelete = [
        ...filteredMaterials.map((m) => ({ collection: 'materials', id: m.id })),
        ...allData.quizQuestions.filter((q) => materialIds.has(q.materialId)).map((q) => ({ collection: 'quizQuestions', id: q.id })),
        ...allData.progress.filter((p) => materialIds.has(p.materialId)).map((p) => ({ collection: 'progress', id: p.id })),
        ...allData.quizResults.filter((r) => materialIds.has(r.materialId)).map((r) => ({ collection: 'quizResults', id: r.id })),
        ...allData.dailyChallenges.filter((dc) =>
          (dc.questionIds || []).some((qid) => questionIdsToDelete.has(qid))
        ).map((dc) => ({ collection: 'dailyChallenges', id: dc.id })),
      ];

      setDeleteProgress({ current: 0, total: toDelete.length, step: 'Menghapus data...' });

      const chunkSize = 30;
      let deleted = 0;
      for (let i = 0; i < toDelete.length; i += chunkSize) {
        const chunk = toDelete.slice(i, i + chunkSize);
        await Promise.all(chunk.map((item) => deleteDoc(doc(db, item.collection, item.id))));
        deleted += chunk.length;
        setDeleteProgress({ current: deleted, total: toDelete.length, step: 'Menghapus data...' });
      }

      toast.success(
        `🧹 Berhasil hapus ${preview.materials} materi, ${preview.questions} soal, ${preview.progress} progress, ${preview.results} hasil kuis!`
      );

      setShowBulkModal(false);
      setStep(1);
      setConfirmText('');
      setFilterLevel('all');
      setFilterGrade('all');
      setFilterTopic('all');
      setLoading(true);
      await fetchMaterials();
    } catch (error) {
      console.error('Gagal bulk delete:', error);
      toast.error('Gagal menghapus: ' + (error.message || 'Unknown error'));
    }
    setDeleting(false);
    setDeleteProgress({ current: 0, total: 0, step: '' });
  };

  const canProceedStep2 = preview.materials > 0;
  const canProceedStep3 = confirmText === 'HAPUS' && preview.materials > 0;

  // Pisahkan data berdasarkan jenjang
  const materialsSMP = materials.filter((m) => m.level === 'SMP');
  const materialsSMA = materials.filter((m) => m.level === 'SMA');

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-4 shadow-sm">
          <Settings className="w-3.5 h-3.5" /> ADMIN PANEL
        </div>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
              Kelola Materi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total: {materials.length} materi</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={openBulkModal}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-500/30 hover:-translate-y-0.5"
            >
              <ShieldAlert className="w-5 h-5" /> Hapus Massal
            </button>
            <Link to="/admin/materi/baru" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-teal-500/30 hover:-translate-y-0.5">
              <PlusCircle className="w-5 h-5" /> Materi Baru
            </Link>
          </div>
        </div>
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat materi...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="card-elevated rounded-2xl text-center py-16 px-4">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Belum Ada Materi</h3>
            <p className="text-gray-500 text-sm mb-4">Klik "Materi Baru" untuk menambahkan materi pertama.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* KELOMPOK SMP */}
            <div className="card-elevated rounded-2xl overflow-hidden border-t-4 border-t-teal-500">
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-700/50 flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-teal-500" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Jenjang SMP</h2>
                <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {materialsSMP.length} Materi
                </span>
              </div>
              <MaterialTable data={materialsSMP} onDelete={handleDelete} />
            </div>

            {/* KELOMPOK SMA */}
            <div className="card-elevated rounded-2xl overflow-hidden border-t-4 border-t-blue-500">
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-700/50 flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Jenjang SMA</h2>
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {materialsSMA.length} Materi
                </span>
              </div>
              <MaterialTable data={materialsSMA} onDelete={handleDelete} />
            </div>
          </div>
        )}
      </div>

      {/* ⚡ MODAL BULK DELETE — 3 LAPIS KONFIRMASI */}
      {showBulkModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !deleting && !loadingPreview && setShowBulkModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl my-8 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Hapus Massal Materi</h2>
                    <p className="text-xs text-white/80">Tindakan ini tidak bisa dibatalkan</p>
                  </div>
                </div>
                {!deleting && !loadingPreview && (
                  <button onClick={() => setShowBulkModal(false)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Step Indicator */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between gap-2">
                {[
                  { num: 1, label: 'Filter' },
                  { num: 2, label: 'Konfirmasi' },
                  { num: 3, label: 'Eksekusi' },
                ].map((s, i) => (
                  <React.Fragment key={s.num}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step >= s.num 
                          ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/30' 
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:inline ${step >= s.num ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-0.5 transition-all ${step > s.num ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {loadingPreview ? (
              <div className="p-10 text-center">
                <Loader className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data preview...</p>
              </div>
            ) : deleting ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/30 animate-pulse">
                  <Trash className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Menghapus Data...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{deleteProgress.step}</p>
                <div className="max-w-sm mx-auto">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-300"
                      style={{ width: `${deleteProgress.total > 0 ? (deleteProgress.current / deleteProgress.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2">
                    {deleteProgress.current} / {deleteProgress.total} dokumen
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-5">
                {step === 1 && (
                  <>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/50 rounded-xl p-4 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Perhatian:</strong> Menghapus materi akan otomatis menghapus <strong>semua soal kuis, progress belajar, dan hasil kuis</strong> yang terkait. Tindakan ini <strong>tidak bisa dibatalkan</strong>.
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <Filter className="w-4 h-4 text-red-500" /> Pilih Filter Materi
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Jenjang</label>
                          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none">
                            <option value="all">Semua Jenjang</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Kelas</label>
                          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none">
                            <option value="all">Semua Kelas</option>
                            {grades.map((g) => <option key={g} value={g}>Kelas {g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Topik</label>
                          <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none">
                            <option value="all">Semua Topik</option>
                            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">📊 Yang akan dihapus:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400">{preview.materials}</div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">MATERI</p>
                        </div>
                        <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                          <div className="text-xl font-extrabold text-violet-600 dark:text-violet-400">{preview.questions}</div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">SOAL</p>
                        </div>
                        <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{preview.progress}</div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">PROGRESS</p>
                        </div>
                        <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{preview.results}</div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">HASIL KUIS</p>
                        </div>
                        <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                          <div className="text-xl font-extrabold text-pink-600 dark:text-pink-400">{preview.dailyChallenges}</div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">KUIS HARIAN</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowBulkModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold transition-all">Batal</button>
                      <button onClick={() => setStep(2)} disabled={!canProceedStep2} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed">Lanjutkan →</button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/10 border-2 border-red-300 dark:border-red-800/50 rounded-xl p-5 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-400 via-rose-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/30">
                        <AlertTriangle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-red-700 dark:text-red-400 mb-1">Konfirmasi Terakhir!</h3>
                      <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                        Kamu akan menghapus <strong>{preview.materials} materi</strong> beserta <strong>{preview.questions + preview.progress + preview.results + preview.dailyChallenges}</strong> data terkait. Tindakan ini <strong>PERMANEN</strong>.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Ketik <span className="font-mono bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">HAPUS</span> untuk konfirmasi:
                      </label>
                      <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Ketik HAPUS di sini..." autoFocus className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white font-mono text-center text-lg font-bold tracking-widest focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none uppercase" />
                      {confirmText && confirmText !== 'HAPUS' && <p className="text-xs text-red-500 mt-2 font-medium">❌ Ketik "HAPUS" dengan huruf kapital semua</p>}
                      {confirmText === 'HAPUS' && <p className="text-xs text-green-500 mt-2 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Konfirmasi benar!</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setStep(1); setConfirmText(''); }} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold transition-all">← Kembali</button>
                      <button onClick={() => setStep(3)} disabled={!canProceedStep3} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold transition-all shadow-lg shadow-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed">Lanjut →</button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-rose-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/40">
                        <ShieldAlert className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Siap untuk Hapus?</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-2">Ini kesempatan terakhir untuk membatalkan. Klik tombol merah di bawah untuk <strong>menghapus permanen</strong>:</p>
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-3 inline-flex items-center gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                        <span>📦 {preview.materials} materi</span>
                        <span className="text-gray-300 dark:text-slate-600">•</span>
                        <span>❓ {preview.questions} soal</span>
                        <span className="text-gray-300 dark:text-slate-600">•</span>
                        <span>📊 {preview.progress + preview.results} data user</span>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setStep(2); }} className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold transition-all">← Batal</button>
                      <button onClick={executeBulkDelete} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold transition-all shadow-xl shadow-red-500/40 hover:shadow-red-500/60">
                        <Trash className="w-5 h-5" /> HAPUS PERMANEN
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaterialList;
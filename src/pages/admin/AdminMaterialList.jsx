import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader, ListChecks, Settings, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <Link to="/admin/materi/baru" className="flex items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-teal-500/30 hover:-translate-y-0.5">
            <PlusCircle className="w-5 h-5" /> Materi Baru
          </Link>
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
          <div className="card-elevated rounded-2xl overflow-hidden">
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
                  {materials.map((mat) => (
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
                          <button onClick={() => handleDelete(mat.id, mat.title)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors" title="Hapus Materi">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMaterialList;
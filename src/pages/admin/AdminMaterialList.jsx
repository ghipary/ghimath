import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader, ListChecks } from 'lucide-react';

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
    }
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Yakin ingin menghapus materi "${title}"?`)) {
      try {
        await deleteDoc(doc(db, 'materials', id));
        setMaterials(materials.filter((m) => m.id !== id));
        alert('Materi berhasil dihapus!');
      } catch (error) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kelola Materi</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Total: {materials.length} materi</p>
          </div>
          <Link to="/admin/materi/baru" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-medium transition-colors">
            <PlusCircle className="w-5 h-5" /> Materi Baru
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20"><Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto" /></div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
            <p className="text-gray-500">Belum ada materi. Klik "Materi Baru" untuk menambahkan.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Judul</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kelas</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Topik</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{mat.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{mat.level}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mat.grade}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{mat.topic}</td>
                      <td className="px-6 py-4">
                        {mat.published ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
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
                          {/* TOMBOL KELOLA SOAL (BARU) */}
                          <Link 
                            to={`/admin/materi/${mat.id}/soal`} 
                            className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 transition-colors" 
                            title="Kelola Soal Kuis"
                          >
                            <ListChecks className="w-4 h-4" />
                          </Link>
                          {/* TOMBOL EDIT */}
                          <Link 
                            to={`/admin/materi/${mat.id}/edit`} 
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                            title="Edit Materi"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {/* TOMBOL HAPUS */}
                          <button 
                            onClick={() => handleDelete(mat.id, mat.title)} 
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                            title="Hapus Materi"
                          >
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
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, Filter, BookOpen, Clock, Loader } from 'lucide-react';

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Semua');
  const [selectedGrade, setSelectedGrade] = useState('Semua');

  const topics = ['Semua', 'Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan'];
  const grades = ['Semua', 7, 8, 9, 10, 11, 12];

  // Ambil data materi dari Firestore (hanya yang published = true)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const q = query(collection(db, 'materials'), where('published', '==', true));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterials(data);
      } catch (error) {
        console.error('Gagal ambil materi:', error);
      }
      setLoading(false);
    };
    fetchMaterials();
  }, []);

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const matchSearch = mat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mat.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTopic = selectedTopic === 'Semua' || mat.topic === selectedTopic;
      const matchGrade = selectedGrade === 'Semua' || mat.grade === selectedGrade;
      return matchSearch && matchTopic && matchGrade;
    });
  }, [materials, searchTerm, selectedTopic, selectedGrade]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <Navbar />
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 pt-8 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Daftar Materi</h1>
          <p className="text-gray-600 dark:text-gray-400">Pilih materi yang ingin kamu pelajari hari ini.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-4 md:p-6 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="text" placeholder="Cari materi... (misal: Pythagoras)"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Filter className="w-4 h-4" /> Topik</label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Filter className="w-4 h-4" /> Kelas</label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value === 'Semua' ? 'Semua' : Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none">
                {grades.map((g) => <option key={g} value={g}>{g === 'Semua' ? 'Semua Kelas' : `Kelas ${g}`}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat materi...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Materi tidak ditemukan</h3>
            <p className="text-gray-500 mt-2">Coba ubah kata kunci atau filter pencarianmu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((mat) => (
              <Link key={mat.id} to={`/materi/${mat.id}`} className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mat.level === 'SMP' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {mat.level}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas {mat.grade}</span>
                    <span className="text-xs font-medium text-gray-400">•</span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{mat.topic}</span>
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${mat.level === 'SMP' ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <BookOpen className={`w-5 h-5 ${mat.level === 'SMP' ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight group-hover:text-teal-600 transition-colors">{mat.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">{mat.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t dark:border-slate-800">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15 menit</span>
                    <span className="text-teal-600 dark:text-teal-400 font-medium">Baca Materi →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialList;
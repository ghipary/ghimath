import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Search, X, BookOpen, Loader, TrendingUp, FileText, Sparkles } from 'lucide-react';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allMaterials, setAllMaterials] = useState([]);
  const [popularSearches] = useState(['Pythagoras', 'Persamaan', 'Bilangan', 'Trigonometri', 'Statistika']);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // ⚡ Load semua materi sekali saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const fetchMaterials = async () => {
        try {
          const q = query(collection(db, 'materials'), where('published', '==', true));
          const snap = await getDocs(q);
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setAllMaterials(data);
        } catch (err) {
          console.error('Gagal load materi:', err);
        }
      };
      fetchMaterials();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset saat tutup
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  // ⚡ Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      const filtered = allMaterials
        .filter((m) => 
          (m.title || '').toLowerCase().includes(term) ||
          (m.description || '').toLowerCase().includes(term) ||
          (m.topic || '').toLowerCase().includes(term)
        )
        .slice(0, 8); // Max 8 hasil
      setResults(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, allMaterials]);

  // ⚡ Keyboard shortcut: Esc untuk tutup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ⚡ Strip HTML untuk preview
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const handleSelectMaterial = (materialId) => {
    navigate(`/materi/${materialId}`);
    onClose();
  };

  const handlePopularClick = (term) => {
    setSearchTerm(term);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* SEARCH INPUT */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi, topik, atau kata kunci..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white text-base sm:text-lg focus:outline-none placeholder:text-gray-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
          >
            ESC
          </button>
        </div>

        {/* CONTENT */}
        <div className="max-h-[60vh] overflow-y-auto">
          
          {/* Kalau belum ketik → tampil popular searches */}
          {!searchTerm && (
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pencarian Populer
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularClick(term)}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-400 text-sm font-medium hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/50 dark:hover:to-cyan-900/50 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {searchTerm && loading && (
            <div className="p-8 text-center">
              <Loader className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Mencari...</p>
            </div>
          )}

          {/* Hasil pencarian */}
          {searchTerm && !loading && results.length > 0 && (
            <div className="py-2">
              <p className="px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {results.length} Hasil Ditemukan
              </p>
              {results.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => handleSelectMaterial(mat.id)}
                  className="w-full flex items-start gap-3 px-4 sm:px-5 py-3 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 transition-all text-left border-b border-gray-50 dark:border-slate-800 last:border-0"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    mat.level === 'SMP' 
                      ? 'bg-gradient-to-br from-teal-400 to-cyan-600' 
                      : 'bg-gradient-to-br from-violet-500 to-purple-600'
                  }`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {mat.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        mat.level === 'SMP' 
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' 
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                      }`}>
                        {mat.level} • {mat.grade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {stripHtml(mat.description)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400">
                        {mat.topic}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tidak ada hasil */}
          {searchTerm && !loading && results.length === 0 && allMaterials.length > 0 && (
            <div className="p-10 text-center">
              <div className="w-14 h-14 mx-auto bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Tidak Ada Hasil
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Coba kata kunci lain, misal: "Pythagoras", "Bilangan", "Persamaan"
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span className="hidden sm:inline">Powered by GhiMath</span>
              <span className="sm:hidden">GhiMath</span>
            </span>
          </div>
          <span className="text-[10px] font-semibold hidden sm:inline">
            Klik hasil untuk buka materi
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
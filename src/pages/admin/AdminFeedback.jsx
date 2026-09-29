import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { 
  MessageSquare, Loader, ArrowLeft, Search, Trash2, 
  User as UserIcon, Mail, Calendar, Bug, Lightbulb, Star, 
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ⚡ Konfigurasi tipe feedback — sesuaikan kalau tipe dari FeedbackModal beda
const TYPE_CONFIG = {
  bug:        { label: 'Bug',      Icon: Bug,           gradient: 'from-red-500 to-orange-600',      bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',     border: 'border-red-200 dark:border-red-800' },
  saran:      { label: 'Saran',    Icon: Lightbulb,     gradient: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  suggestion: { label: 'Saran',    Icon: Lightbulb,     gradient: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  fitur:      { label: 'Fitur',    Icon: Star,          gradient: 'from-violet-500 to-purple-600',   bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  feature:    { label: 'Fitur',    Icon: Star,          gradient: 'from-violet-500 to-purple-600',   bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  other:      { label: 'Lainnya',  Icon: MessageCircle, gradient: 'from-teal-400 to-cyan-600',       bg: 'bg-teal-50 dark:bg-teal-900/20',     text: 'text-teal-700 dark:text-teal-400',   border: 'border-teal-200 dark:border-teal-800' },
  default:    { label: 'Feedback', Icon: MessageSquare, gradient: 'from-slate-400 to-slate-600',     bg: 'bg-slate-50 dark:bg-slate-800/40',   text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
};

const getTypeConfig = (type) => {
  if (!type) return TYPE_CONFIG.default;
  const key = String(type).toLowerCase();
  return TYPE_CONFIG[key] || TYPE_CONFIG.default;
};

// ⚡ Normalisasi field dari Firestore (fleksibel, biar aman kalau skema beda)
const normalizeFeedback = (raw) => ({
  id: raw.id,
  message: raw.message || raw.text || raw.content || raw.feedback || '(pesan kosong)',
  type: raw.type || raw.category || null,
  userName: raw.userName || raw.name || raw.displayName || 'Anonim',
  userEmail: raw.userEmail || raw.email || null,
  userId: raw.userId || raw.uid || null,
  createdAt: raw.createdAt || null,
});

const formatDate = (ts) => {
  if (!ts) return '-';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const snap = await getDocs(collection(db, 'feedback'));
        const data = snap.docs.map(d => normalizeFeedback({ id: d.id, ...d.data() }));
        // Sort manual by createdAt desc (biar nggak butuh composite index)
        data.sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
          const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
          return tb - ta;
        });
        setFeedbacks(data);
      } catch (err) {
        console.error('Gagal fetch feedback:', err);
        toast.error('Gagal memuat feedback');
      }
      setLoading(false);
    };
    fetchFeedback();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin mau hapus feedback ini? Tindakan ini tidak bisa dibatalkan.')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'feedback', id));
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast.success('Feedback dihapus');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus feedback');
    }
    setDeletingId(null);
  };

  const filtered = useMemo(() => {
    return feedbacks.filter(f => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (f.message || '').toLowerCase().includes(q) ||
        (f.userName || '').toLowerCase().includes(q) ||
        (f.userEmail || '').toLowerCase().includes(q);
      const matchType = filterType === 'all' || f.type === filterType;
      return matchSearch && matchType;
    });
  }, [feedbacks, search, filterType]);

  // Hitung jumlah per tipe untuk badge filter
  const typeCounts = useMemo(() => {
    const counts = { all: feedbacks.length };
    feedbacks.forEach(f => {
      const key = f.type || 'other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [feedbacks]);

  const filterOptions = [
    { key: 'all', label: 'Semua' },
    { key: 'bug', label: 'Bug' },
    { key: 'saran', label: 'Saran' },
    { key: 'fitur', label: 'Fitur' },
    { key: 'other', label: 'Lainnya' },
  ];

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <Link 
          to="/admin" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Admin
        </Link>

        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-violet-200/50 dark:border-violet-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-400 mb-4 shadow-sm">
          <MessageSquare className="w-3.5 h-3.5" />
          {feedbacks.length} feedback masuk
        </div>

        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent mb-2">
          Feedback Siswa
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Kelola masukan, saran, dan laporan bug dari siswa GhiMath.
        </p>

        {/* SEARCH & FILTER */}
        <div className="card-elevated rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pesan, nama, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {filterOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    filterType === key
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent shadow-md'
                      : 'bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                  }`}
                >
                  {label}{typeCounts[key] ? ` (${typeCounts[key]})` : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-10 h-10 text-violet-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuat feedback...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 card-elevated rounded-2xl">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">
              {feedbacks.length === 0 ? 'Belum ada feedback' : 'Tidak ditemukan'}
            </h3>
            <p className="text-gray-500 mt-2">
              {feedbacks.length === 0 
                ? 'Feedback dari siswa akan muncul di sini.' 
                : 'Coba ubah kata kunci atau filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((fb) => {
              const config = getTypeConfig(fb.type);
              const Icon = config.Icon;
              return (
                <div key={fb.id} className="card-elevated rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
                            {config.label}
                          </span>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {fb.userName}
                          </span>
                          {fb.userEmail && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {fb.userEmail}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(fb.createdAt)}
                          </span>
                          <button
                            onClick={() => handleDelete(fb.id)}
                            disabled={deletingId === fb.id}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Hapus feedback"
                          >
                            {deletingId === fb.id 
                              ? <Loader className="w-4 h-4 animate-spin" /> 
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {fb.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
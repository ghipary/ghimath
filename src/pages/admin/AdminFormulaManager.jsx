import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db } from '../../firebase';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Sparkles, Loader, Trash2, Wand2, CheckCircle, X, AlertTriangle, CheckSquare, Square, Plus, Edit2, Save, Eye, EyeOff } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import toast from 'react-hot-toast';

const GROQ_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b'];

const TOPICS = ['Aljabar', 'Geometri', 'Statistika', 'Trigonometri', 'Kalkulus', 'Bilangan', 'Logaritma', 'Barisan', 'Lainnya'];
const LEVELS = ['SMP', 'SMA'];
const GRADES_SMP = [7, 8, 9];
const GRADES_SMA = [10, 11, 12];

const fixLatex = (s) => {
  if (!s) return '';
  let fixed = String(s);
  fixed = fixed.replace(/@/g, '\\');
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const commands = ['frac','dfrac','tfrac','sqrt','times','cdot','div','left','right','sum','prod','int','lim','log','ln','sin','cos','tan','pi','alpha','beta','gamma','delta','theta','lambda','mu','sigma','omega','infty','pm','mp','neq','leq','geq','approx','equiv','partial','nabla','vec','hat','bar','dot','ddot','tilde','overline','mathrm','mathbf'];
  commands.sort((a,b) => b.length - a.length);
  commands.forEach((cmd) => {
    const regex = new RegExp(`(?<![\\\\a-zA-Z])${cmd}(?=[{\\s\\[a-zA-Z(])`, 'g');
    fixed = fixed.replace(regex, `\\${cmd}`);
  });
  return fixed;
};

const DEFAULT_FORM = {
  title: '',
  formula: '',
  description: '',
  topic: 'Lainnya',
  level: 'SMA',
  grade: 10,
  materialId: '',
  materialTitle: '',
};

const AdminFormulaManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formulas, setFormulas] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState({ current: 0, total: 0, currentTitle: '', successCount: 0, failCount: 0 });
  const [extractedPreview, setExtractedPreview] = useState([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const [selectedFormulaIds, setSelectedFormulaIds] = useState([]);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('');
  const [deletingBulk, setDeletingBulk] = useState(false);

  // ⚡ FORM MODAL STATE
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [showFormulaPreview, setShowFormulaPreview] = useState(true);

  const fetchData = async () => {
    try {
      const [fSnap, mSnap] = await Promise.all([
        getDocs(collection(db, 'formulas')),
        getDocs(collection(db, 'materials')),
      ]);
      const fData = fSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      fData.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setFormulas(fData);
      setMaterials(mSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleSelect = (id) => {
    setSelectedFormulaIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFormulaIds.length === formulas.length) {
      setSelectedFormulaIds([]);
    } else {
      setSelectedFormulaIds(formulas.map((f) => f.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFormulaIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedFormulaIds.length} rumus yang dipilih?`)) return;

    setDeletingBulk(true);
    try {
      const chunks = [];
      for (let i = 0; i < selectedFormulaIds.length; i += 500) {
        chunks.push(selectedFormulaIds.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((id) => batch.delete(doc(db, 'formulas', id)));
        await batch.commit();
      }

      toast.success(`${selectedFormulaIds.length} rumus dihapus! 🗑️`);
      setSelectedFormulaIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal hapus: ' + err.message);
    }
    setDeletingBulk(false);
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirm !== 'HAPUS') {
      toast.error('Ketik "HAPUS" (kapital) untuk konfirmasi');
      return;
    }
    setDeletingBulk(true);
    try {
      const allIds = formulas.map((f) => f.id);
      const chunks = [];
      for (let i = 0; i < allIds.length; i += 500) {
        chunks.push(allIds.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((id) => batch.delete(doc(db, 'formulas', id)));
        await batch.commit();
      }

      toast.success(`🧹 ${allIds.length} rumus DIHAPUS SEMUA!`);
      setShowDeleteAllModal(false);
      setDeleteAllConfirm('');
      setSelectedFormulaIds([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal hapus semua: ' + err.message);
    }
    setDeletingBulk(false);
  };

  // ═══ FORM MANUAL ═══
  const handleOpenAdd = () => {
    setFormData(DEFAULT_FORM);
    setIsEditing(false);
    setCurrentId(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (f) => {
    setFormData({
      title: f.title || '',
      formula: f.formula || '',
      description: f.description || '',
      topic: f.topic || 'Lainnya',
      level: f.level || 'SMA',
      grade: f.grade || 10,
      materialId: f.materialId || '',
      materialTitle: f.materialTitle || '',
    });
    setIsEditing(true);
    setCurrentId(f.id);
    setShowFormModal(true);
  };

  const handleFormSave = async () => {
    if (!formData.title.trim()) return toast.error('Judul rumus wajib diisi!');
    if (!formData.formula.trim()) return toast.error('Rumus (LaTeX) wajib diisi!');

    setFormSaving(true);
    try {
      // Resolve material title kalau ada materialId
      let materialTitle = formData.materialTitle;
      if (formData.materialId && !materialTitle) {
        const mat = materials.find(m => m.id === formData.materialId);
        if (mat) materialTitle = mat.title;
      }

      const payload = {
        title: formData.title.trim(),
        formula: formData.formula.trim(),
        description: formData.description.trim(),
        topic: formData.topic,
        level: formData.level,
        grade: Number(formData.grade),
        materialId: formData.materialId || '',
        materialTitle: materialTitle || 'Manual',
        updatedAt: serverTimestamp(),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'formulas', currentId), payload);
        toast.success('Rumus diupdate! ✅');
      } else {
        await addDoc(collection(db, 'formulas'), {
          ...payload,
          bookmarkedBy: [],
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
        toast.success('Rumus ditambahkan! 🎉');
      }

      setShowFormModal(false);
      setFormData(DEFAULT_FORM);
      setIsEditing(false);
      setCurrentId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal simpan: ' + err.message);
    }
    setFormSaving(false);
  };

  // ═══ AI Extract ═══
  const extractFormulasFromMaterial = async (material, retryCount = 0) => {
    const plainContent = String(material.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);

    const prompt = `Ekstrak SEMUA rumus matematika penting dari materi di bawah ini.

MATERI:
Judul: ${material.title}
Topik: ${material.topic || '-'}
Jenjang: ${material.level} ${material.grade}
Konten: ${plainContent}

OUTPUT HARUS JSON VALID:
{
  "formulas": [
    {"title": "Judul singkat max 40 char", "formula": "LaTeX dengan @ pengganti backslash", "description": "Penjelasan singkat"}
  ]
}

⚠️ ATURAN LATEX: Tulis SEMUA backslash "\\" sebagai "@".
- \\frac{n}{2} → "@frac{n}{2}"
- \\sqrt{x} → "@sqrt{x}"
- \\times → "@times"
- x^{2} → "x^{2}" (tanpa @ karena tidak ada backslash)

Ambil 3-8 rumus penting. Output HANYA JSON.`;

    const body = {
      model: GROQ_MODELS[0],
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    };

    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 429 && retryCount < 3) {
      const waitTime = 10000 + (retryCount * 5000);
      await new Promise((r) => setTimeout(r, waitTime));
      return extractFormulasFromMaterial(material, retryCount + 1);
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try { parsed = JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return [];
      try { parsed = JSON.parse(match[0]); } catch { return []; }
    }

    return (parsed.formulas || []).map((f) => ({
      ...f,
      materialId: material.id,
      materialTitle: material.title,
      topic: material.topic || 'Lainnya',
      level: material.level,
      grade: material.grade,
      selected: true,
    }));
  };

  const handleExtractAll = async () => {
    if (selectedMaterialIds.length === 0) return toast.error('Pilih materi dulu!');

    setExtracting(true);
    setExtractedPreview([]);

    const selectedMaterials = materials.filter((m) => selectedMaterialIds.includes(m.id));
    const allResults = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedMaterials.length; i++) {
      const mat = selectedMaterials[i];
      setExtractProgress({ current: i + 1, total: selectedMaterials.length, currentTitle: mat.title, successCount, failCount });

      try {
        const results = await extractFormulasFromMaterial(mat);
        allResults.push(...results);
        successCount++;
      } catch (err) {
        console.error('Extract error:', mat.title, err);
        failCount++;
      }

      if (i < selectedMaterials.length - 1) await new Promise((r) => setTimeout(r, 2500));
    }

    setExtractedPreview(allResults);
    setExtracting(false);
    toast.success(`✅ ${successCount} sukses, ⚠️ ${failCount} gagal. ${allResults.length} rumus siap review.`, { duration: 5000 });
  };

  const handleSaveAll = async () => {
    const toSave = extractedPreview.filter((f) => f.selected);
    if (toSave.length === 0) return toast.error('Gak ada rumus yang dipilih');

    setSaving(true);
    let success = 0;
    for (const f of toSave) {
      try {
        const { selected, ...data } = f;
        await addDoc(collection(db, 'formulas'), {
          ...data,
          bookmarkedBy: [],
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
        success++;
      } catch (err) { console.error(err); }
    }

    toast.success(`${success} rumus tersimpan! 🎉`);
    setSaving(false);
    setExtractedPreview([]);
    setShowExtractModal(false);
    setSelectedMaterialIds([]);
    fetchData();
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Hapus rumus "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'formulas', id));
      toast.success('Rumus dihapus');
      setFormulas((prev) => prev.filter((f) => f.id !== id));
      setSelectedFormulaIds((prev) => prev.filter((x) => x !== id));
    } catch (err) { toast.error('Gagal: ' + err.message); }
  };

  const renderKatex = (latex) => {
    try {
      return katex.renderToString(fixLatex(latex), { throwOnError: false, displayMode: false });
    } catch { return latex; }
  };

  if (loading) {
    return <div className="page-bg flex items-center justify-center min-h-screen"><Loader className="w-10 h-10 text-teal-600 animate-spin" /></div>;
  }

  const grades = formData.level === 'SMP' ? GRADES_SMP : GRADES_SMA;

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern"></div>
      <Navbar />

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6">
        <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 mb-4 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Admin
        </button>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Bank Rumus
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total: {formulas.length} rumus</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30"
          >
            <Plus className="w-5 h-5" /> Tambah Rumus
          </button>
        </div>

        {formulas.length > 0 && (
          <div className="card-elevated rounded-2xl p-4 mb-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {selectedFormulaIds.length === formulas.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedFormulaIds.length === formulas.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>

            {selectedFormulaIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deletingBulk}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-md disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Hapus {selectedFormulaIds.length} Terpilih
              </button>
            )}

            <div className="flex-1"></div>

            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-sm font-bold shadow-lg"
            >
              <AlertTriangle className="w-4 h-4" /> Hapus Semua
            </button>

            <button
              onClick={() => setShowExtractModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-orange-500/30 text-sm"
            >
              <Wand2 className="w-4 h-4" /> AI Auto-Extract
            </button>
          </div>
        )}

        {formulas.length === 0 && (
          <div className="card-elevated rounded-2xl p-4 mb-6 flex justify-end gap-3 flex-wrap">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg"
            >
              <Plus className="w-5 h-5" /> Tambah Manual
            </button>
            <button
              onClick={() => setShowExtractModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg"
            >
              <Wand2 className="w-5 h-5" /> AI Auto-Extract
            </button>
          </div>
        )}
      </div>

      <div className="page-content max-w-6xl mx-auto px-4 py-4">
        {formulas.length === 0 ? (
          <div className="card-elevated rounded-2xl text-center py-16 px-4">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Belum ada rumus</h3>
            <p className="text-gray-500 text-sm">Klik "Tambah Rumus" untuk mulai, atau pakai AI Auto-Extract.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formulas.map((f) => {
              const isSelected = selectedFormulaIds.includes(f.id);
              return (
                <div key={f.id} className={`card-elevated rounded-2xl p-4 transition-all ${isSelected ? 'ring-2 ring-red-400 dark:ring-red-600 border-red-300' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleSelect(f.id)}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-transparent hover:text-gray-400'
                        }`}
                      >
                        {isSelected ? <CheckCircle className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{f.title}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{f.topic} • {f.materialTitle}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleOpenEdit(f)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(f.id, f.title)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: renderKatex(f.formula) }} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{f.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ⚡ MODAL FORM TAMBAH/EDIT */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={() => !formSaving && setShowFormModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl my-8 relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 p-5 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {isEditing ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{isEditing ? 'Edit Rumus' : 'Tambah Rumus Manual'}</h2>
                  <p className="text-[10px] text-white/80">Tulis rumus dengan LaTeX ($...$ atau langsung)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormulaPreview(!showFormulaPreview)}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  {showFormulaPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showFormulaPreview ? 'Preview ON' : 'Preview OFF'}
                </button>
                {!formSaving && (
                  <button onClick={() => setShowFormModal(false)} className="p-2 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300">
                💡 <strong>Contoh LaTeX:</strong> <code className="bg-white dark:bg-slate-800 px-1 rounded">a^2 + b^2 = c^2</code> atau <code className="bg-white dark:bg-slate-800 px-1 rounded">\frac{"{a}"}{"{b}"}</code> atau <code className="bg-white dark:bg-slate-800 px-1 rounded">\sqrt{"{x}"}</code>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Judul Rumus *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Misal: Rumus Pythagoras"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rumus (LaTeX) *</label>
                <textarea
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  placeholder="Contoh: \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none font-mono text-sm resize-none"
                />
                {showFormulaPreview && formData.formula.trim() && (
                  <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-violet-200 dark:border-violet-800/50 text-center overflow-x-auto">
                    <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase mb-2">👁️ Live Preview</div>
                    <div className="text-lg" dangerouslySetInnerHTML={{ __html: renderKatex(formData.formula) }} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Penjelasan singkat tentang rumus ini..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Topik</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  >
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Jenjang</label>
                  <select
                    value={formData.level}
                    onChange={(e) => {
                      const newLevel = e.target.value;
                      setFormData({ ...formData, level: newLevel, grade: newLevel === 'SMP' ? 7 : 10 });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Kelas</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  >
                    {grades.map((g) => <option key={g} value={g}>Kelas {g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Terkait Materi (Opsional)</label>
                <select
                  value={formData.materialId}
                  onChange={(e) => {
                    const mat = materials.find(m => m.id === e.target.value);
                    setFormData({
                      ...formData,
                      materialId: e.target.value,
                      materialTitle: mat?.title || '',
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                >
                  <option value="">— Tanpa Materi (Manual) —</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.title} ({m.level} • {m.grade})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowFormModal(false)}
                disabled={formSaving}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleFormSave}
                disabled={formSaving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 text-white font-bold shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {formSaving ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> {isEditing ? 'Update' : 'Simpan'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS SEMUA */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => !deletingBulk && setShowDeleteAllModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Hapus SEMUA Rumus?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-5">
              Kamu akan menghapus <strong className="text-red-600 dark:text-red-400">{formulas.length} rumus</strong> secara PERMANEN. Tindakan ini <strong>tidak bisa dibatalkan</strong>.
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800 dark:text-amber-300 mb-2 font-semibold">Ketik "HAPUS" untuk konfirmasi:</p>
              <input
                type="text"
                value={deleteAllConfirm}
                onChange={(e) => setDeleteAllConfirm(e.target.value.toUpperCase())}
                placeholder="HAPUS"
                autoFocus
                disabled={deletingBulk}
                className="w-full px-3 py-2 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-center text-lg font-bold tracking-widest text-red-600 focus:ring-2 focus:ring-red-500 outline-none uppercase"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteAllModal(false); setDeleteAllConfirm(''); }}
                disabled={deletingBulk}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletingBulk || deleteAllConfirm !== 'HAPUS'}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deletingBulk ? <><Loader className="w-4 h-4 animate-spin" /> Hapus...</> : <><Trash2 className="w-4 h-4" /> HAPUS SEMUA</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AI EXTRACT (existing) */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={() => !extracting && !saving && setShowExtractModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl my-8 relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 p-5 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Auto-Extract Rumus</h2>
                  <p className="text-[10px] text-white/80">Groq AI baca materi, ambil rumus, admin review</p>
                </div>
              </div>
              {!extracting && !saving && (
                <button onClick={() => setShowExtractModal(false)} className="p-2 rounded-full hover:bg-white/20">
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {extractedPreview.length === 0 && !extracting && (
                <>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>AI bakal baca materi yang dipilih. Hasil extract <strong>ditampilkan dulu</strong> untuk review. Delay 2.5s antar request.</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Pilih Materi ({selectedMaterialIds.length} dipilih)
                      </label>
                      <button
                        onClick={() => setSelectedMaterialIds(
                          selectedMaterialIds.length === materials.length ? [] : materials.map((m) => m.id)
                        )}
                        className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                      >
                        {selectedMaterialIds.length === materials.length ? 'Hapus Semua' : 'Pilih Semua'}
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
                      {materials.map((m) => (
                        <label key={m.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedMaterialIds.includes(m.id) ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                          <input
                            type="checkbox"
                            checked={selectedMaterialIds.includes(m.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMaterialIds((p) => [...p, m.id]);
                              else setSelectedMaterialIds((p) => p.filter((id) => id !== m.id));
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.title}</p>
                            <p className="text-[10px] text-gray-500">{m.level} • Kelas {m.grade} • {m.topic}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleExtractAll}
                    disabled={selectedMaterialIds.length === 0}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg disabled:opacity-40"
                  >
                    <Wand2 className="w-5 h-5 inline mr-2" /> Mulai Extract ({selectedMaterialIds.length} materi)
                  </button>
                </>
              )}

              {extracting && (
                <div className="text-center py-8">
                  <Loader className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                  <p className="font-bold text-gray-900 dark:text-white mb-2">AI memproses {extractProgress.current}/{extractProgress.total}</p>
                  <p className="text-xs text-gray-500 truncate px-4 mb-2">{extractProgress.currentTitle}</p>
                  <div className="flex items-center justify-center gap-4 text-xs mb-4">
                    <span className="text-teal-600 dark:text-teal-400 font-semibold">✅ {extractProgress.successCount || 0} sukses</span>
                    <span className="text-red-500 font-semibold">❌ {extractProgress.failCount || 0} gagal</span>
                  </div>
                  <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all" style={{ width: `${(extractProgress.current / extractProgress.total) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {extractedPreview.length > 0 && !extracting && (
                <>
                  <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-xl p-3 flex gap-2 text-xs text-teal-800 dark:text-teal-300">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>{extractedPreview.filter((f) => f.selected).length}</strong> dari <strong>{extractedPreview.length}</strong> rumus akan disimpan.</span>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {extractedPreview.map((f, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border-2 ${f.selected ? 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10' : 'border-gray-200 dark:border-slate-700 opacity-50'}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={f.selected}
                            onChange={(e) => setExtractedPreview((prev) => prev.map((x, i) => i === idx ? { ...x, selected: e.target.checked } : x))}
                            className="w-4 h-4 mt-1 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.title}</p>
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 my-2 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: renderKatex(f.formula) }} />
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{f.description}</p>
                            <p className="text-[9px] text-gray-400 mt-1">📚 {f.materialTitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setExtractedPreview([])} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold">
                      ← Extract Ulang
                    </button>
                    <button onClick={handleSaveAll} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold disabled:opacity-40 shadow-lg">
                      {saving ? 'Menyimpan...' : `💾 Simpan ${extractedPreview.filter((f) => f.selected).length} Rumus`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFormulaManager;
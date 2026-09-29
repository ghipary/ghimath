import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Search, Loader, BookMarked, Star, Filter, Printer, Copy, Check, BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════
// FIX LATEX: Convert @ → \
// ═══════════════════════════════════════════════════════════
const fixLatex = (s) => {
  if (!s) return '';
  let fixed = String(s);
  fixed = fixed.replace(/@/g, '\\');
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const commands = ['frac','dfrac','tfrac','sqrt','times','cdot','div',
    'left','right','sum','prod','int','lim','log','ln','sin','cos','tan',
    'pi','alpha','beta','gamma','delta','theta','lambda','mu','sigma','omega',
    'infty','pm','mp','neq','leq','geq','approx','equiv','partial','nabla',
    'vec','hat','bar','dot','ddot','tilde','overline','mathrm','mathbf',
    'quad','qquad','text','begin','end','displaystyle','overline', 'lvert', 'rvert'];
  commands.sort((a,b) => b.length - a.length);
  commands.forEach((cmd) => {
    const regex = new RegExp(`(?<![\\\\a-zA-Z])${cmd}(?=[{\\s\\[a-zA-Z(])`, 'g');
    fixed = fixed.replace(regex, `\\${cmd}`);
  });
  return fixed;
};

// ═══════════════════════════════════════════════════════════
// SANITIZE LATEX
// ═══════════════════════════════════════════════════════════
const sanitizeLatex = (s) => {
  if (!s) return '';
  let text = String(s);

  text = text.replace(/\\begin\{([^}]*?)([a-zA-Z]+)\}/g, '\\begin{$2}');
  text = text.replace(/\\end\{([^}]*?)([a-zA-Z]+)\}/g, '\\end{$2}');
  text = text.replace(/\\begin\{[^a-zA-Z]*([a-zA-Z]+)\}/g, '\\begin{$1}');
  text = text.replace(/\\end\{[^a-zA-Z]*([a-zA-Z]+)\}/g, '\\end{$1}');

  text = text.replace(/\\\(/g, '(');
  text = text.replace(/\\\)/g, ')');

  text = text.replace(/\\d([a-zA-Z])\b/g, '\\, d$1');
  text = text.replace(/\\([xyzqvwu])(?![a-zA-Z])/g, '$1');

  const greekMap = {
    'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ',
    'ε': '\\epsilon ', 'ζ': '\\zeta ', 'η': '\\eta ', 'θ': '\\theta ',
    'ι': '\\iota ', 'κ': '\\kappa ', 'λ': '\\lambda ', 'μ': '\\mu ',
    'ν': '\\nu ', 'ξ': '\\xi ', 'π': '\\pi ', 'ρ': '\\rho ',
    'σ': '\\sigma ', 'τ': '\\tau ', 'φ': '\\phi ', 'χ': '\\chi ',
    'ψ': '\\psi ', 'ω': '\\omega ',
    'Γ': '\\Gamma ', 'Δ': '\\Delta ', 'Θ': '\\Theta ',
    'Λ': '\\Lambda ', 'Ξ': '\\Xi ', 'Π': '\\Pi ',
    'Σ': '\\Sigma ', 'Φ': '\\Phi ', 'Ψ': '\\Psi ', 'Ω': '\\Omega ',
  };
  Object.entries(greekMap).forEach(([unicode, latex]) => {
    text = text.split(unicode).join(latex);
  });

  text = text
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/±/g, '\\pm ')
    .replace(/≥/g, '\\geq ')
    .replace(/≤/g, '\\leq ')
    .replace(/≠/g, '\\neq ')
    .replace(/∞/g, '\\infty ')
    .replace(/√/g, '\\sqrt ')
    .replace(/∑/g, '\\sum ')
    .replace(/∫/g, '\\int ')
    .replace(/∂/g, '\\partial ')
    .replace(/∆/g, '\\Delta ')
    .replace(/·/g, '\\cdot ')
    .replace(/→/g, '\\to ')
    .replace(/←/g, '\\leftarrow ')
    .replace(/⇒/g, '\\Rightarrow ')
    .replace(/⇔/g, '\\Leftrightarrow ');

  if (/\\begin\{/.test(text)) {
    text = text.replace(/\s\\\s+([&\\])/g, ' \\\\ $1');
    text = text.replace(/\s\\\s+$/g, ' \\\\ ');
  }

  text = text.replace(/\\\\([a-zA-Z])/g, '\\$1');

  if (!/\\begin\{/.test(text)) {
    text = text.replace(/\s+/g, ' ').trim();
  }

  return text;
};

// ═══════════════════════════════════════════════════════════
// ULTRA SANITIZE: Invisible chars
// ═══════════════════════════════════════════════════════════
const ultraSanitize = (text) => {
  if (!text) return '';
  let s = String(text);
  s = s.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/\t/g, ' ');
  s = s.normalize('NFC');
  s = s.replace(/\\+$/, '');
  s = s.replace(/\\\s*;/g, '\\;');
  s = s.replace(/\\\s+,/g, '\\,');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const prepare = (latex) => {
  let s = fixLatex(latex);
  s = sanitizeLatex(s);
  s = ultraSanitize(s);
  return s;
};

// ═══════════════════════════════════════════════════════════
// RENDER KATEX — 4-Layer Fallback
// ═══════════════════════════════════════════════════════════
const renderKatex = (latex) => {
  if (!latex) return '';
  
  const base = prepare(latex);
  
  try {
    return katex.renderToString(base, { throwOnError: true, displayMode: false, strict: false });
  } catch (e) { console.warn('KaTeX 1 gagal:', e.message); }
  
  try {
    let s = base.replace(/\\([xyzqvwub])(?![a-zA-Z])/g, '$1');
    return katex.renderToString(s, { throwOnError: true, displayMode: false, strict: false });
  } catch (e) { console.warn('KaTeX 2 gagal:', e.message); }
  
  try {
    let s = base.replace(/\\;/g, '\\ ').replace(/\\,/g, ' ');
    s = s.replace(/\\([xyzqvwub])(?![a-zA-Z])/g, '$1');
    return katex.renderToString(s, { throwOnError: true, displayMode: false, strict: false });
  } catch (e) { console.warn('KaTeX 3 gagal:', e.message); }
  
  try {
    let s = base.replace(/\\([xyzqvwub])(?![a-zA-Z])/g, '$1');
    s = s.replace(/\s\\\s+/g, ' \\\\ ');
    return katex.renderToString(s, { throwOnError: true, displayMode: false, strict: false });
  } catch (e) { console.warn('KaTeX 4 gagal:', e.message); }

  let cleaned = base
    .replace(/\\begin\{([^}]+)\}/g, '[$1] ')
    .replace(/\\end\{([^}]+)\}/g, ' ')
    .replace(/\\\\/g, ' | ')
    .replace(/&/g, ' | ')
    .replace(/\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const escaped = String(cleaned)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<code style="font-family: ui-monospace, monospace; font-size: 0.85em; color: #64748b; word-break: break-word; line-height: 1.5; display: inline-block; padding: 4px 8px;">${escaped}</code>`;
};

// ═══════════════════════════════════════════════════════════
// AUTO-DETECT LATEX (DIPERBARUI: Deteksi @command & tanpa backslash)
// ═══════════════════════════════════════════════════════════
const autoDetectLatex = (text) => {
  if (!text) return '';
  if (/\$/.test(text)) return text;
  
  // ⚡ FIX: Terapkan fixLatex dulu agar kata seperti 'frac' otomatis jadi '\frac'
  let result = fixLatex(text); 
  
  const hasStandardLatex = /\\[a-zA-Z]+/.test(result);
  const hasSuperscript = /\b[A-Za-z]\^\d+\b/.test(result);
  const hasSubscript = /\b[A-Za-z]_\d+\b/.test(result);
  const hasMathSymbols = /[±×÷√π≥≤≠∞∫∑]/.test(result);
  
  if (!hasStandardLatex && !hasSuperscript && !hasSubscript && !hasMathSymbols) return result;
  
  // ⚡ Bungkus perintah KaTeX standar dengan $ agar terdeteksi sebagai math
  if (hasStandardLatex) {
    // Regex untuk menangkap \command atau \command{argumen}
    result = result.replace(/(\\[a-zA-Z]+(?:\{[^}]*\})*)/g, '$$$1$$');
  }

  result = result
    .replace(/±/g, ' $\\pm$ ')
    .replace(/×/g, ' $\\times$ ')
    .replace(/÷/g, ' $\\div$ ')
    .replace(/π/g, ' $\\pi$ ')
    .replace(/≥/g, ' $\\geq$ ')
    .replace(/≤/g, ' $\\leq$ ')
    .replace(/≠/g, ' $\\neq$ ')
    .replace(/∞/g, ' $\\infty$ ')
    .replace(/∫/g, ' $\\int$ ')
    .replace(/∑/g, ' $\\sum$ ')
    .replace(/√/g, ' $\\sqrt$ ')
    .replace(/∂/g, ' $\\partial$ ');
  
  result = result.replace(/(?<!\$)\b([A-Za-z])\^(\d+)\b(?!\$)/g, '$$$1^{$2}$$');
  result = result.replace(/(?<!\$)\b([A-Za-z])_(\d+)\b(?!\$)/g, '$$$1_{$2}$$');
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
};

const renderTextWithLatex = (text) => {
  if (!text) return '';
  const detected = autoDetectLatex(text);
  
  if (/\$/.test(detected)) {
    const parts = detected.split(/(\$[^$]+\$)/g);
    return parts.map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try {
          let inner = prepare(part.slice(1, -1));
          return katex.renderToString(inner, { throwOnError: true, displayMode: false, strict: false });
        } catch {
          let cleaned = prepare(part.slice(1, -1)).replace(/\\/g, '');
          return `<code style="font-family: ui-monospace, monospace; font-size: 0.9em; color: #64748b;">${cleaned.replace(/</g, '&lt;')}</code>`;
        }
      }
      return part.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }).join('');
  }
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// ═══════════════════════════════════════════════════════════
// KOMPONEN
// ═══════════════════════════════════════════════════════════
const FormulaBank = () => {
  const { user } = useAuth();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');
  const [showOnlyBookmark, setShowOnlyBookmark] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchFormulas = async () => {
      try {
        const snap = await getDocs(collection(db, 'formulas'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.topic || '').localeCompare(b.topic || ''));
        setFormulas(data);
      } catch (err) {
        console.error('Gagal ambil rumus:', err);
        toast.error('Gagal memuat rumus');
      }
      setLoading(false);
    };
    fetchFormulas();
  }, []);

  const topics = ['all', ...Array.from(new Set(formulas.map((f) => f.topic).filter(Boolean)))];

  const filtered = formulas.filter((f) => {
    const matchSearch = !searchTerm ||
      (f.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.formula || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTopic = filterTopic === 'all' || f.topic === filterTopic;
    const matchBookmark = !showOnlyBookmark || (f.bookmarkedBy || []).includes(user?.uid);
    return matchSearch && matchTopic && matchBookmark;
  });

  const grouped = {};
  filtered.forEach((f) => {
    const key = f.topic || 'Lainnya';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  });

  const isBookmarked = (f) => (f.bookmarkedBy || []).includes(user?.uid);

  const toggleBookmark = async (f) => {
    if (!user) {
      toast.error('Login dulu untuk bookmark rumus!');
      return;
    }
    try {
      const ref = doc(db, 'formulas', f.id);
      if (isBookmarked(f)) {
        await updateDoc(ref, { bookmarkedBy: arrayRemove(user.uid) });
        setFormulas((prev) => prev.map((x) => x.id === f.id
          ? { ...x, bookmarkedBy: (x.bookmarkedBy || []).filter((u) => u !== user.uid) }
          : x));
        toast.success('Bookmark dihapus');
      } else {
        await updateDoc(ref, { bookmarkedBy: arrayUnion(user.uid) });
        setFormulas((prev) => prev.map((x) => x.id === f.id
          ? { ...x, bookmarkedBy: [...(x.bookmarkedBy || []), user.uid] }
          : x));
        toast.success('Rumus di-bookmark! ⭐');
      }
    } catch (err) {
      toast.error('Gagal bookmark: ' + err.message);
    }
  };

  const copyFormula = async (f) => {
    try {
      const textToCopy = prepare(f.formula);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(f.id);
      toast.success('Rumus dicopy!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Gagal copy');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-bg transition-colors pb-20 min-h-screen">
      <div className="grid-pattern no-print"></div>
      <div className="no-print"><Navbar /></div>

      <div className="page-content max-w-6xl mx-auto px-4 pt-8 sm:pt-12 pb-6 no-print">
        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-violet-200/50 dark:border-violet-800/50 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-400 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          {formulas.length} rumus tersedia
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent mb-2">
          📐 Bank Rumus
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Kumpulan rumus matematika siap pakai, tinggal copy & print!
        </p>

        <div className="card-elevated rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari rumus... (misal: Pythagoras)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-900 dark:text-white font-medium outline-none"
            >
              {topics.map((t) => (
                <option key={t} value={t}>{t === 'all' ? '📚 Semua Topik' : t}</option>
              ))}
            </select>
            <button
              onClick={() => setShowOnlyBookmark(!showOnlyBookmark)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                showOnlyBookmark
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Star className={`w-4 h-4 ${showOnlyBookmark ? 'fill-white' : ''}`} />
              Favorit
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 card-elevated rounded-2xl">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Belum ada rumus</h3>
            <p className="text-gray-500 mt-2">Coba ubah filter atau keyword pencarianmu.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([topic, items]) => (
              <div key={topic}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full"></span>
                  {topic}
                  <span className="text-xs font-normal text-gray-400">({items.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((f) => (
                    <div
                      key={f.id}
                      className="card-elevated rounded-2xl p-5 relative group hover:-translate-y-1 transition-all flex flex-col"
                    >
                      <button
                        onClick={() => toggleBookmark(f)}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all z-10 ${
                          isBookmarked(f)
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-amber-500'
                        }`}
                        title="Bookmark"
                      >
                        <Star className={`w-4 h-4 ${isBookmarked(f) ? 'fill-amber-500' : ''}`} />
                      </button>

                      <h3 
                        className="font-bold text-gray-900 dark:text-white mb-3 pr-10"
                        dangerouslySetInnerHTML={{ __html: renderTextWithLatex(f.title) }}
                      />

                      <div
                        className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-3 text-center overflow-x-auto formula-display"
                        dangerouslySetInnerHTML={{ __html: renderKatex(f.formula) }}
                      />

                      {f.description && (
                        <p 
                          className="text-sm text-gray-600 dark:text-gray-400 mb-3"
                          dangerouslySetInnerHTML={{ __html: renderTextWithLatex(f.description) }}
                        />
                      )}

                      {/* ⚡ TOMBOL & SECTION CARA + CONTOH SOAL */}
                      {(f.cara || f.contoh_soal) && (
                        <div className="mt-auto border-t border-gray-100 dark:border-slate-700/50 pt-3">
                          <button
                            onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                            className="w-full flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
                          >
                            <span>{expandedId === f.id ? 'Sembunyikan Detail' : 'Lihat Cara & Contoh Soal'}</span>
                            {expandedId === f.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {expandedId === f.id && (
                            <div className="mt-3 space-y-3 text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                              {f.cara && (
                                <div>
                                  <strong className="text-gray-800 dark:text-gray-200 block mb-1 text-xs uppercase tracking-wider">💡 Cara Penggunaan:</strong>
                                  <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed text-xs" dangerouslySetInnerHTML={{ __html: renderTextWithLatex(f.cara) }} />
                                </div>
                              )}
                              {f.contoh_soal && (
                                <div>
                                  <strong className="text-gray-800 dark:text-gray-200 block mb-1 text-xs uppercase tracking-wider">📝 Contoh Soal:</strong>
                                  <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed text-xs" dangerouslySetInnerHTML={{ __html: renderTextWithLatex(f.contoh_soal) }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-slate-700/50">
                        <span className="text-[10px] text-gray-400">
                          {f.materialTitle || ''}
                        </span>
                        <button
                          onClick={() => copyFormula(f)}
                          className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          {copiedId === f.id ? (
                            <><Check className="w-3.5 h-3.5" /> Tersalin</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy LaTeX</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormulaBank;
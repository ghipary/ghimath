import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader, Bot, User, Lightbulb, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import MathRenderer from './MathRenderer';

// GROQ_API_KEY dan GROQ_URL sudah dihapus (dipindah ke server)

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'groq/compound',
];

const AITutor = ({ material }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && material) {
      setMessages([{
        role: 'ai',
        text: `Halo! 👋 Aku AI Tutor GhiMath. Aku siap bantu kamu memahami materi **${material.title}**.\n\nTanya apa saja ya, misalnya:\n• "Jelaskan lebih sederhana"\n• "Kasih contoh soal dong"\n• "Apa itu ${material.topic}?"\n\nAyo mulai! 😊`,
      }]);
    }
  }, [isOpen, material]);

  const sendMessage = async (text = null) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const materialContext = `Judul Materi: ${material?.title || 'Materi Matematika'}
Jenjang: ${material?.level || '-'} Kelas ${material?.grade || '-'}
Topik: ${material?.topic || '-'}
Deskripsi: ${(material?.description || '').replace(/<[^>]*>/g, ' ').slice(0, 500)}
Konten (potongan): ${(material?.content || '').replace(/<[^>]*>/g, ' ').slice(0, 2000)}`;

      const historyContext = messages.slice(-10).map((m) => 
        `${m.role === 'user' ? 'Siswa' : 'AI Tutor'}: ${m.text}`
      ).join('\n');

      const systemPrompt = `Kamu adalah "AI Tutor GhiMath", asisten belajar matematika yang ramah, sabar, dan menyenangkan untuk siswa SMP & SMA Indonesia.

INFORMASI MATERI YANG SEDANG DIBACA:
${materialContext}

ATURAN UMUM:
1. Jawab dengan bahasa Indonesia yang ramah, santai, dan mudah dipahami siswa.
2. Gunakan analogi sederhana atau contoh kehidupan sehari-hari jika membantu.
3. JANGAN langsung kasih jawaban akhir kalau siswa tanya soal - bimbing mereka dengan petunjuk.
4. Kalau pertanyaan di luar topik materi atau di luar matematika, arahkan dengan sopan.
5. Maksimal 3 paragraf pendek per jawaban. Jangan bertele-tele.
6. Sesekali semangat dengan emoji (jangan berlebihan).

⚠️ CARA TULIS RUMUS MATEMATIKA (PENTING):
Gunakan format LaTeX dengan dollar sign. Sistem akan merender jadi tampilan cantik otomatis.

- Inline math (dalam kalimat): pakai $...$
  Contoh: "Nilai $x^2 + 2x + 1$ adalah..."
  
- Block math (rumus besar sendiri): pakai $$...$$
  Contoh: "$$\\frac{a^m \\cdot a^n}{a^p} = a^{m+n-p}$$"

- Untuk pecahan: \\frac{pembilang}{penyebut}
- Untuk pangkat: x^{2}, a^{m+n}
- Untuk akar: \\sqrt{16}, \\sqrt[3]{8}
- Untuk perkalian: \\times atau \\cdot
- Untuk pembagian: \\div atau \\frac{}{}
- Untuk pi: \\pi
- Untuk kurung: \\left( \\right), \\left[ \\right]
- Untuk sigma: \\sum_{i=1}^{n}
- Untuk integral: \\int_{a}^{b}
- Untuk limit: \\lim_{x \\to \\infty}

CONTOH JAWABAN BENAR:
"Untuk menghitung $3^4 \\times 3^{-2} \\div 3^1$, kita pakai aturan pangkat:

$$\\frac{3^4 \\times 3^{-2}}{3^1} = 3^{4 + (-2) - 1} = 3^1 = 3$$

Jadi hasilnya adalah $3$. Coba kamu kerjakan soal serupa ya!"

RIWAYAT PERCAKAPAN:
${historyContext}

Pertanyaan siswa: ${userMsg}`;

      console.log('🚀 [AI Tutor Groq] Mengirim request...');

      let successData = null;
      let lastError = null;
      let usedModel = null;

      for (const model of GROQ_MODELS) {
        console.log(`🧪 [AI Tutor Groq] Mencoba model: ${model}`);

        try {
          // UBAH: fetch ke /api/groq, hapus Authorization header
          const response = await fetch('/api/groq', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-10).map((m) => ({
                  role: m.role === 'user' ? 'user' : 'assistant',
                  content: m.text,
                })),
                { role: 'user', content: userMsg },
              ],
              temperature: 0.7,
              max_tokens: 500,
              top_p: 0.95,
            }),
          });

          console.log(`📡 [AI Tutor Groq] ${model} → status ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
              successData = data;
              usedModel = model;
              console.log(`✅ [AI Tutor Groq] SUCCESS dengan model: ${model}`);
              break;
            }
          } else {
            const errData = await response.json().catch(() => ({}));
            lastError = errData.error?.message || `HTTP ${response.status}`;
            console.warn(`⚠️ [AI Tutor Groq] ${model} gagal: ${lastError}`);
          }
        } catch (err) {
          lastError = err.message;
          console.warn(`❌ [AI Tutor Groq] ${model} error: ${err.message}`);
        }
      }

      if (!successData) {
        throw new Error(lastError || 'Semua model gagal. Cek API key / koneksi.');
      }

      const aiText = successData.choices[0].message.content;
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: aiText.trim(),
        model: usedModel,
      }]);
    } catch (error) {
      console.error('❌ [AI Tutor Groq] Caught error:', error);
      
      let errMsg = `Maaf, terjadi kesalahan. 🙏\n\nDetail: ${error.message || 'Unknown error'}`;
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Invalid API Key')) {
        errMsg = '❌ **API Key Groq tidak valid.**\n\nCek di https://console.groq.com/keys — pastikan key format `gsk_...` dan sudah copy dengan benar.';
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errMsg = '⏰ **Batas request tercapai.**\n\nTunggu 1 menit lalu coba lagi ya! (Groq gratis: 30 req/menit)';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errMsg = '📶 **Koneksi bermasalah.**\n\nCek internetmu, atau kemungkinan API key salah.';
      } else if (error.message?.includes('decommissioned') || error.message?.includes('not found') || error.message?.includes('404')) {
        errMsg = '🤖 **Model AI tidak tersedia.**\n\nCoba lagi nanti atau hubungi admin.';
      } else if (error.message?.includes('413') || error.message?.includes('too large')) {
        errMsg = '📚 **Materi terlalu panjang.**\n\nCoba tanya hal yang lebih singkat ya.';
      }
      
      setMessages((prev) => [...prev, { role: 'ai', text: errMsg, isError: true }]);
    }
    setLoading(false);
  };

  const quickPrompts = [
    'Jelaskan lebih sederhana',
    'Kasih contoh soal',
    'Apa itu ' + (material?.topic || 'materi ini') + '?',
    'Kesimpulan materi ini?',
  ];

  const clearChat = () => {
    if (window.confirm('Hapus semua percakapan?')) {
      setMessages([]);
      toast.success('Chat dibersihkan 🧹');
    }
  };

  // Blok if (!GROQ_API_KEY) return null; DIHAPUS agar tombol AI selalu muncul

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-2xl shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
          title="Tanya AI Tutor"
          aria-label="Tanya AI Tutor"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[85vh] sm:h-[600px] bg-white dark:bg-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border dark:border-slate-700">
          
          <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  AI Tutor
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-white/80">Powered by Groq ⚡</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button 
                  onClick={clearChat}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  title="Hapus chat"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Tutup chat"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-teal-400 to-cyan-600' 
                    : msg.isError
                      ? 'bg-gradient-to-br from-red-500 to-rose-600'
                      : 'bg-gradient-to-br from-violet-500 to-fuchsia-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : msg.isError ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-tl-sm shadow-sm border border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  ) : (
                    <MathRenderer text={msg.text} className="whitespace-pre-wrap" />
                  )}
                  {msg.role === 'ai' && msg.model && !msg.isError && (
                    <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 opacity-60">
                      via {msg.model} ⚡
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && !loading && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Coba tanya:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Tanya apa saja tentang materi ini..."
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none max-h-32"
                style={{ minHeight: '42px' }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                aria-label="Kirim pesan"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AITutor;
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  HelpCircle, Search, ChevronDown, Sparkles, MessageCircle, 
  Mail, BookOpen, Trophy, Award, User, Shield, Calculator,
  Zap, Users, FileText, CreditCard, Target, Compass, ChevronRight,
  Phone
} from 'lucide-react';

/* ═══════════════════════════════════════════════════ */
/* DATA FAQ                                            */
/* ═══════════════════════════════════════════════════ */
const FAQ_CATEGORIES = [
  { id: 'all', label: 'Semua', icon: Sparkles, color: 'teal' },
  { id: 'umum', label: 'Umum', icon: HelpCircle, color: 'teal' },
  { id: 'akun', label: 'Akun & Login', icon: User, color: 'violet' },
  { id: 'belajar', label: 'Belajar', icon: BookOpen, color: 'blue' },
  { id: 'kuis', label: 'Kuis & Nilai', icon: Trophy, color: 'amber' },
  { id: 'sertifikat', label: 'Sertifikat', icon: Award, color: 'rose' },
  { id: 'privasi', label: 'Privasi & Data', icon: Shield, color: 'emerald' },
];

const FAQ_DATA = [
  // ═══ UMUM ═══
  {
    id: 1,
    category: 'umum',
    question: 'Apakah GhiMath gratis?',
    answer: 'Ya! GhiMath 100% gratis selamanya. Semua fitur — materi, kuis, ujian, bank rumus, leaderboard, dan sertifikat — bisa kamu akses tanpa bayar sepeser pun. Tidak ada biaya tersembunyi, tidak perlu kartu kredit untuk mendaftar.',
  },
  {
    id: 2,
    category: 'umum',
    question: 'Apa itu GhiMath?',
    answer: 'GhiMath adalah platform pembelajaran matematika interaktif untuk siswa SMP dan SMA. Kami menyediakan materi lengkap dari kelas 7 hingga 12, kuis interaktif, ujian dengan timer, bank rumus, dan sistem leaderboard yang seru. Tujuannya: bikin belajar matematika jadi lebih mudah dan menyenangkan!',
  },
  {
    id: 3,
    category: 'umum',
    question: 'Apakah GhiMath bisa diakses dari HP?',
    answer: 'Tentu! GhiMath dirancang responsive untuk semua perangkat — HP, tablet, laptop, dan desktop. Kamu bisa belajar di mana saja, kapan saja, tinggal buka browser dan akses ghimath.vercel.app. Tidak perlu install aplikasi tambahan.',
  },
  {
    id: 4,
    category: 'umum',
    question: 'Materi apa saja yang tersedia?',
    answer: 'Kami menyediakan materi lengkap dari kelas 7 SMP hingga kelas 12 SMA, meliputi topik: Aljabar, Geometri, Statistika, Trigonometri, Kalkulus, Bilangan, Logaritma, Barisan, dan lainnya. Setiap materi dilengkapi bacaan interaktif, video, dan contoh soal.',
  },

  // ═══ AKUN & LOGIN ═══
  {
    id: 5,
    category: 'akun',
    question: 'Bagaimana cara mendaftar akun?',
    answer: 'Gampang banget! Klik tombol "Daftar" di kanan atas, isi nama, email, dan password. Atau langsung pakai akun Google. Prosesnya cuma 30 detik dan langsung bisa mulai belajar.',
  },
  {
    id: 6,
    category: 'akun',
    question: 'Saya lupa password, bagaimana?',
    answer: 'Tenang! Di halaman login, klik link "Lupa password?" di bawah kolom password. Masukkan email yang terdaftar, kami akan kirim link untuk reset password ke email kamu. Cek juga folder spam kalau tidak muncul dalam 5 menit.',
  },
  {
    id: 7,
    category: 'akun',
    question: 'Bisa login pakai akun Google?',
    answer: 'Bisa! Di halaman login, klik tombol "Masuk dengan Google". Tidak perlu isi form, cukup pilih akun Google kamu dan langsung masuk ke dashboard. Cara ini lebih cepat dan aman.',
  },
  {
    id: 8,
    category: 'akun',
    question: 'Bagaimana cara mengubah data profil?',
    answer: 'Buka halaman Profil (klik ikon user di navbar), lalu klik tombol "Edit Profil". Di sana kamu bisa mengubah nama, jenjang, kelas, sekolah, dan foto profil. Jangan lupa klik "Simpan" setelah selesai.',
  },

  // ═══ BELAJAR ═══
  {
    id: 9,
    category: 'belajar',
    question: 'Bagaimana cara mulai belajar?',
    answer: 'Setelah login, buka menu "Materi" di navbar. Pilih folder jenjang (SMP/SMA), lalu pilih kelas dan topik yang ingin dipelajari. Klik materi untuk membuka bacaan lengkap. Setelah selesai baca, klik "Tandai Selesai" agar progress-mu tercatat.',
  },
  {
    id: 10,
    category: 'belajar',
    question: 'Kenapa progress baca saya tidak bertambah?',
    answer: 'Progress dihitung dari waktu baca aktual (timer berjalan saat kamu membuka materi). Pastikan: (1) kamu sudah login, (2) tab materi tetap aktif (tidak minimize), (3) tidak pindah ke tab lain — karena timer otomatis dijeda saat kamu pindah tab.',
  },
  {
    id: 11,
    category: 'belajar',
    question: 'Ada video pembelajarannya juga?',
    answer: 'Ya! Beberapa materi dilengkapi video penjelasan dari YouTube. Kalau materi yang kamu buka belum ada videonya, jangan khawatir — bacaan teks + rumus matematikanya sudah lengkap dan bisa kamu pelajari sendiri.',
  },

  // ═══ KUIS & NILAI ═══
  {
    id: 12,
    category: 'kuis',
    question: 'Bagaimana cara mengerjakan kuis?',
    answer: 'Di halaman materi, klik tombol "Latihan Soal". Kamu akan dapat soal pilihan ganda dengan timer. Pilih jawaban, klik "Selanjutnya" untuk soal berikutnya. Setelah semua soal dijawab, klik "Selesai" dan skor langsung muncul.',
  },
  {
    id: 13,
    category: 'kuis',
    question: 'Apakah bisa mengulang kuis?',
    answer: 'Bisa! Kuis bisa dikerjakan berkali-kali. Tapi nilai yang tersimpan adalah nilai TERTINGGI kamu. Jadi kalau sudah dapat 80, lalu coba lagi dapat 60, nilai yang tercatat tetap 80. Tapi kalau dapat 90, otomatis nilai naik ke 90.',
  },
  {
    id: 14,
    category: 'kuis',
    question: 'Kenapa skor saya rendah?',
    answer: 'Jangan menyerah! Skor rendah artinya kamu belum paham materinya. Baca ulang materinya, perhatikan contoh soal dan pembahasan, lalu kerjakan kuis lagi. Ingat: setiap kali kamu salah, akan muncul pembahasan agar kamu belajar dari kesalahan.',
  },
  {
    id: 15,
    category: 'kuis',
    question: 'Apa itu Kuis Harian?',
    answer: 'Kuis Harian adalah tantangan 5 soal acak dari semua materi jenjangmu. Bisa dikerjakan 1 kali per hari. Skornya masuk ke rata-rata keseluruhan. Jadi jangan lupa kerjakan setiap hari untuk menjaga streak dan menambah nilai!',
  },
  {
    id: 16,
    category: 'kuis',
    question: 'Apa itu Smart Score di Leaderboard?',
    answer: 'Smart Score adalah skor gabungan dari semua aspek performamu: nilai kuis (35%), nilai ujian (20%), materi selesai (15%), jumlah kuis (10%), day streak (10%), kecepatan (5%), dan waktu baca (5%). Semakin rajin dan pintar kamu, semakin tinggi Smart Score-mu!',
  },

  // ═══ SERTIFIKAT ═══
  {
    id: 17,
    category: 'sertifikat',
    question: 'Bagaimana cara dapat sertifikat?',
    answer: 'Sertifikat terbuka otomatis setelah kamu menyelesaikan minimal 5 materi DAN 5 kuis. Setelah itu, buka halaman Profil → klik "Sertifikat Saya". Kamu bisa download PDF-nya dan bagikan ke media sosial.',
  },
  {
    id: 18,
    category: 'sertifikat',
    question: 'Apa arti level Bronze, Silver, Gold, Platinum?',
    answer: 'Level sertifikat berdasarkan rata-rata nilai kuis kamu: Bronze (<60), Silver (60-74), Gold (75-89), dan Platinum (90+). Semakin tinggi nilaimu, semakin bergengsi sertifikatnya! Yuk, kejar Platinum!',
  },
  {
    id: 19,
    category: 'sertifikat',
    question: 'Apakah sertifikat bisa dicetak?',
    answer: 'Bisa! Sertifikat kami dirancang dengan ukuran A4 landscape, siap dicetak. Tinggal download PDF, lalu print di kertas A4 dengan orientasi landscape. Sertifikat juga bisa dibagikan ke media sosial untuk pamer ke teman-teman.',
  },

  // ═══ PRIVASI & DATA ═══
  {
    id: 20,
    category: 'privasi',
    question: 'Apakah data saya aman?',
    answer: 'Sangat aman! Kami menggunakan Firebase (Google Cloud) untuk menyimpan data dengan enkripsi standar industri. Password disimpan terenkripsi — admin pun tidak bisa melihatnya. Data pribadi seperti email dan nama hanya dipakai untuk keperluan belajar di GhiMath.',
  },
  {
    id: 21,
    category: 'privasi',
    question: 'Apakah data saya dibagikan ke pihak ketiga?',
    answer: 'Tidak! Kami tidak pernah menjual, menyewakan, atau membagikan data kamu ke pihak ketiga. Semua data (nama, email, nilai, progress) hanya tersimpan di server GhiMath dan hanya dipakai untuk keperluan belajar kamu sendiri.',
  },
  {
    id: 22,
    category: 'privasi',
    question: 'Bagaimana cara menghapus akun saya?',
    answer: 'Kalau kamu ingin menghapus akun, silakan hubungi kami melalui WhatsApp atau email di bawah. Kami akan proses dalam 1x24 jam. Data kamu akan dihapus permanen dari server kami, tidak bisa dikembalikan.',
  },
];

/* ═══════════════════════════════════════════════════ */
/* KOMPONEN UTAMA                                      */
/* ═══════════════════════════════════════════════════ */
const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState({});

  // Filter FAQ
  const filteredFAQ = useMemo(() => {
    let result = FAQ_DATA;

    if (activeCategory !== 'all') {
      result = result.filter((faq) => faq.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeCategory, searchQuery]);

  const toggleItem = (id) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryColor = (categoryId) => {
    const cat = FAQ_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.color || 'teal';
  };

  // Card color styles per kategori
  const categoryColors = {
    teal: { bg: 'from-teal-400 to-cyan-600', shadow: 'shadow-teal-500/30', text: 'text-teal-600 dark:text-teal-400' },
    violet: { bg: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30', text: 'text-violet-600 dark:text-violet-400' },
    blue: { bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
    amber: { bg: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
    rose: { bg: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
    emerald: { bg: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
  };

  return (
    <div className="page-bg transition-colors min-h-screen flex flex-col">
      <div className="grid-pattern"></div>
      <Navbar />

      {/* HERO */}
      <section className="page-content px-4 pt-12 sm:pt-16 pb-8 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-float-custom"></div>
        <div className="absolute top-20 right-10 w-52 h-52 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl animate-float-reverse"></div>

        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <HelpCircle className="w-4 h-4" />
            Pusat Bantuan
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-4">
            Ada Pertanyaan?
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Kami Punya Jawabannya!
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Temukan jawaban atas pertanyaan yang sering ditanyakan tentang GhiMath. Kalau masih bingung, langsung chat kami!
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pertanyaan... (misal: gratis, sertifikat, password)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-lg transition-all"
            />
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="page-content px-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {FAQ_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const colors = categoryColors[cat.color] || categoryColors.teal;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${colors.bg} text-white shadow-lg ${colors.shadow} -translate-y-0.5`
                      : 'bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-teal-400 hover:-translate-y-0.5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ LIST */}
      <section className="page-content flex-1 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Info jumlah hasil */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
            Menampilkan <strong className="text-teal-600 dark:text-teal-400">{filteredFAQ.length}</strong> pertanyaan
            {searchQuery && (
              <>
                {' '}untuk pencarian "<strong className="text-teal-600 dark:text-teal-400">{searchQuery}</strong>"
              </>
            )}
          </p>

          {filteredFAQ.length === 0 ? (
            <div className="card-elevated rounded-3xl p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Tidak ada hasil 😕
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                Coba kata kunci lain, atau pilih kategori yang berbeda.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQ.map((faq, idx) => {
                const isOpen = openItems[faq.id];
                const catColor = getCategoryColor(faq.category);
                const colors = categoryColors[catColor] || categoryColors.teal;
                
                return (
                  <div
                    key={faq.id}
                    className={`card-elevated rounded-2xl overflow-hidden transition-all ${
                      isOpen ? 'ring-2 ring-teal-400/40' : ''
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-md ${colors.shadow}`}>
                          <span className="text-white text-sm font-bold">{idx + 1}</span>
                        </div>
                        <h3 className={`font-bold text-base text-gray-900 dark:text-white leading-tight transition-colors ${
                          isOpen ? colors.text : ''
                        }`}>
                          {faq.question}
                        </h3>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isOpen 
                          ? `bg-gradient-to-br ${colors.bg} text-white rotate-180` 
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-5 pb-5 pl-[68px]">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="page-content px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 rounded-3xl p-8 md:p-10 text-center shadow-2xl shadow-teal-500/30">
            
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-custom"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl animate-float-reverse"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Masih Bingung?
              </h2>
              <p className="text-cyan-50 text-base mb-8 max-w-lg mx-auto">
                Kalau pertanyaanmu belum terjawab di atas, langsung hubungi kami. Kami siap membantu!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                <a
                  href="https://wa.me/6285196688109?text=Halo%20GhiMath%2C%20saya%20butuh%20bantuan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-teal-700 font-bold px-6 py-3.5 rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  <Phone className="w-5 h-5" />
                  Chat WhatsApp
                </a>
                <a
                  href="mailto:support@ghimath.app?subject=Bantuan%20GhiMath"
                  className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-white/30 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  <Mail className="w-5 h-5" />
                  Kirim Email
                </a>
              </div>

              <p className="text-xs text-cyan-100 mt-6">
                Rata-rata respon: <strong>dalam 1x24 jam</strong> ✨
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
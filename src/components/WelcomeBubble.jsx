import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Flame, Target, Heart, Brain } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const WelcomeBubble = ({ dailyDone }) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState('sparkles');
  const [streak, setStreak] = useState(0);

  // ⚡ Kumpulan pesan penyemangat
  const messages = {
    newUser: [
      "Selamat datang di GhiMath! Yuk mulai perjalanan matematikamu! 🎉",
      "Hai! Aku teman belajar kamu. Siap jadi jago matematika?",
      "Senang bertemu kamu! Yuk kita mulai petualangan belajarnya!",
    ],
    needDaily: [
      "Jangan lupa kerjakan Kuis Harian hari ini ya! 🔥",
      "Psst... Kuis Harian kamu belum dikerjakan lho. Yuk semangat!",
      "Ayo kerjakan Kuis Harian dulu sebelum ngelanjutin materi!",
    ],
    streakLong: [
      "Keren! Streak kamu panjang banget. Jangan sampai putus ya! 🔥",
      "Wah, konsisten sekali! Pertahankan streak-mu hari ini!",
    ],
    greeting: [
      "Semangat belajar hari ini! Kamu pasti bisa! 💪",
      "Jangan menyerah, matematika itu menyenangkan kok!",
      "Belajar sedikit setiap hari lebih baik dari banyak sekaligus! 📚",
      "Ayo buktikan kalau kamu bisa lebih pintar dari kemarin! 🚀",
    ],
  };

  useEffect(() => {
    if (!user) {
      // ⚡ Saat user logout, hapus flag supaya bubble muncul lagi saat login berikutnya
      sessionStorage.removeItem('welcomeBubbleShown');
      setShow(false);
      return;
    }

    // ⚡ Pakai sessionStorage: hilang saat browser/tab ditutup atau user logout
    const hasShownThisSession = sessionStorage.getItem('welcomeBubbleShown');
    if (hasShownThisSession) return;

    const fetchAndShow = async () => {
      try {
        // Ambil nama dari Auth (0 kuota Firestore)
        const displayName = user.displayName || user.email?.split('@')[0] || 'Sahabat';
        const firstName = displayName.split(' ')[0];
        setUserName(firstName);

        // Ambil data user dari Firestore (SEKALI SAJA per session)
        // Note: request ini juga dipakai Dashboard, jadi tidak menambah kuota signifikan
        let currentStreak = 0;
        let isNewUser = false;

        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            currentStreak = userData.currentStreak || 0;
          }
        } catch (e) {
          console.warn('Gagal ambil data user untuk bubble:', e.message);
        }

        // Cek user baru (< 1 hari)
        const userCreatedAt = user.metadata?.creationTime;
        if (userCreatedAt) {
          const ageMs = Date.now() - new Date(userCreatedAt).getTime();
          isNewUser = ageMs < 24 * 60 * 60 * 1000;
        }

        // Pilih pesan & ikon berdasarkan kondisi
        let chosenMessage;
        let chosenIcon;

        if (isNewUser) {
          chosenMessage = messages.newUser[Math.floor(Math.random() * messages.newUser.length)];
          chosenIcon = 'heart';
        } else if (!dailyDone) {
          chosenMessage = messages.needDaily[Math.floor(Math.random() * messages.needDaily.length)];
          chosenIcon = 'flame';
        } else if (currentStreak >= 7) {
          chosenMessage = messages.streakLong[Math.floor(Math.random() * messages.streakLong.length)];
          chosenIcon = 'flame';
        } else {
          chosenMessage = messages.greeting[Math.floor(Math.random() * messages.greeting.length)];
          chosenIcon = 'sparkles';
        }

        setStreak(currentStreak);
        setMessage(chosenMessage);
        setIcon(chosenIcon);
        setShow(true);

        // Tandai sudah ditampilkan di session ini
        sessionStorage.setItem('welcomeBubbleShown', 'true');

        // Auto-hide setelah 15 detik (agak lama biar user baca)
        setTimeout(() => setShow(false), 15000);
      } catch (err) {
        console.error('Gagal menampilkan welcome bubble:', err);
      }
    };

    // Delay 1.5 detik biar smooth (setelah dashboard load)
    const timer = setTimeout(fetchAndShow, 1500);
    return () => clearTimeout(timer);
  }, [user, dailyDone]);

  if (!show || !user) return null;

  const iconMap = {
    sparkles: <Sparkles className="w-5 h-5 text-white" />,
    flame: <Flame className="w-5 h-5 text-white" />,
    target: <Target className="w-5 h-5 text-white" />,
    heart: <Heart className="w-5 h-5 text-white" />,
    brain: <Brain className="w-5 h-5 text-white" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-[calc(100vw-3rem)] sm:max-w-sm animate-[slideIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
      {/* Animasi slide in dengan efek "pop" */}
      <style>{`
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.9); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-br from-teal-400/30 via-cyan-400/20 to-blue-500/30 rounded-3xl blur-lg"></div>

        {/* Balon Chat Utama */}
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl rounded-br-sm shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Decorative Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"></div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Avatar dengan ikon dinamis + animasi pulse */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/40 animate-pulse-slow">
                  {iconMap[icon] || iconMap.sparkles}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-800">
                  <div className="w-full h-full rounded-full bg-green-400 animate-ping opacity-75"></div>
                </div>
              </div>

              {/* Pesan */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    GhiMath Assistant
                  </p>
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></div>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                    baru saja
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Hai <span className="font-bold text-teal-600 dark:text-teal-400">{userName}</span>! {message}
                </p>
                {streak > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 border border-orange-200 dark:border-orange-500/30 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      Streak: {streak} hari
                    </span>
                  </div>
                )}
              </div>

              {/* Tombol Close */}
              <button
                onClick={() => setShow(false)}
                className="flex-shrink-0 p-1.5 -mt-1 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ekor Balon Chat */}
        <div className="absolute -bottom-1 right-4 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-gray-200 dark:border-slate-700 transform rotate-45"></div>
      </div>

      {/* Custom animation for slow pulse */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7); }
          50% { box-shadow: 0 0 0 8px rgba(20, 184, 166, 0); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeBubble;
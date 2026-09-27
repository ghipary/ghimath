import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // 1. Deteksi apakah perangkatnya iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 2. Cek apakah aplikasi sudah di-install (mode standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Kalau sudah di-install, jangan tampilkan banner
    }

    // 3. Logika untuk Android/Desktop (Chrome/Edge)
    if (isIosDevice) {
      // Di iOS, event beforeinstallprompt tidak ada. Kita tampilkan banner manual.
      setIsVisible(true);
    } else {
      // Di Android/Desktop, tunggu event dari browser
      const handler = (e) => {
        e.preventDefault(); // Cegah prompt default browser
        setDeferredPrompt(e);
        setIsVisible(true); // Munculkan banner kita
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    // Kalau iOS, tampilkan modal petunjuk manual
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }
    
    // Kalau Android/Desktop, munculkan prompt install bawaan browser
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  // Kalau tidak visible, jangan render apa-apa
  if (!isVisible) return null;

  return (
    <>
      {/* BANNER INSTALL UTAMA */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-teal-100 dark:border-teal-900/50 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Install GhiMath</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Akses lebih cepat & bisa offline</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Nanti saja"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Install
            </button>
          </div>
        </div>
      </div>

      {/* MODAL KHUSUS PENGGUNA IPHONE (iOS) */}
      {showIOSHint && (
        <div 
          className="fixed inset-0 z-[110] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setShowIOSHint(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-500" /> Cara Install di iPhone
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Karena keterbatasan sistem Apple, ikuti langkah ini untuk menambahkan GhiMath ke Home Screen:
            </p>
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-4 list-decimal list-inside font-medium">
              <li>Tap tombol <strong>Share</strong> <span className="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">kotak dengan panah ke atas</span> di bagian bawah Safari.</li>
              <li>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong>.</li>
              <li>Tap <strong>"Add"</strong> di pojok kanan atas.</li>
            </ol>
            <button 
              onClick={() => setShowIOSHint(false)} 
              className="mt-6 w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 py-3.5 rounded-xl font-bold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
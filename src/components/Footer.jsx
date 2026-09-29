import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import FeedbackModal from './FeedbackModal';
import { Mail, Globe, Code, Heart, HelpCircle, Info, Shield, MessageCircle, MessageSquareHeart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <footer className="bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* BRAND */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-4 group w-fit">
                <div className="group-hover:scale-105 transition-transform">
                  <Logo size={40} />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  GhiMath
                </span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed mb-5">
                Media pembelajaran matematika interaktif untuk siswa SMP & SMA. 
                Belajar mandiri kapan saja, di mana saja — gratis!
              </p>
              <div className="flex gap-3">
                <a 
                  href="mailto:abdrrhmn.alghifary@gmail.com" 
                  className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-600 dark:hover:border-teal-500 transition-colors"
                  title="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a 
                  href="https://wa.me/6281234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-600 dark:hover:border-teal-500 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a 
                  href="https://github.com/ghipary/ghimath" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-600 dark:hover:border-teal-500 transition-colors"
                  title="GitHub"
                >
                  <Code className="w-5 h-5" />
                </a>
                <a 
                  href="https://ghimath.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-600 dark:hover:border-teal-500 transition-colors"
                  title="Website"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* MENU */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Menu</h4>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>
                  <Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link to="/materi" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Materi
                  </Link>
                </li>
                <li>
                  <Link to="/rumus" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Bank Rumus
                  </Link>
                </li>
                <li>
                  <Link to="/leaderboard" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    Leaderboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* BANTUAN */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Bantuan</h4>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li>
                  <Link 
                    to="/faq" 
                    className="flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/tentang" 
                    className="flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/kebijakan-privasi" 
                    className="flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Kebijakan Privasi
                  </Link>
                </li>
                {/* ⚡ Link ke Feedback Modal */}
                <li>
                  <button 
                    onClick={() => setShowFeedback(true)}
                    className="flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                  >
                    <MessageSquareHeart className="w-3.5 h-3.5" />
                    Laporkan Bug / Beri Masukan
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:abdrrhmn.alghifary@gmail.com" 
                    className="flex items-center gap-2 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Kontak
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="pt-8 border-t dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-wrap justify-center">
              © {currentYear} GhiMath. Dibuat dengan
              <Heart className="w-4 h-4 text-red-500 fill-red-500 inline" />
              untuk pendidikan Indonesia.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              v1.0 • Made with React + Firebase
            </p>
          </div>
        </div>
      </footer>

      {/* ⚡ Feedback Modal dari Footer */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </>
  );
};

export default Footer;
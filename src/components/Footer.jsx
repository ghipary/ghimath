import React from 'react';
import { Calculator, Mail, Instagram, Code, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-8 h-8 text-teal-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">GhiMath</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
              Media pembelajaran matematika interaktif untuk siswa SMP & SMA. 
              Belajar mandiri kapan saja, di mana saja — gratis!
            </p>
            <div className="flex gap-3 mt-6">
              <a href="mailto:abdrrhmn.alghifary@gmail.com" className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 hover:border-teal-600 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 hover:border-teal-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://github.com/ghipary/ghimath" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-teal-600 hover:border-teal-600 transition-colors">
                <Code className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Menu</h4>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li><a href="/" className="hover:text-teal-600 transition-colors">Beranda</a></li>
              <li><a href="/materi" className="hover:text-teal-600 transition-colors">Materi</a></li>
              <li><a href="/register" className="hover:text-teal-600 transition-colors">Daftar</a></li>
              <li><a href="/login" className="hover:text-teal-600 transition-colors">Masuk</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Bantuan</h4>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-teal-600 transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Kebijakan Privasi</a></li>
              <li><a href="mailto:abdrrhmn.alghifary@gmail.com" className="hover:text-teal-600 transition-colors">Kontak</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            © {new Date().getFullYear()} GhiMath. Dibuat dengan 
            <Heart className="w-4 h-4 text-red-500 fill-red-500" /> 
            untuk pendidikan Indonesia.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            v1.0 • Made with React + Firebase
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
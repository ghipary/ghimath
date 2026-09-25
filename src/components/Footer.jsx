import React from 'react';
import { Calculator } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-800 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Calculator className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">GhiMath</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Belajar Matematika Jadi Lebih Mudah. <br /> Untuk SMP & SMA.
        </p>
        <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <a href="#" className="hover:text-blue-600">Tentang Kami</a>
          <a href="#" className="hover:text-blue-600">Kebijakan Privasi</a>
          <a href="#" className="hover:text-blue-600">Kontak</a>
        </div>
        <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} GhiMath. Dibuat dengan ❤️ untuk pendidikan Indonesia.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, Calculator, LayoutDashboard, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Cek dark mode dari localStorage saat pertama kali dimuat
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Cek apakah user yang login memiliki role 'admin' di Firestore
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Gagal cek admin:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  // Fungsi toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Fungsi logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo GhiMath */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <Calculator className="w-8 h-8 text-teal-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">GhiMath</span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium">Beranda</Link>
            <Link to="/materi" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium">Materi</Link>
            
            {/* Menu Admin - HANYA muncul kalau role = admin */}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium hover:underline">
                <Settings className="w-4 h-4" /> Admin
              </Link>
            )}

            {/* Tombol Dark Mode */}
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>

            {/* Cek apakah user sudah login */}
            {user ? (
              // Tampilan jika SUDAH login
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-medium hover:underline">
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
                {/* LINK PROFIL (BARU) */}
                <Link to="/profil" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium">
                  <User className="w-5 h-5" /> Profil
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm">
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            ) : (
              // Tampilan jika BELUM login
              <>
                <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">Masuk</Link>
                <Link to="/register" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-medium transition-colors">Daftar</Link>
              </>
            )}
          </div>

          {/* Menu Mobile (Hamburger) */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-6 h-6 dark:text-white" /> : <Menu className="w-6 h-6 dark:text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t dark:border-slate-800 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <Link to="/" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">Beranda</Link>
          <Link to="/materi" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">Materi</Link>
          
          {/* Menu Admin Mobile */}
          {isAdmin && (
            <Link to="/admin" className="block px-3 py-2 text-amber-600 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg">
              Admin Panel
            </Link>
          )}

          <div className="pt-2 border-t dark:border-slate-800">
            {user ? (
              <>
                <Link to="/dashboard" className="block px-3 py-2 text-teal-600 font-medium">Dashboard</Link>
                {/* LINK PROFIL MOBILE (BARU) */}
                <Link to="/profil" className="block px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">Profil</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-red-500 font-medium">Keluar</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-teal-600 font-medium">Masuk</Link>
                <Link to="/register" className="block px-3 py-2 mt-1 bg-teal-600 text-white text-center rounded-xl font-medium">Daftar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, LayoutDashboard, LogOut, Settings, 
  User, Trophy, Search, Home, BookOpen 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';
import GlobalSearch from './GlobalSearch';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cek route aktif
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Style untuk Menu Desktop (Pill/Card Effect)
  const desktopLinkClass = (path) => {
    const base = "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border";
    if (isActive(path)) {
      return `${base} text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-900/30 border-teal-200/50 dark:border-teal-700/50 shadow-sm`;
    }
    return `${base} text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100/80 dark:hover:bg-slate-800/60 border-transparent hover:border-gray-200 dark:hover:border-slate-700/50`;
  };

  // Style khusus untuk Link Admin di Desktop
  const desktopAdminClass = () => {
    const base = "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border";
    if (isActive('/admin')) {
      return `${base} text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-700/50 shadow-sm font-bold`;
    }
    return `${base} text-amber-600 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-900/30 border-transparent hover:border-amber-200 dark:hover:border-amber-700/50`;
  };

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Keyboard shortcut: Ctrl+K untuk buka search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Gagal logout:', error);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <Link to="/" className="flex items-center gap-2.5 cursor-pointer group">
              <div className="group-hover:scale-105 transition-transform">
                <Logo size={40} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                GhiMath
              </span>
            </Link>

            {/* ================= MENU DESKTOP ================= */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/" className={desktopLinkClass('/')}>
                <Home className="w-4 h-4" /> Beranda
              </Link>
              <Link to="/materi" className={desktopLinkClass('/materi')}>
                <BookOpen className="w-4 h-4" /> Materi
              </Link>
              <Link to="/leaderboard" className={desktopLinkClass('/leaderboard')}>
                <Trophy className="w-4 h-4" /> Leaderboard
              </Link>
              
              {isAdmin && (
                <Link to="/admin" className={desktopAdminClass()}>
                  <Settings className="w-4 h-4" /> Admin
                </Link>
              )}

              <div className="w-px h-6 bg-gray-300 dark:bg-slate-700 mx-1"></div>

              {/* SEARCH BUTTON */}
              <button 
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-gray-300 dark:hover:border-slate-600"
                title="Cari (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline font-medium">Cari...</span>
                <kbd className="hidden lg:inline px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  Ctrl+K
                </kbd>
              </button>

              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-600">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/dashboard" className={desktopLinkClass('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/profil" className={desktopLinkClass('/profil')}>
                    <User className="w-4 h-4" /> Profil
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-xl font-medium text-sm transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50">
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/30 px-4 py-2 rounded-xl transition-colors">
                    Masuk
                  </Link>
                  <Link to="/register" className="bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/30">
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* ================= TOMBOL MOBILE ================= */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Cari"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                {isOpen ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* ================= MENU MOBILE (ANIMASI SLIDE DOWN & CARD STYLE) ================= */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-slate-700/60 ${
            isOpen ? 'max-h-[600px] opacity-100 py-4 shadow-xl' : 'max-h-0 opacity-0 py-0'
          }`}
        >
          <div className="px-4 space-y-2">
            
            {/* Group 1: Menu Utama */}
            <Link 
              to="/" 
              className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 font-bold shadow-sm' 
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive('/') ? 'bg-teal-100 dark:bg-teal-800/50 text-teal-600 dark:text-teal-300' : 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                <Home className="w-5 h-5" />
              </div>
              <span>Beranda</span>
            </Link>

            <Link 
              to="/materi" 
              className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                isActive('/materi') 
                  ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 font-bold shadow-sm' 
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive('/materi') ? 'bg-teal-100 dark:bg-teal-800/50 text-teal-600 dark:text-teal-300' : 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Materi</span>
            </Link>

            <Link 
              to="/leaderboard" 
              className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                isActive('/leaderboard') 
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 font-bold shadow-sm' 
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${isActive('/leaderboard') ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-300' : 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 dark:group-hover:text-amber-400'}`}>
                <Trophy className="w-5 h-5" />
              </div>
              <span>Leaderboard</span>
            </Link>

            {isAdmin && (
              <Link 
                to="/admin" 
                className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                  isActive('/admin') 
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 font-bold shadow-sm' 
                    : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive('/admin') ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-300' : 'bg-white dark:bg-slate-700/50 text-amber-500 dark:text-amber-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600'}`}>
                  <Settings className="w-5 h-5" />
                </div>
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-slate-700/60 my-3 mx-2"></div>

            {/* Group 2: User Menu */}
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                    isActive('/dashboard') 
                      ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 font-bold shadow-sm' 
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isActive('/dashboard') ? 'bg-teal-100 dark:bg-teal-800/50 text-teal-600 dark:text-teal-300' : 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/profil" 
                  className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                    isActive('/profil') 
                      ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 font-bold shadow-sm' 
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isActive('/profil') ? 'bg-teal-100 dark:bg-teal-800/50 text-teal-600 dark:text-teal-300' : 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <span>Profil</span>
                </Link>

                <button 
                  onClick={handleLogout} 
                  className="group flex w-full items-center gap-3 p-3 rounded-2xl border bg-red-50/50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Keluar</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="group flex items-center justify-center gap-3 p-3 rounded-2xl border bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Masuk
                </Link>
                <Link 
                  to="/register" 
                  className="group flex items-center justify-center gap-3 p-3 rounded-2xl border border-transparent bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white transition-all duration-200 shadow-lg shadow-teal-500/30 font-medium hover:shadow-teal-500/50"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* GLOBAL SEARCH MODAL */}
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;
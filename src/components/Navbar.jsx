import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, LayoutDashboard, LogOut, Settings, User, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const linkClass = (path) => {
    const base = "font-medium transition-colors relative";
    if (isActive(path)) {
      return `${base} text-teal-600 dark:text-teal-400 after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-teal-500 after:to-cyan-500 after:rounded-full`;
    }
    return `${base} text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400`;
  };

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
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
    <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 shadow-sm">
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

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={linkClass('/')}>Beranda</Link>
            <Link to="/materi" className={linkClass('/materi')}>Materi</Link>
            <Link to="/leaderboard" className={`flex items-center gap-1 ${linkClass('/leaderboard')}`}>
              <Trophy className="w-4 h-4" /> Leaderboard
            </Link>
            
            {isAdmin && (
              <Link to="/admin" className={`flex items-center gap-1 ${isActive('/admin') ? 'text-amber-600 dark:text-amber-400 font-bold after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-amber-400 after:to-orange-500 after:rounded-full relative' : 'text-amber-600 dark:text-amber-400 font-medium hover:underline'}`}>
                <Settings className="w-4 h-4" /> Admin
              </Link>
            )}

            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className={`flex items-center gap-2 ${linkClass('/dashboard')}`}>
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
                <Link to="/profil" className={`flex items-center gap-2 ${linkClass('/profil')}`}>
                  <User className="w-5 h-5" /> Profil
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm">
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">Masuk</Link>
                <Link to="/register" className="bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/30">
                  Daftar
                </Link>
              </>
            )}
          </div>

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

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t dark:border-slate-700 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <Link to="/" className={`block px-3 py-2 rounded-lg ${isActive('/') ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Beranda</Link>
          <Link to="/materi" className={`block px-3 py-2 rounded-lg ${isActive('/materi') ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>Materi</Link>
          <Link to="/leaderboard" className={`block px-3 py-2 rounded-lg ${isActive('/leaderboard') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
            🏆 Leaderboard
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className={`block px-3 py-2 rounded-lg ${isActive('/admin') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold' : 'text-amber-600 font-medium hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
              Admin Panel
            </Link>
          )}

          <div className="pt-2 border-t dark:border-slate-700">
            {user ? (
              <>
                <Link to="/dashboard" className={`block px-3 py-2 rounded-lg ${isActive('/dashboard') ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-bold' : 'text-teal-600 font-medium'}`}>Dashboard</Link>
                <Link to="/profil" className={`block px-3 py-2 rounded-lg ${isActive('/profil') ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>Profil</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-red-500 font-medium">Keluar</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-teal-600 font-medium">Masuk</Link>
                <Link to="/register" className="block px-3 py-2 mt-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-center rounded-xl font-medium shadow-lg">Daftar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
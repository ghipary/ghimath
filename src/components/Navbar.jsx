import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, LayoutDashboard, LogOut, Settings, 
  User, Trophy, Search, Home, BookOpen, Sparkles, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';
import GlobalSearch from './GlobalSearch';

// Komponen khusus untuk menu mobile biar kodenya rapi
const MobileLink = ({ to, icon: Icon, label, isActive, color = 'teal', onClick }) => {
  const isCurrent = isActive(to);

  const colorStyles = {
    teal: {
      activeBg: 'bg-teal-50 border-teal-200 dark:bg-teal-900/30 dark:border-teal-700/50 text-teal-700 dark:text-teal-400 font-bold shadow-sm',
      inactiveBg: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm hover:shadow-md',
      activeIcon: 'bg-teal-100 dark:bg-teal-800/50 text-teal-600 dark:text-teal-300',
      inactiveIcon: 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 dark:group-hover:text-teal-400'
    },
    amber: {
      activeBg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 font-bold shadow-sm',
      inactiveBg: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm hover:shadow-md',
      activeIcon: 'bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-300',
      inactiveIcon: 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 dark:group-hover:text-amber-400'
    },
    violet: {
      activeBg: 'bg-violet-50 border-violet-200 dark:bg-violet-900/30 dark:border-violet-700/50 text-violet-700 dark:text-violet-400 font-bold shadow-sm',
      inactiveBg: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-700 shadow-sm hover:shadow-md',
      activeIcon: 'bg-violet-100 dark:bg-violet-800/50 text-violet-600 dark:text-violet-300',
      inactiveIcon: 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 group-hover:text-violet-600 dark:group-hover:text-violet-400'
    },
    red: {
      activeBg: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700/50 text-red-700 dark:text-red-400 font-bold shadow-sm',
      inactiveBg: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-red-300 dark:hover:border-red-700 shadow-sm hover:shadow-md',
      activeIcon: 'bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300',
      inactiveIcon: 'bg-white dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/30 group-hover:text-red-600 dark:group-hover:text-red-400'
    }
  };

  const style = colorStyles[color];

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${isCurrent ? style.activeBg : style.inactiveBg}`}
    >
      <div className={`p-2 rounded-xl transition-colors ${isCurrent ? style.activeIcon : style.inactiveIcon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span>{label}</span>
    </Link>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Base class untuk menu desktop (padding dikurangi biar hemat tempat)
  const baseDesktop = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap";

  const desktopLinkClass = (path) => {
    if (isActive(path)) {
      return `${baseDesktop} text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-900/30 border-teal-200/50 dark:border-teal-700/50 shadow-sm`;
    }
    return `${baseDesktop} text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100/80 dark:hover:bg-slate-800/60 border-transparent hover:border-gray-200 dark:hover:border-slate-700/50`;
  };

  const desktopRumusClass = () => {
    if (isActive('/rumus')) {
      return `${baseDesktop} text-violet-700 dark:text-violet-300 bg-violet-50/80 dark:bg-violet-900/30 border-violet-200/50 dark:border-violet-700/50 shadow-sm font-bold`;
    }
    return `${baseDesktop} text-violet-600 dark:text-violet-400 hover:bg-violet-50/80 dark:hover:bg-violet-900/30 border-transparent hover:border-violet-200 dark:hover:border-violet-700/50`;
  };

  const desktopUjianClass = () => {
    if (isActive('/ujian')) {
      return `${baseDesktop} text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-900/30 border-red-200/50 dark:border-red-700/50 shadow-sm font-bold`;
    }
    return `${baseDesktop} text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/30 border-transparent hover:border-red-200 dark:hover:border-red-700/50`;
  };

  const desktopAdminClass = () => {
    if (isActive('/admin')) {
      return `${baseDesktop} text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-700/50 shadow-sm font-bold`;
    }
    return `${baseDesktop} text-amber-600 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-900/30 border-transparent hover:border-amber-200 dark:hover:border-amber-700/50`;
  };

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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
          
          {/* === LAYOUT SIMETRIS: flex-1 di kiri & kanan, center di tengah === */}
          <div className="flex justify-between items-center h-16">
            
            {/* KOLOM KIRI: Logo (flex-1 agar seimbang) */}
            <div className="flex-1 flex justify-start">
              <Link to="/" className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0">
                <div className="group-hover:scale-105 transition-transform">
                  <Logo size={40} />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  GhiMath
                </span>
              </Link>
            </div>

            {/* KOLOM TENGAH: Menu Utama */}
            <div className="hidden lg:flex items-center justify-center gap-1">
              <Link to="/" className={desktopLinkClass('/')}>
                <Home className="w-4 h-4" /> <span className="hidden xl:inline">Beranda</span>
              </Link>
              <Link to="/materi" className={desktopLinkClass('/materi')}>
                <BookOpen className="w-4 h-4" /> <span className="hidden xl:inline">Materi</span>
              </Link>
              <Link to="/leaderboard" className={desktopLinkClass('/leaderboard')}>
                <Trophy className="w-4 h-4" /> <span className="hidden xl:inline">Leaderboard</span>
              </Link>
              <Link to="/rumus" className={desktopRumusClass()}>
                <Sparkles className="w-4 h-4" /> <span className="hidden xl:inline">Rumus</span>
              </Link>
              <Link to="/ujian" className={desktopUjianClass()}>
                <FileText className="w-4 h-4" /> <span className="hidden xl:inline">Ujian</span>
              </Link>
              
              {isAdmin && (
                <Link to="/admin" className={desktopAdminClass()}>
                  <Settings className="w-4 h-4" /> <span className="hidden xl:inline">Admin</span>
                </Link>
              )}
            </div>

            {/* KOLOM KANAN: Tombol Aksi (flex-1 agar seimbang) */}
            <div className="flex-1 flex justify-end items-center gap-1.5">
              
              {/* Aksi Desktop */}
              <div className="hidden lg:flex items-center gap-1.5">
                
                {/* Search cuma ikon, buang tulisan Cari & Ctrl+K */}
                <button 
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-gray-300 dark:hover:border-slate-600"
                  title="Cari (Ctrl+K)"
                >
                  <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                </button>

                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-600">
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                </button>

                {user ? (
                  <div className="flex items-center gap-1.5">
                    {/* Teks Dashboard, Profil, Keluar cuma muncul di layar 2xl (monitor gede) */}
                    <Link to="/dashboard" className={desktopLinkClass('/dashboard')} title="Dashboard">
                      <LayoutDashboard className="w-4 h-4" /> <span className="hidden 2xl:inline">Dashboard</span>
                    </Link>
                    <Link to="/profil" className={desktopLinkClass('/profil')} title="Profil">
                      <User className="w-4 h-4" /> <span className="hidden 2xl:inline">Profil</span>
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-xl font-medium text-sm transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50" title="Keluar">
                      <LogOut className="w-4 h-4" /> <span className="hidden 2xl:inline">Keluar</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:bg-teal-50 dark:hover:bg-teal-900/30 px-4 py-2 rounded-xl transition-colors text-sm">
                      Masuk
                    </Link>
                    <Link to="/register" className="bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-teal-500/30 text-sm">
                      Daftar
                    </Link>
                  </div>
                )}
              </div>

              {/* Tombol Mobile */}
              <div className="lg:hidden flex items-center gap-2">
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
          {/* === END LAYOUT === */}

        </div>

        {/* ================= MENU MOBILE ================= */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-slate-700/60 ${
            isOpen ? 'max-h-[900px] opacity-100 py-4 shadow-xl overflow-y-auto' : 'max-h-0 opacity-0 py-0'
          }`}
        >
          <div className="px-4 space-y-2">
            <MobileLink to="/" icon={Home} label="Beranda" color="teal" isActive={isActive} onClick={() => setIsOpen(false)} />
            <MobileLink to="/materi" icon={BookOpen} label="Materi" color="teal" isActive={isActive} onClick={() => setIsOpen(false)} />
            <MobileLink to="/leaderboard" icon={Trophy} label="Leaderboard" color="amber" isActive={isActive} onClick={() => setIsOpen(false)} />
            <MobileLink to="/rumus" icon={Sparkles} label="Bank Rumus" color="violet" isActive={isActive} onClick={() => setIsOpen(false)} />
            <MobileLink to="/ujian" icon={FileText} label="Ujian" color="red" isActive={isActive} onClick={() => setIsOpen(false)} />
            
            {isAdmin && (
              <MobileLink to="/admin" icon={Settings} label="Admin Panel" color="amber" isActive={isActive} onClick={() => setIsOpen(false)} />
            )}

            <div className="h-px bg-gray-200 dark:bg-slate-700/60 my-3 mx-2"></div>

            {user ? (
              <>
                <MobileLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" color="teal" isActive={isActive} onClick={() => setIsOpen(false)} />
                <MobileLink to="/profil" icon={User} label="Profil" color="teal" isActive={isActive} onClick={() => setIsOpen(false)} />

                <button 
                  onClick={() => { handleLogout(); setIsOpen(false); }} 
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
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center justify-center gap-3 p-3 rounded-2xl border bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Masuk
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center justify-center gap-3 p-3 rounded-2xl border border-transparent bg-gradient-to-r from-teal-500 via-cyan-600 to-teal-600 hover:from-teal-600 hover:to-cyan-700 text-white transition-all duration-200 shadow-lg shadow-teal-500/30 font-medium hover:shadow-teal-500/50"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;
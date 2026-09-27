import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ⚡ Helper: Dapatkan tanggal hari ini (format YYYY-MM-DD)
const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ⚡ Helper: Dapatkan tanggal kemarin
const getYesterdayDate = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
    lastActive: null,
  });

  const register = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      name: name,
      email: email,
      role: 'user',
      level: null,
      grade: null,
      school: '',
      photoURL: '',
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      createdAt: serverTimestamp()
    });

    return newUser;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const newUser = userCredential.user;

    // Cek apakah user sudah ada
    const userRef = doc(db, 'users', newUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: newUser.uid,
        name: newUser.displayName || 'Siswa GhiMath',
        email: newUser.email,
        role: 'user',
        level: null,
        grade: null,
        school: '',
        photoURL: newUser.photoURL || '',
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        createdAt: serverTimestamp()
      });
    }

    return newUser;
  };

  const logout = () => {
    return signOut(auth);
  };

  // ⚡ FUNGSI UPDATE STREAK
  const updateStreak = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return;

      const data = userSnap.data();
      const today = getTodayDate();
      const yesterday = getYesterdayDate();
      const lastActive = data.lastActiveDate || null;
      let currentStreak = data.currentStreak || 0;
      let longestStreak = data.longestStreak || 0;

      // Sudah aktif hari ini → skip
      if (lastActive === today) {
        setStreakData({
          current: currentStreak,
          longest: longestStreak,
          lastActive: lastActive,
        });
        return;
      }

      // Update streak
      if (lastActive === yesterday) {
        // Lanjut streak
        currentStreak += 1;
      } else {
        // Reset streak (atau mulai baru)
        currentStreak = 1;
      }

      // Update longest streak
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Simpan ke Firestore
      await updateDoc(userRef, {
        currentStreak,
        longestStreak,
        lastActiveDate: today,
      });

      setStreakData({
        current: currentStreak,
        longest: longestStreak,
        lastActive: today,
      });

      console.log(`🔥 Streak: ${currentStreak} hari`);
    } catch (error) {
      console.error('Gagal update streak:', error);
    }
  };

  // ⚡ LOAD STREAK saat user login
  const loadStreak = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setStreakData({
          current: data.currentStreak || 0,
          longest: data.longestStreak || 0,
          lastActive: data.lastActiveDate || null,
        });
      }
    } catch (error) {
      console.error('Gagal load streak:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Auto-load streak saat user login
  useEffect(() => {
    if (user) {
      loadStreak();
    }
  }, [user]);

  const value = {
    user,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    streakData,
    updateStreak,
    loadStreak,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
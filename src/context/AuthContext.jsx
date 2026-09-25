import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Membuat Context
const AuthContext = createContext();

// Custom hook untuk mempermudah penggunaan AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi Register
  const register = async (name, email, password) => {
    // 1. Buat user di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Simpan data user ke Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: 'user', // Default role adalah user biasa
      level: null,  // Akan diisi nanti saat onboarding
      grade: null,
      createdAt: serverTimestamp()
    });

    return user;
  };

  // Fungsi Login Email/Password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Fungsi Login Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Cek apakah user sudah ada di Firestore. Jika belum, simpan.
    // (Untuk sederhananya, kita langsung set/timpa dengan data terbaru)
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: user.displayName || 'Siswa GhiMath',
      email: user.email,
      role: 'user',
      level: null,
      grade: null,
      createdAt: serverTimestamp()
    }, { merge: true }); // merge: true agar tidak menimpa data lama jika sudah ada

    return user;
  };

  // Fungsi Logout
  const logout = () => {
    return signOut(auth);
  };

  // Memantau status login user secara real-time
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Nilai yang akan dibagikan ke seluruh aplikasi
  const value = {
    user,
    loading,
    register,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
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

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      name: newUser.displayName || 'Siswa GhiMath',
      email: newUser.email,
      role: 'user',
      level: null,
      grade: null,
      createdAt: serverTimestamp()
    }, { merge: true });

    return newUser;
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Timeout pengaman: kalau 5 detik belum selesai, paksa loading = false
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

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
      {children}
    </AuthContext.Provider>
  );
};
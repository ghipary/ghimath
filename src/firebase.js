import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// KUNCI LANGSUNG (Hardcode sementara)
const firebaseConfig = {
  apiKey: "AIzaSyBUZFXEfjCw56-ArlI4GSUDa5NHDCzZrig",
  authDomain: "ghimath.firebaseapp.com",
  projectId: "ghimath",
  storageBucket: "ghimath.firebasestorage.app",
  messagingSenderId: "828678194030",
  appId: "1:828678194030:web:a93f66531fa2a75187b77f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
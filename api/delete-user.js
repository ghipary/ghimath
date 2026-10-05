m// api/delete-user.js
export const config = {
  runtime: 'nodejs',
};

// api/delete-user.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Inisialisasi Firebase Admin (hanya sekali)
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error.stack);
  }
}

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil token dari header Authorization
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'Tidak ada token akses' });
  }

  try {
    const db = getFirestore();
    const auth = getAuth();

    // 1. Verifikasi token
    const decodedToken = await auth.verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;

    // 2. Cek apakah peminta adalah ADMIN
    const requesterDoc = await db.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists || requesterDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang bisa menghapus akun.' });
    }

    // 3. Ambil UID target
    const { uidToDelete } = req.body;
    if (!uidToDelete) {
      return res.status(400).json({ error: 'UID target tidak ditemukan' });
    }

    // 4. Cegah admin hapus diri sendiri
    if (uidToDelete === requesterUid) {
      return res.status(400).json({ error: 'Kamu tidak bisa menghapus akunmu sendiri.' });
    }

    // 5. Hapus dari Firestore
    await db.collection('users').doc(uidToDelete).delete();

    // 6. Hapus dari Firebase Authentication
    try {
      await auth.deleteUser(uidToDelete);
    } catch (authErr) {
      // Kalau user sudah tidak ada di Auth, lanjut saja
      console.warn('Auth user sudah tidak ada atau gagal dihapus:', authErr.message);
    }

    return res.status(200).json({ message: 'Akun berhasil dihapus permanen' });

  } catch (error) {
    console.error('Error saat menghapus user:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus akun' });
  }
}
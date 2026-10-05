// api/delete-user.js
import admin from 'firebase-admin';

// Inisialisasi Firebase Admin (hanya sekali)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'Tidak ada token akses' });
  }

  try {
    const db = admin.firestore();
    const auth = admin.auth();

    const decodedToken = await auth.verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;

    const requesterDoc = await db.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists || requesterDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang bisa menghapus akun.' });
    }

    const { uidToDelete } = req.body;
    if (!uidToDelete) {
      return res.status(400).json({ error: 'UID target tidak ditemukan' });
    }

    if (uidToDelete === requesterUid) {
      return res.status(400).json({ error: 'Kamu tidak bisa menghapus akunmu sendiri.' });
    }

    await db.collection('users').doc(uidToDelete).delete();

    try {
      await auth.deleteUser(uidToDelete);
    } catch (authErr) {
      console.warn('Auth user gagal dihapus:', authErr.message);
    }

    return res.status(200).json({ message: 'Akun berhasil dihapus permanen' });

  } catch (error) {
    console.error('Error saat menghapus user:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus akun' });
  }
}
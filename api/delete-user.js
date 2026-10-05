// api/delete-user.js
import admin from 'firebase-admin';

// Inisialisasi Firebase Admin (hanya sekali)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel kadang mengubah format newline, ini cara aman memformatnya
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil token dari header Authorization (frontend akan mengirim ini)
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'Tidak ada token akses' });
  }

  try {
    // 1. Verifikasi token: Siapa yang meminta hapus?
    const decodedToken = await auth.verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;

    // 2. Cek apakah peminta adalah ADMIN
    const requesterDoc = await db.collection('users').doc(requesterUid).get();
    if (!requesterDoc.exists || requesterDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang bisa menghapus akun.' });
    }

    // 3. Ambil UID target yang mau dihapus dari body
    const { uidToDelete } = req.body;
    if (!uidToDelete) {
      return res.status(400).json({ error: 'UID target tidak ditemukan' });
    }

    // 4. Jangan biarkan admin menghapus dirinya sendiri
    if (uidToDelete === requesterUid) {
      return res.status(400).json({ error: 'Kamu tidak bisa menghapus akunmu sendiri.' });
    }

    // 5. Hapus dari Firestore
    await db.collection('users').doc(uidToDelete).delete();

    // 6. Hapus dari Firebase Authentication
    await auth.deleteUser(uidToDelete);

    return res.status(200).json({ message: 'Akun berhasil dihapus permanen' });

  } catch (error) {
    console.error('Error saat menghapus user:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghapus akun' });
  }
}
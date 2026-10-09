// Automated Firestore Security Rules test untuk GhiMath.
// Dijalankan di Firebase Emulator (project dummy), TIDAK menyentuh Firestore produksi.
//   npx firebase-tools emulators:exec --only firestore --project demo-rules-test "node --test tests/"
import { describe, it, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-rules-test';
const HOST = '127.0.0.1';
const PORT = 8080;

let testEnv;

const asUser = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: HOST,
      port: PORT,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed data dasar dengan rules dimatikan (bypass).
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'adminUid'), { uid: 'adminUid', role: 'admin', name: 'Admin' });
    await setDoc(doc(db, 'users', 'userA'), { uid: 'userA', role: 'user', name: 'User A' });
    await setDoc(doc(db, 'quizResults', 'res1'), { userId: 'userA', materialId: 'm1', score: 50 });
    await setDoc(doc(db, 'examResults', 'userA_ex1'), { userId: 'userA', examId: 'ex1', score: 50 });
    await setDoc(doc(db, 'progress', 'userA_m1'), { userId: 'userA' });
    await setDoc(doc(db, 'feedback', 'fb1'), { userId: 'userA', message: 'hai' });
  });
});

// ─────────────────────────────────────────────────────────────
describe('Anonim (tanpa login)', () => {
  it('baca users DITOLAK', async () => {
    await assertFails(getDoc(doc(anon(), 'users', 'userA')));
  });
  it('baca materials DIIZINKAN', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'materials', 'm1')));
  });
  it('tulis materials DITOLAK', async () => {
    await assertFails(setDoc(doc(anon(), 'materials', 'mx'), { title: 'x' }));
  });
  it('create users DITOLAK', async () => {
    await assertFails(setDoc(doc(anon(), 'users', 'hacker'), { role: 'user' }));
  });
});

// ─────────────────────────────────────────────────────────────
describe('User login (userA) — users', () => {
  it('create users sendiri dgn role admin → DITOLAK (celah kritis)', async () => {
    await assertFails(setDoc(doc(asUser('newbie'), 'users', 'newbie'), { role: 'admin' }));
  });
  it('create users sendiri dgn role user → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('newbie'), 'users', 'newbie'), { role: 'user', name: 'Baru' }));
  });
  it('update role sendiri jadi admin → DITOLAK', async () => {
    await assertFails(updateDoc(doc(asUser('userA'), 'users', 'userA'), { role: 'admin' }));
  });
  it('update field biasa (name) sendiri → BOLEH', async () => {
    await assertSucceeds(updateDoc(doc(asUser('userA'), 'users', 'userA'), { name: 'Nama Baru' }));
  });
  it('baca users → BOLEH', async () => {
    await assertSucceeds(getDoc(doc(asUser('userA'), 'users', 'adminUid')));
  });
});

// ─────────────────────────────────────────────────────────────
describe('User login (userA) — isolasi data antar user', () => {
  it('create progress utk orang lain → DITOLAK', async () => {
    await assertFails(setDoc(doc(asUser('userA'), 'progress', 'p1'), { userId: 'victim' }));
  });
  it('create progress utk diri sendiri → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('userA'), 'progress', 'p1'), { userId: 'userA' }));
  });
  it('create quizResults utk orang lain → DITOLAK', async () => {
    await assertFails(setDoc(doc(asUser('userA'), 'quizResults', 'r2'), { userId: 'victim', score: 100 }));
  });
  it('create quizResults skor > 100 → DITOLAK', async () => {
    await assertFails(setDoc(doc(asUser('userA'), 'quizResults', 'r3'), { userId: 'userA', score: 150 }));
  });
  it('create quizResults skor valid → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('userA'), 'quizResults', 'r4'), { userId: 'userA', score: 80 }));
  });
  it('update skor kuis sendiri → BOLEH (verifikasi fix bug)', async () => {
    await assertSucceeds(updateDoc(doc(asUser('userA'), 'quizResults', 'res1'), { score: 80 }));
  });
  it('update skor kuis sendiri > 100 → DITOLAK', async () => {
    await assertFails(updateDoc(doc(asUser('userA'), 'quizResults', 'res1'), { score: 200 }));
  });
  it('create examResults utk orang lain → DITOLAK', async () => {
    await assertFails(setDoc(doc(asUser('userA'), 'examResults', 'x2'), { userId: 'victim', score: 90 }));
  });
  it('create examResults sendiri → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('userA'), 'examResults', 'userA_ex2'), { userId: 'userA', score: 90 }));
  });
  it('update examResults sendiri → BOLEH', async () => {
    await assertSucceeds(updateDoc(doc(asUser('userA'), 'examResults', 'userA_ex1'), { score: 70 }));
  });
  it('hapus examResults sendiri → DITOLAK (admin only)', async () => {
    await assertFails(deleteDoc(doc(asUser('userA'), 'examResults', 'userA_ex1')));
  });
});

// ─────────────────────────────────────────────────────────────
describe('User login (userA) — konten & feedback', () => {
  it('tulis materials → DITOLAK', async () => {
    await assertFails(setDoc(doc(asUser('userA'), 'materials', 'm9'), { title: 'x' }));
  });
  it('tulis formulas → DITOLAK', async () => {
    await assertFails(setDoc(doc(asUser('userA'), 'formulas', 'f9'), { title: 'x' }));
  });
  it('baca feedback → DITOLAK', async () => {
    await assertFails(getDoc(doc(asUser('userA'), 'feedback', 'fb1')));
  });
  it('create feedback sendiri → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('userA'), 'feedback', 'fb2'), { userId: 'userA', message: 'mantap' }));
  });
});

// ─────────────────────────────────────────────────────────────
describe('Admin', () => {
  it('baca feedback → BOLEH', async () => {
    await assertSucceeds(getDoc(doc(asUser('adminUid'), 'feedback', 'fb1')));
  });
  it('hapus feedback → BOLEH', async () => {
    await assertSucceeds(deleteDoc(doc(asUser('adminUid'), 'feedback', 'fb1')));
  });
  it('tulis materials → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('adminUid'), 'materials', 'mNew'), { title: 'Materi Baru' }));
  });
  it('tulis formulas → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('adminUid'), 'formulas', 'fNew'), { title: 'Rumus' }));
  });
  it('tulis examPackages → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('adminUid'), 'examPackages', 'eNew'), { title: 'Ujian' }));
  });
  it('tulis quizQuestions → BOLEH', async () => {
    await assertSucceeds(setDoc(doc(asUser('adminUid'), 'quizQuestions', 'qNew'), { question: '1+1?' }));
  });
});

import { createRequire } from 'module';
import { readFileSync, readdirSync } from 'fs';

const require = createRequire(import.meta.url);
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const run = async () => {
  const files = readdirSync('./backups')
    .filter((f) => f.startsWith('materials-backup-'))
    .sort();

  console.log('📂 Backup yang tersedia:\n');
  files.forEach((f, i) => {
    const filePath = './backups/' + f;
    const data = readFileSync(filePath, 'utf-8');
    console.log('   [' + i + '] ' + f + ' (' + (data.length / 1024).toFixed(1) + ' KB)');
  });

  const idx = process.argv[2] ? parseInt(process.argv[2]) : 0;
  const targetFile = files[idx];

  if (!targetFile) {
    console.log('\n❌ File tidak ditemukan');
    console.log('Pakai: node scripts/restore-materials.js [nomor]');
    process.exit(1);
  }

  const targetPath = './backups/' + targetFile;
  console.log('\n⚠️  RESTORE dari: ' + targetFile);
  console.log('   (Ctrl+C kalau salah file!)');
  await new Promise((r) => setTimeout(r, 3000));

  const data = JSON.parse(readFileSync(targetPath, 'utf-8'));
  console.log('\n📚 Total: ' + data.length + ' materi\n');
  console.log('🚀 Mulai restore...\n');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const mat = data[i];
    const id = mat.id;
    const rest = { ...mat };
    delete rest.id;

    try {
      await db.collection('materials').doc(id).set(rest, { merge: false });
      success++;
      process.stdout.write('\r   ✅ ' + (i + 1) + '/' + data.length);
    } catch (err) {
      failed++;
      console.log('\n   ❌ Gagal ' + id + ': ' + err.message);
    }
  }

  console.log('\n\n🎉 RESTORE SELESAI!');
  console.log('   ✅ Sukses: ' + success);
  console.log('   ❌ Gagal: ' + failed + '\n');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
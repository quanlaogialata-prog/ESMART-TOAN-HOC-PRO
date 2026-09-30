import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { repairVietnameseDocument } from './src/lib/vietnameseFont';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, config.firestoreDatabaseId);

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@toanhoc.pro', 'admin123456');
  console.log('Authenticated as admin@toanhoc.pro');

  const snap = await getDocs(collection(db, 'lessons'));
  console.log('Total lessons to update:', snap.size);

  for (const d of snap.docs) {
    const data = d.data();
    const oldKnowledge = data.knowledge || '';
    const oldTitle = data.title || '';

    const newKnowledge = repairVietnameseDocument(oldKnowledge);
    const newTitle = repairVietnameseDocument(oldTitle);

    if (newKnowledge !== oldKnowledge || newTitle !== oldTitle) {
      console.log(`Updating lesson [${d.id}]: ${oldTitle} -> ${newTitle}`);
      await updateDoc(doc(db, 'lessons', d.id), {
        title: newTitle,
        knowledge: newKnowledge,
        updatedAt: new Date().toISOString()
      });
      console.log(` -> Updated successfully!`);
    } else {
      console.log(`Lesson [${d.id}] is already clean.`);
    }
  }

  console.log('All Firestore lessons successfully checked and updated!');
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Update failed:', e);
  process.exit(1);
});

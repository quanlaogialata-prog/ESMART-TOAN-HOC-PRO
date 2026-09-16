import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
const config = JSON.parse(configStr);
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'), limit(5));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Submission ID: ${doc.id}`);
    data.feedback?.forEach((f, i) => {
      console.log(`  Q${i}: hasFile=${f.hasFile}, fileDataUrl length=${f.fileDataUrl ? f.fileDataUrl.length : 'undefined'}`);
    });
  });
}
check().then(() => process.exit(0)).catch(console.error);

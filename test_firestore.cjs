const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const q = query(collection(db, 'topics'), where('grade', '==', 9));
  const snap = await getDocs(q);
  console.log("Topics with grade 9:", snap.docs.length);
}
test().catch(console.error).then(() => process.exit(0));

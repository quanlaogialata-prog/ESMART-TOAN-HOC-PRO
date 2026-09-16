const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, doc } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function main() {
  const topicsSnap = await getDocs(query(collection(db, 'topics'), where('grade', '==', 9)));
  console.log('Found topics with grade 9:', topicsSnap.docs.length);
  topicsSnap.docs.forEach(d => console.log(d.id, d.data().name));
}
main().catch(console.error).then(() => process.exit(0));

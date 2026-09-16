const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function main() {
  const topicsSnap = await getDocs(query(collection(db, 'topics'), limit(2)));
  topicsSnap.docs.forEach(d => console.log(d.id, d.data(), 'type of grade:', typeof d.data().grade));
}
main().catch(console.error).then(() => process.exit(0));

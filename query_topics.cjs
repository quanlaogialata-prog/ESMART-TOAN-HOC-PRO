const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
async function main() {
  const t = await getDocs(collection(db, 'topics'));
  console.log('Total topics:', t.docs.length);
}
main().catch(() => {}).then(() => process.exit(0));

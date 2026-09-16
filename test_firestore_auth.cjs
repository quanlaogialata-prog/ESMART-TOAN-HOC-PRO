const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function main() {
  try {
    const snap = await getDocs(collection(db, 'topics'));
    console.log('Unauthenticated access:', snap.docs.length);
  } catch (e) {
    console.error('Unauthenticated error:', e.code);
  }
}
main().catch(console.error).then(() => process.exit(0));

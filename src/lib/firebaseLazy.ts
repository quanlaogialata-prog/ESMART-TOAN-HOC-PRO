import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };

export const db: any = { __lazyDb: true };

let firestoreBundlePromise: Promise<{
  fs: typeof import('firebase/firestore');
  realDb: import('firebase/firestore').Firestore;
}> | null = null;

function ensureFirestore() {
  if (!firestoreBundlePromise) {
    firestoreBundlePromise = Promise.all([
      import('firebase/firestore'),
      import('./firebase'),
    ]).then(([fs, fb]) => ({
      fs,
      realDb: fb.db,
    }));
  }
  return firestoreBundlePromise;
}

let authBundlePromise: Promise<{
  appMod: typeof import('firebase/app');
  authMod: typeof import('firebase/auth');
}> | null = null;

function ensureAuthAndApp() {
  if (!authBundlePromise) {
    authBundlePromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ]).then(([appMod, authMod]) => ({ appMod, authMod }));
  }
  return authBundlePromise;
}

function resolveRef(fs: typeof import('firebase/firestore'), realDb: any, ref: any): any {
  if (!ref || typeof ref !== 'object') return ref;
  if (ref.__lazyDb) return realDb;
  if (ref.__type === 'collection') {
    const targetDb = ref.target?.__lazyDb ? realDb : resolveRef(fs, realDb, ref.target);
    return fs.collection(targetDb, ref.path, ...(ref.segments || []));
  }
  if (ref.__type === 'doc') {
    const targetDb = ref.target?.__lazyDb ? realDb : resolveRef(fs, realDb, ref.target);
    return fs.doc(targetDb, ref.path, ...(ref.segments || []));
  }
  if (ref.__type === 'where') {
    return fs.where(ref.field, ref.op, ref.value);
  }
  if (ref.__type === 'query') {
    const base = resolveRef(fs, realDb, ref.colOrQuery);
    const constraints = (ref.constraints || []).map((c: any) => resolveRef(fs, realDb, c));
    return fs.query(base, ...constraints);
  }
  return ref;
}

export function collection(target: any, path: string, ...segments: string[]): any {
  return { __type: 'collection', target, path, segments };
}

export function doc(target: any, path: string, ...segments: string[]): any {
  return { __type: 'doc', target, path, segments };
}

export function where(field: string, op: any, value: any): any {
  return { __type: 'where', field, op, value };
}

export function query(colOrQuery: any, ...constraints: any[]): any {
  return { __type: 'query', colOrQuery, constraints };
}

export async function getDocs(q: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  return fs.getDocs(resolveRef(fs, realDb, q));
}

export async function getDocsFromCache(q: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  return fs.getDocsFromCache(resolveRef(fs, realDb, q));
}

export async function getDoc(d: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  return fs.getDoc(resolveRef(fs, realDb, d));
}

export async function addDoc(col: any, data: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  return fs.addDoc(resolveRef(fs, realDb, col), data);
}

export async function setDoc(d: any, data: any, options?: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  const ref = resolveRef(fs, realDb, d);
  return options !== undefined ? fs.setDoc(ref, data, options) : fs.setDoc(ref, data);
}

export async function updateDoc(d: any, data: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  return fs.updateDoc(resolveRef(fs, realDb, d), data);
}

export async function deleteDoc(d: any): Promise<any> {
  const { fs, realDb } = await ensureFirestore();
  return fs.deleteDoc(resolveRef(fs, realDb, d));
}

export function initializeApp(config: any, name?: string): any {
  const realAppPromise = ensureAuthAndApp().then(({ appMod }) =>
    name ? appMod.initializeApp(config, name) : appMod.initializeApp(config)
  );
  return { __lazyApp: true, realAppPromise };
}

export function getApp(name?: string): any {
  const realAppPromise = ensureAuthAndApp().then(({ appMod }) =>
    name ? appMod.getApp(name) : appMod.getApp()
  );
  return { __lazyApp: true, realAppPromise };
}

export async function deleteApp(app: any): Promise<void> {
  const { appMod } = await ensureAuthAndApp();
  const realApp = app?.__lazyApp ? await app.realAppPromise : app;
  return appMod.deleteApp(realApp);
}

export function getAuth(app?: any): any {
  const realAuthPromise = ensureAuthAndApp().then(async ({ authMod }) => {
    const realApp = app?.__lazyApp ? await app.realAppPromise : app;
    return realApp ? authMod.getAuth(realApp) : authMod.getAuth();
  });
  return { __lazyAuth: true, realAuthPromise };
}

export async function createUserWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any> {
  const { authMod } = await ensureAuthAndApp();
  const realAuth = auth?.__lazyAuth ? await auth.realAuthPromise : auth;
  return authMod.createUserWithEmailAndPassword(realAuth, email, pass);
}

export async function signInWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any> {
  const { authMod } = await ensureAuthAndApp();
  const realAuth = auth?.__lazyAuth ? await auth.realAuthPromise : auth;
  return authMod.signInWithEmailAndPassword(realAuth, email, pass);
}

export async function signOut(auth: any): Promise<void> {
  const { authMod } = await ensureAuthAndApp();
  const realAuth = auth?.__lazyAuth ? await auth.realAuthPromise : auth;
  return authMod.signOut(realAuth);
}

export async function updatePassword(user: any, newPass: string): Promise<void> {
  const { authMod } = await ensureAuthAndApp();
  return authMod.updatePassword(user, newPass);
}

export async function deleteUser(user: any): Promise<void> {
  const { authMod } = await ensureAuthAndApp();
  return authMod.deleteUser(user);
}

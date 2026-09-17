import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const targetOld = `      secondApp = initializeApp(firebaseConfig, 'SecondaryAppDel' + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
      await deleteUser(cred.user);
      await deleteDoc(doc(db, 'users', u.id));
      await loadData();`;

const replacementNew = `      secondApp = initializeApp(firebaseConfig, 'SecondaryAppDel' + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
      await deleteUser(cred.user);
      await deleteDoc(doc(db, 'users', u.id));

      if (u.role === 'student') {
        const qStats = query(collection(db, 'student_stats'), where('studentId', '==', u.id));
        const snapStats = await getDocs(qStats);
        snapStats.forEach(d => deleteDoc(d.ref));
        
        const qSubs = query(collection(db, 'submissions'), where('studentId', '==', u.id));
        const snapSubs = await getDocs(qSubs);
        snapSubs.forEach(d => deleteDoc(d.ref));
      }

      await loadData();`;

content = content.replace(targetOld, replacementNew);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

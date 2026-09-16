import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

code = code.replace(
  "import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';",
  "import { collection, getDocs, getDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';"
);

const oldUseEffect = `  useEffect(() => {
    loadData();
  }, []);`;

const newUseEffect = `  useEffect(() => {
    if (user) {
      loadData();

      const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubscribeSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
        setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubscribeAssignments();
        unsubscribeSubmissions();
      };
    }
  }, [user]);`;

code = code.replace(oldUseEffect, newUseEffect);

const assignmentsFetch = `
      const asmSnap = await getDocs(collection(db, 'assignments'));
      let asmData = asmSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setAssignments(asmData);`;

const submissionsFetch = `
      const subSnap = await getDocs(collection(db, 'submissions'));
      setSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));`;

code = code.replace(assignmentsFetch, "");
code = code.replace(submissionsFetch, "");

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
console.log("Fixed gradebook");

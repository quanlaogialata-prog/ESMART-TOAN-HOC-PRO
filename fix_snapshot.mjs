import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

const target = `      const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
        setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });`;

const replacement = `      const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
        const asmMap: any = {};
        snap.docs.forEach(d => asmMap[d.id] = d.data());
        setAssignments(asmMap);
      });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
  console.log("Fixed onSnapshot");
} else {
  console.log("Could not find target");
}

import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

code = code.replace("let clsData = clsSnap.docs.map(d => ({ id: d.id, ...d.data() }));", "let clsData = clsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));");
code = code.replace("let stuData = stuSnap.docs.map(d => ({ id: d.id, ...d.data() }));", "let stuData = stuSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));");

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
console.log('Fixed any types');

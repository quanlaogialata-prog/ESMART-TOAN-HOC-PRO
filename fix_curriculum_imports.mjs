import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf8');
content = content.replace(
  "import { collection, getDocs, addDoc, updateDoc, query, where, deleteDoc, doc } from 'firebase/firestore';",
  "import { collection, getDocs, addDoc, updateDoc, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';"
);
fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);

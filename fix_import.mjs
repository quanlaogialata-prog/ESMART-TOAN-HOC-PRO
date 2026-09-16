import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

content = content.replace(/import \{ collection, query, getDocs, addDoc, where, deleteDoc, doc, updateDoc \} from 'firebase\/firestore';/, "import { collection, query, getDocs, addDoc, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';");

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

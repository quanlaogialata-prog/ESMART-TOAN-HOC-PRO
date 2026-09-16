import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
content = content.replace(/question: q\.question,/g, 'question: q.question || "",');
fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("Patched question");

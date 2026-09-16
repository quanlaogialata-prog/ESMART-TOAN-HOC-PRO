import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
content = content.replace(/explanation: q\.explanation\n/g, 'explanation: q.explanation || ""\n');
fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("Patched undefined explanation");

import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
content = content.replace(/studentId: user\?\.uid,/g, 'studentId: user?.uid || "",');
content = content.replace(/studentEmail: user\?\.email,/g, 'studentEmail: user?.email || "",');
fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("Patched submission data");

import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

content = content.replace('const img = new Image();', 'const img = new window.Image();');

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('patched Image');

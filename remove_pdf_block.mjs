import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const regex = /          \{test\.fileUrl && test\.fileUrl\.startsWith\('data:application\/pdf'\) && \([\s\S]*?          \)\}/;

content = content.replace(regex, '');

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('done');

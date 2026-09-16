import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex = /              \{\(previewTest\.type === 'essay' \|\| previewTest\.type === 'mixed'\) && previewTest\.fileUrl && previewTest\.fileUrl\.startsWith\('data:application\/pdf'\) && \([\s\S]*?              \)\}/;

content = content.replace(regex, '');

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log('done');

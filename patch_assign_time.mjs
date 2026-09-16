import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

content = content.replace(/type="date"/g, 'type="datetime-local"');

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Patched datetime");

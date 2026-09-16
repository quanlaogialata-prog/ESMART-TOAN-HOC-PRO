import fs from 'fs';
let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

const oldFilter = `if (assignData.className && className && assignData.className !== className) continue;`;
const newFilter = `if (assignData.className !== className) continue;`;
content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched filter");

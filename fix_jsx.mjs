import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
content = content.replace(/          \)\}\n\n            <\/div>\n          \)\}/, '          )}\n');
fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('done');

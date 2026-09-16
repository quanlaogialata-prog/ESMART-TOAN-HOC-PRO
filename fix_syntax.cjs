const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf-8');
content = content.replace(/<\/div>\s*<\/div>\s*<\/>\s*\);\s*\}/, '');
fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);

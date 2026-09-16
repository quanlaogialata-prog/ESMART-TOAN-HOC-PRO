const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf-8');
content = content.replace(/const deleteTopic = async \([\s\S]*?\};\n\n/, '');
fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);

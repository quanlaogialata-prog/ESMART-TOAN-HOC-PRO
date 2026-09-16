import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
const lines = content.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    if (lines[i].trim() === '}  );' && lines[i+1] === '}') {
        newLines.push('}');
        break;
    }
}
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', newLines.join('\n'));
console.log("Fixed EOF");

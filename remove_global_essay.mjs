import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

// 1. Remove states
content = content.replace(/  const \[globalEssayAnswer, setGlobalEssayAnswer\] = useState\(''\);\n/g, '');
content = content.replace(/  const \[globalEssayFile, setGlobalEssayFile\] = useState<File \| null>\(null\);\n/g, '');

// 2. Remove grading logic
const gradingRegex = /    \/\/ Add points for global essay if applicable \(outside the loop!\)[\s\S]*?       \}\);\n    \}/;
content = content.replace(gradingRegex, '');

// 3. Remove UI block
const uiRegex = /          \{\(test\.type === 'essay' \|\| test\.type === 'mixed'\) && \(test\.fileUrl \|\| test\.fileName\) && \([\s\S]*?          \)\}/g;
content = content.replace(uiRegex, '');

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('done');

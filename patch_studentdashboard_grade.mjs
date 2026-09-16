import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

const regex = /const q = query\(collection\(db, 'assignments'\), where\('grade', '==', grade\)\);\n\s*const snap = await getDocs\(q\);/;
const replacement = `const snap = await getDocs(collection(db, 'assignments'));`;
content = content.replace(regex, replacement);

const filterRegex = /\/\/ Filter by class if assigned\n\s*if \(assignData\.className && className && assignData\.className !== className\) \{\n\s*continue;\n\s*\}/;
const filterReplacement = `// Filter by grade and class
      if (Number(assignData.grade) !== Number(grade)) continue;
      if (assignData.className && className && assignData.className !== className) continue;`;
content = content.replace(filterRegex, filterReplacement);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched grade filter");

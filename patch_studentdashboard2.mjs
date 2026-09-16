import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

const regexUserDoc = /let grade = 9;\n    if \(!userDoc\.empty && userDoc\.docs\[0\]\.data\(\)\.grade\) \{\n      grade = Number\(userDoc\.docs\[0\]\.data\(\)\.grade\) \|\| 9;\n    \}\n    setUserGrade\(grade\);/;
const replaceUserDoc = `let grade = 9;
    let className = '';
    if (!userDoc.empty) {
      const uData = userDoc.docs[0].data();
      if (uData.grade) grade = Number(uData.grade) || 9;
      if (uData.className) className = uData.className;
    }
    setUserGrade(grade);`;

content = content.replace(regexUserDoc, replaceUserDoc);

const regexFilter = /for \(const d of snap\.docs\) \{/g;
const replaceFilter = `for (const d of snap.docs) {
      const assignData = d.data();
      // Filter by class if assigned
      if (assignData.className && className && assignData.className !== className) {
        continue;
      }`;
content = content.replace(regexFilter, replaceFilter);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched StudentDashboard filtering");

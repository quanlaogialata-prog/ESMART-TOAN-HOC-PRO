import fs from 'fs';
let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

const regex = /const assignData = d\.data\(\);\n\s*\/\/ Filter by class if assigned\n\s*if \(assignData\.className && className && assignData\.className !== className\) \{\n\s*continue;\n\s*\}\n\s*const assignData = d\.data\(\);/g;

content = content.replace(regex, `const assignData = d.data();
      // Filter by class if assigned
      if (assignData.className && className && assignData.className !== className) {
        continue;
      }`);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Fixed redeclaration");

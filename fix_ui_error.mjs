import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

// Fix the typo in the header component
content = content.replace(/\{a\.isSubmitted \? 'Đã nộp bài: ' : 'Hạn nộp: '\} \{dateKey\}/, "{dateKey}");

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Fixed UI syntax error");

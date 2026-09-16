import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

content = content.replace(/\{\(dateStr\) =>/g, "{((dateStr) =>");
content = content.replace(/\}\(a\.assignedDate/g, "})(a.assignedDate");
content = content.replace(/\}\(a\.submittedAt\)/g, "})(a.submittedAt)");

content = content.replace(/\{\(seconds\) =>/g, "{((seconds) =>");
content = content.replace(/\}\(a\.timeSpent\)/g, "})(a.timeSpent)");

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Fixed IIFE");

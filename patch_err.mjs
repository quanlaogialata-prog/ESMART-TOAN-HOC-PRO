import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

content = content.replace("qFeedback = 'Lỗi kết nối AI khi chấm bài.';", "qFeedback = 'Lỗi kết nối AI: ' + (e.message || e);");

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('patched');

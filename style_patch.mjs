import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

// Target the specific span generating "GV: Hệ thống" inside the "Đề mặc định" section.
// To precisely target it, we need to match the JSX structure around it.
// Original:
// <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
//    t.type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
// }`}>
//   GV: {t.createdBy || 'Hệ thống'}
// </span>

const originalSpan = "GV: {t.createdBy || 'Hệ thống'}";
const newSpan = "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}";

content = content.replace(originalSpan, newSpan);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Reverted 'Hệ thống' text in default tests section to test type label");

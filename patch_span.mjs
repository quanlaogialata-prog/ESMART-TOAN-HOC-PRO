import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

code = code.replace(
  "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}",
  "GV: {t.createdBy || 'Hệ thống'}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched span");

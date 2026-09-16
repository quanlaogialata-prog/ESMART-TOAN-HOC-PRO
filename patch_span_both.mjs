import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

code = code.replace(
  "GV: {t.createdBy || 'Giáo viên'}",
  "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'} - GV: {t.createdBy || 'Giáo viên'}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched to include both type and creator");

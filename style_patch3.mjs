import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// Replace just the specific line with exactly what we had before (the correct one)
code = code.replace(
  /GV: \{t\.createdBy \|\| 'Tên giáo viên'\}/g,
  "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'} - GV: {t.createdBy || 'Giáo viên'}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched to include both type and creator");

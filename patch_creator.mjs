import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// Update creation logic to save createdBy
code = code.replace(
  "testData.createdAt = new Date().toISOString();",
  "testData.createdAt = new Date().toISOString();\n        testData.createdBy = user?.displayName || user?.email || 'Giáo viên';"
);

// Update display in custom tests section
code = code.replace(
  "{t.type === 'mcq' ? 'Trắc nghiệm (Tự động)' : 'Tự luận (Tải lên)'}",
  "GV: {t.createdBy || 'Giáo viên'}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched creator name");

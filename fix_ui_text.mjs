import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

content = content.replace(
  "Xuất bảng điểm lớp {a.className}",
  "Xuất PDF bảng điểm lớp {a.className}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

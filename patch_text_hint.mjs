import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

content = content.replace(
  "Mật khẩu mặc định: tên viết liền không dấu + 123456 (VD: nguyenvana123456)",
  "Mật khẩu mặc định: Tên viết liền không dấu + 123456 (VD: NguyenVanA123456)"
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

content = content.replace(
  '<p className="text-xs text-gray-500 mt-1">Email và mật khẩu sẽ được tạo tự động</p>',
  '<p className="text-xs text-gray-500 mt-1">Mật khẩu mặc định: tên viết liền không dấu + 123456 (VD: nguyenvana123456)</p>'
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

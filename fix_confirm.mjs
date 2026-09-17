import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

content = content.replace(
  "if (!window.confirm('Bạn có chắc chắn muốn cập nhật mật khẩu của TẤT CẢ người dùng về định dạng mới không? Điều này sẽ tự động đăng nhập vào từng tài khoản để đổi mật khẩu.')) return;",
  ""
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
console.log('Removed window.confirm');

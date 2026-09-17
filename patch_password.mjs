import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const targetOld = `      const email = \`\${finalSafeName}@toanhoc.pro\`;
      const generatedPassword = \`\${finalSafeName}123456\`;`;

// Sửa lại mật khẩu theo đúng định dạng "TênKhôngDấu123456" thay vì tên viết liền và chữ thường hết.
// Tên: "Nguyễn Văn A" -> NguyenVanA123456 (nếu bạn muốn thế này, hoặc nguyen.van.a123456)
// Dựa vào yêu cầu: "tên (không dấu) và dãy số 123456" 
const replacementNew = `      const email = \`\${finalSafeName}@toanhoc.pro\`;
      // Convert "Nguyễn Văn An" -> "NguyenVanAn" for password
      const nameNoSpaceNoTones = newFullName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\\s+/g, '');
      const generatedPassword = \`\${nameNoSpaceNoTones}123456\`;`;

content = content.replace(targetOld, replacementNew);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

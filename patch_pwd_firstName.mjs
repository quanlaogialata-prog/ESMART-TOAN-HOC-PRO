import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// 1. Single User Creation
const singleTarget = `      // Convert "Nguyễn Văn An" -> "NguyenVanAn" for password
      const nameNoSpaceNoTones = newFullName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\\s+/g, '');
      const generatedPassword = \`\${nameNoSpaceNoTones}123456\`;`;

const singleReplacement = `      // Convert "Nguyễn Văn Tuấn" -> "tuan" for password
      const nameParts = newFullName.trim().split(/\\s+/);
      const firstName = nameParts[nameParts.length - 1] || 'user';
      const firstNameNoTones = firstName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
      const generatedPassword = \`\${firstNameNoTones}123456\`;`;

content = content.replace(singleTarget, singleReplacement);

// 2. Import Batch Creation
const importTarget = `        // Convert "Nguyễn Văn An" -> "NguyenVanAn" for password
        const nameNoSpaceNoTones = cleanName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\\s+/g, '');
        const password = \`\${nameNoSpaceNoTones}123456\`;`;

const importReplacement = `        // Convert "Nguyễn Văn Tuấn" -> "tuan" for password
        const nameParts = cleanName.trim().split(/\\s+/);
        const firstName = nameParts[nameParts.length - 1] || 'user';
        const firstNameNoTones = firstName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        const password = \`\${firstNameNoTones}123456\`;`;

content = content.replace(importTarget, importReplacement);

// 3. UI Hint
const hintTarget = "Mật khẩu mặc định: Tên viết liền không dấu + 123456 (VD: NguyenVanA123456)";
const hintReplacement = "Mật khẩu mặc định: Tên (chữ thường, không dấu) + 123456 (VD: tuan123456)";

content = content.replace(hintTarget, hintReplacement);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
console.log('Password generation logic updated');

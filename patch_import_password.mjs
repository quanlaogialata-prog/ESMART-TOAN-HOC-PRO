import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const targetOld = `        const password = \`\${finalSafeName}123456\`;`;
const replacementNew = `        // Convert "Nguyễn Văn An" -> "NguyenVanAn" for password
        const nameNoSpaceNoTones = cleanName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\\s+/g, '');
        const password = \`\${nameNoSpaceNoTones}123456\`;`;

if (content.includes(targetOld)) {
  content = content.replace(targetOld, replacementNew);
  fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
  console.log('Fixed import password format successfully');
} else {
  console.log('Could not find password line in import function');
}

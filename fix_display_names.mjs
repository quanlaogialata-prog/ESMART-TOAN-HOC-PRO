import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

content = content.replace(
  `        const userData = {
          role: 'student',
          email: email,
          fullName: cleanName,
          displayName: email,`,
  `        const userData = {
          role: 'student',
          email: email,
          fullName: cleanName,
          displayName: cleanName,`
);

content = content.replace(
  `      const userData: any = {
        role: newRole,
        fullName: newFullName,
        email: email,
        displayName: email,`,
  `      const userData: any = {
        role: newRole,
        fullName: newFullName,
        email: email,
        displayName: newFullName,`
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

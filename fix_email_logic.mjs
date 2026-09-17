import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// Revert handleImportStudents
content = content.replace(
  "const generatedEmail = `${finalSafeName}@toanhoc.pro`;\n      const email = (newRole === 'teacher' && newEmail.trim()) ? newEmail.trim() : generatedEmail;",
  "const email = `${finalSafeName}@toanhoc.pro`;"
);

// Apply to handleCreateUser
content = content.replace(
  "      const email = `${finalSafeName}@toanhoc.pro`;\n      // Convert",
  "      const generatedEmail = `${finalSafeName}@toanhoc.pro`;\n      const email = (newRole === 'teacher' && newEmail.trim()) ? newEmail.trim() : generatedEmail;\n      // Convert"
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

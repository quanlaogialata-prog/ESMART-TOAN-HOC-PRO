import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// Update Import logic
content = content.replace(
  /const randomStr = Math\.random\(\)\.toString\(36\)\.substring\(2, 6\);\n\s*const email = `\$\{safeName\}\$\{randomStr\}@toanhoc\.pro`;\n\s*const password = Math\.random\(\)\.toString\(36\)\.substring\(2, 8\);/g,
  "const email = `${safeName}@toanhoc.pro`;\n        const password = `${safeName}123456`;"
);

content = content.replace(
  /displayName: cleanName,/g,
  "fullName: cleanName,\n          displayName: email,"
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

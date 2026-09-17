import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// The string to replace
const orphanedRegex = /                          <div className="pt-4 flex gap-3 justify-end">[\s\S]*?      \}\)/;
content = content.replace(orphanedRegex, "");

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

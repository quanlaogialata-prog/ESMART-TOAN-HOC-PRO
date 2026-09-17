import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const modalStart = content.indexOf('{/* Delete Data Modal */}');
if (modalStart !== -1) {
  // Let's find the closing brace. It's probably the end of the modal before the end of the return
  // I will just use regex or find it.
  const regex = /\{\/\* Delete Data Modal \*\/\}[\s\S]*?\}\)\}/;
  content = content.replace(regex, "");
}
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

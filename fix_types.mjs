import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

content = content.replace(
  "const fetchedClasses = clsSnap.docs.map(d => ({ id: d.id, ...d.data() }));",
  "const fetchedClasses = clsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));"
);

content = content.replace(
  "fetchedClasses.sort((a, b) => {",
  "fetchedClasses.sort((a: any, b: any) => {"
);

content = content.replace(
  "const filteredUsers = users.filter(u => u.role === activeTab).sort((a, b) => {",
  "const filteredUsers = users.filter(u => u.role === activeTab).sort((a: any, b: any) => {"
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

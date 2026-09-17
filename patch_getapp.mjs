import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');
content = content.replace(
  "import { initializeApp, deleteApp } from 'firebase/app';",
  "import { initializeApp, deleteApp, getApp } from 'firebase/app';"
);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

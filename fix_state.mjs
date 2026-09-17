import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');
content = content.replace(
  "const [newFullName, setNewFullName] = useState('');",
  "const [newFullName, setNewFullName] = useState('');\n  const [newEmail, setNewEmail] = useState('');"
);
content = content.replace(
  "setNewFullName('');",
  "setNewFullName('');\n      setNewEmail('');"
);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

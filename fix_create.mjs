import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

content = content.replace(
  "const [newUsername, setNewUsername] = useState('');\n  const [newPassword, setNewPassword] = useState('');",
  "const [newFullName, setNewFullName] = useState('');\n  // Removed newUsername and newPassword"
);

const oldHandleCreate = `  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) { setSysError('Vui lòng nhập tài khoản và mật khẩu'); setTimeout(()=>setSysError(''),3000); return; }
    if (newPassword.length < 6) { setSysError('Mật khẩu phải có ít nhất 6 ký tự'); setTimeout(()=>setSysError(''),4000); return; }
    
    setCreatingUser(true);
    let secondApp: any = null;
    try {
      // Use secondary app to prevent signing out the current admin
      secondApp = initializeApp(firebaseConfig, 'SecondaryApp' + Date.now());
      const secondAuth = getAuth(secondApp);
      const safeUsername = newUsername.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = \`\${safeUsername}@toanhoc.pro\`;
      
      const cred = await createUserWithEmailAndPassword(secondAuth, email, newPassword);
      
      const userData: any = {
        role: newRole,
        email: email,
        displayName: newUsername,
        rawPassword: newPassword, // Store password so admin can view/edit it later
        createdAt: new Date().toISOString()
      };`;

const newHandleCreate = `  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName) { setSysError('Vui lòng nhập họ và tên'); setTimeout(()=>setSysError(''),3000); return; }
    
    setCreatingUser(true);
    let secondApp: any = null;
    try {
      // Use secondary app to prevent signing out the current admin
      secondApp = initializeApp(firebaseConfig, 'SecondaryApp' + Date.now());
      const secondAuth = getAuth(secondApp);
      const safeUsername = newFullName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = \`\${safeUsername}@toanhoc.pro\`;
      const generatedPassword = \`\${safeUsername}123456\`;
      
      const cred = await createUserWithEmailAndPassword(secondAuth, email, generatedPassword);
      
      const userData: any = {
        role: newRole,
        fullName: newFullName,
        email: email,
        displayName: email,
        rawPassword: generatedPassword,
        createdAt: new Date().toISOString()
      };`;

content = content.replace(oldHandleCreate, newHandleCreate);

// Then clean up the reset state
content = content.replace(
  "setNewUsername('');\n      setNewPassword('');",
  "setNewFullName('');"
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

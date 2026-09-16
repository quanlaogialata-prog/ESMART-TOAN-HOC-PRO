import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// Fix handleDeleteUser to use userToDelete state instead of window.confirm
const oldHandleDeleteUser = `  const handleDeleteUser = async (u: any) => {
    if (!u.rawPassword) {
      setSysError('Không thể xóa tài khoản vì thiếu mật khẩu gốc (cần để xác thực lại).');
      setTimeout(() => setSysError(''), 4000);
      return;
    }
    if (!window.confirm(\`Bạn có chắc chắn muốn xóa tài khoản \${u.displayName}?\`)) return;
    
    setSysMsg('Đang xóa tài khoản...');`;

const newHandleDeleteUser = `  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const handleDeleteUser = async (u: any) => {
    if (!u.rawPassword) {
      setSysError('Không thể xóa tài khoản vì thiếu mật khẩu gốc (cần để xác thực lại).');
      setTimeout(() => setSysError(''), 4000);
      return;
    }
    
    if (userToDelete !== u.id) {
      setUserToDelete(u.id);
      setTimeout(() => setUserToDelete(null), 3000);
      return;
    }
    
    setUserToDelete(null);
    setSysMsg('Đang xóa tài khoản...');`;

content = content.replace(oldHandleDeleteUser, newHandleDeleteUser);

// Fix the delete button for users to show the confirm state
content = content.replace(
  /<button onClick=\{\(\) => handleDeleteUser\(u\)\} className="text-xs px-2 py-1 rounded border bg-red-50 border-red-200 text-red-700">Xóa<\/button>/g,
  `<button onClick={() => handleDeleteUser(u)} className={\`text-xs px-2 py-1 rounded border \${userToDelete === u.id ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 border-red-200 text-red-700'}\`}>{userToDelete === u.id ? 'Xác nhận xóa' : 'Xóa'}</button>`
);

// Fix the delete button for classes to show the confirm state
content = content.replace(
  /<button onClick=\{\(\) => handleDeleteClass\(cls\.id\)\} className="text-red-500 text-xs px-2 py-1 rounded border border-red-200 bg-red-50">Xóa<\/button>/g,
  `<button onClick={() => handleDeleteClass(cls.id)} className={\`text-xs px-2 py-1 rounded border \${classToDelete === cls.id ? 'bg-red-600 text-white border-red-600' : 'text-red-500 border-red-200 bg-red-50'}\`}>{classToDelete === cls.id ? 'Xác nhận xóa' : 'Xóa'}</button>`
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

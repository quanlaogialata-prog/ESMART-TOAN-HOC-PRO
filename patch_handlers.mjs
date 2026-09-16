import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const handlers = `
  const [editingUserPass, setEditingUserPass] = useState<any>(null);
  const [newPass, setNewPass] = useState('');
  
  const handleUpdatePassword = async () => {
    if (!newPass || newPass.length < 6) {
      setSysError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    setSysMsg('Đang cập nhật mật khẩu...');
    setSysError('');
    let secondApp: any = null;
    try {
      secondApp = initializeApp(firebaseConfig, 'SecondaryAppPass' + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, editingUserPass.email, editingUserPass.rawPassword);
      await updatePassword(cred.user, newPass);
      await updateDoc(doc(db, 'users', editingUserPass.id), { rawPassword: newPass });
      await signOut(secondAuth);
      await loadData();
      setSysMsg('Cập nhật mật khẩu thành công.');
      setEditingUserPass(null);
      setNewPass('');
      setTimeout(() => setSysMsg(''), 3000);
    } catch (e: any) {
      console.error(e);
      setSysError('Lỗi đổi mật khẩu: ' + e.message);
    } finally {
      if (secondApp) deleteApp(secondApp);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!u.rawPassword) {
      setSysError('Không thể xóa tài khoản vì thiếu mật khẩu gốc (cần để xác thực lại).');
      setTimeout(() => setSysError(''), 4000);
      return;
    }
    if (!window.confirm(\`Bạn có chắc chắn muốn xóa tài khoản \${u.displayName}?\`)) return;
    
    setSysMsg('Đang xóa tài khoản...');
    setSysError('');
    let secondApp: any = null;
    try {
      secondApp = initializeApp(firebaseConfig, 'SecondaryAppDel' + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
      await deleteUser(cred.user);
      await deleteDoc(doc(db, 'users', u.id));
      await loadData();
      setSysMsg('Đã xóa tài khoản thành công.');
      setTimeout(() => setSysMsg(''), 3000);
    } catch (e: any) {
      console.error(e);
      setSysError('Lỗi xóa tài khoản: ' + e.message);
    } finally {
      if (secondApp) deleteApp(secondApp);
    }
  };
`;

code = code.replace(
  "const [classToDelete, setClassToDelete] = useState<string | null>(null);",
  handlers + "\n  const [classToDelete, setClassToDelete] = useState<string | null>(null);"
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched handlers");

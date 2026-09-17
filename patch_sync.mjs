import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// Inject state
content = content.replace(
  "const [sysMsg, setSysMsg] = useState('');",
  "const [sysMsg, setSysMsg] = useState('');\n  const [syncingPasswords, setSyncingPasswords] = useState(false);"
);

// Inject handleSyncPasswords before handleCreateUser
const syncFunc = `
  const handleSyncPasswords = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn cập nhật mật khẩu của TẤT CẢ người dùng về định dạng mới không? Điều này sẽ tự động đăng nhập vào từng tài khoản để đổi mật khẩu.')) return;
    setSyncingPasswords(true);
    setSysMsg('Bắt đầu đồng bộ mật khẩu...');
    setSysError('');

    try {
      let secondApp = null;
      try {
        secondApp = initializeApp(firebaseConfig, 'SecondaryAppSync' + Date.now());
      } catch (e) {
        secondApp = getApp('SecondaryAppSync' + Date.now());
      }
      const secondAuth = getAuth(secondApp);

      let successCount = 0;
      let failCount = 0;

      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      for (const u of allUsers) {
        if (!u.rawPassword || !u.email || !u.fullName) {
          failCount++;
          continue;
        }

        const nameParts = u.fullName.trim().split(/\\s+/);
        const firstName = nameParts[nameParts.length - 1] || 'user';
        const firstNameNoTones = firstName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        const newPassword = \`\${firstNameNoTones}123456\`;

        if (u.rawPassword === newPassword) {
           continue; // already correct
        }

        try {
          // login with rawPassword
          const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
          await updatePassword(cred.user, newPassword);
          await setDoc(doc(db, 'users', u.id), { rawPassword: newPassword }, { merge: true });
          await signOut(secondAuth);
          successCount++;
          setSysMsg(\`Đang đồng bộ... (\${successCount} thành công)\`);
        } catch (err) {
          console.error('Lỗi khi đồng bộ user:', u.email, err);
          failCount++;
          if (secondAuth.currentUser) {
            await signOut(secondAuth);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      setSysMsg(\`Đồng bộ hoàn tất! Cập nhật thành công: \${successCount}, Lỗi/Bỏ qua: \${failCount}\`);
      loadData();
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi hệ thống: ' + err.message);
    } finally {
      setSyncingPasswords(false);
      setTimeout(() => setSysMsg(''), 6000);
    }
  };
`;

content = content.replace(
  "const handleCreateUser = async (e: React.FormEvent) => {",
  syncFunc + "\n  const handleCreateUser = async (e: React.FormEvent) => {"
);

// Inject button in UI
const targetUi = `<button 
          onClick={() => setShowDeleteDataModal(true)}
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} /> Xóa dữ liệu bài học
        </button>`;

const newUi = `<button 
          onClick={handleSyncPasswords}
          disabled={syncingPasswords}
          className="bg-yellow-500 text-white border border-yellow-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          <Key size={16} /> {syncingPasswords ? 'Đang đồng bộ...' : 'Đồng bộ Mật khẩu'}
        </button>
        <button 
          onClick={() => setShowDeleteDataModal(true)}
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} /> Xóa dữ liệu bài học
        </button>`;

content = content.replace(targetUi, newUi);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
console.log('Patch sync complete');

import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const importStates = `
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importGrade, setImportGrade] = useState('9');
  const [importClassName, setImportClassName] = useState('');

  const handleImportStudents = async () => {
    if (!importText.trim() || !importClassName) {
      setSysError('Vui lòng chọn lớp và nhập danh sách học sinh.');
      setTimeout(() => setSysError(''), 3000);
      return;
    }

    const lines = importText.split('\\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    setCreatingUser(true);
    setSysMsg(\`Đang nhập \${lines.length} học sinh...\`);
    setSysError('');
    
    let secondApp = null;
    let successCount = 0;
    try {
      secondApp = initializeApp(firebaseConfig, 'SecondaryAppImport' + Date.now());
      const secondAuth = getAuth(secondApp);

      for (const name of lines) {
        const safeName = name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6);
        const email = \`\${safeName}\${randomStr}@toanhoc.pro\`;
        const password = Math.random().toString(36).substring(2, 8);

        const cred = await createUserWithEmailAndPassword(secondAuth, email, password);
        
        const userData = {
          role: 'student',
          email: email,
          displayName: name,
          rawPassword: password,
          grade: importGrade,
          className: importClassName,
          permissions: { lessons: true, tests: true },
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', cred.user.uid), userData);
        successCount++;
        setSysMsg(\`Đã tạo: \${successCount}/\${lines.length}\`);
      }
      
      setSysMsg(\`Đã nhập thành công \${successCount} học sinh.\`);
      setShowImportModal(false);
      setImportText('');
      await loadData();
      setTimeout(() => setSysMsg(''), 3000);
    } catch (error) {
      console.error(error);
      setSysError('Lỗi trong quá trình nhập: ' + error.message);
    } finally {
      setCreatingUser(false);
      if (secondApp) {
        try { deleteApp(secondApp); } catch(e) {}
      }
    }
  };
`;

code = code.replace(
  "const [showAddModal, setShowAddModal] = useState(false);",
  "const [showAddModal, setShowAddModal] = useState(false);\n" + importStates
);

const headerOriginal = `<button 
            onClick={() => {
              if (activeTab === 'classes') {
                setShowClassModal(true);
              } else {
                setNewRole(activeTab);
                setShowAddModal(true);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-blue-700"
          >
            <UserPlus size={16} /> Thêm {activeTab === 'teacher' ? 'giáo viên' : activeTab === 'student' ? 'học sinh' : 'khối lớp'}
          </button>`;

const headerNew = `<div className="flex gap-2">
            {activeTab === 'student' && (
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-700"
              >
                Nhập danh sách
              </button>
            )}
            ` + headerOriginal + `
          </div>`;

code = code.replace(headerOriginal, headerNew);

const importModalUI = `
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Nhập danh sách Học sinh</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối</label>
                  <select 
                    value={importGrade}
                    onChange={e => {
                      setImportGrade(e.target.value);
                      setImportClassName('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <select 
                    value={importClassName}
                    onChange={e => setImportClassName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {schoolClasses.filter(c => c.grade === importGrade).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách học sinh</label>
                <p className="text-xs text-gray-500 mb-2">Nhập tên học sinh (hoặc copy từ file Excel/Text), mỗi học sinh trên một dòng.</p>
                <textarea 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nguyễn Văn A\nTrần Thị B\nLê Văn C"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowImportModal(false)}
                  disabled={creatingUser}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleImportStudents}
                  disabled={creatingUser}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingUser ? 'Đang nhập...' : 'Bắt đầu nhập'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{showAddModal && (",
  importModalUI + "\n      {showAddModal && ("
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched file successfully.");

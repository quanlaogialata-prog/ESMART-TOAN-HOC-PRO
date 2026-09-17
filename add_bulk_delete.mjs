import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// 1. Add state for bulk delete
const stateTarget = `  const [classToDelete, setClassToDelete] = useState<string | null>(null);`;
const stateReplacement = `  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);`;
content = content.replace(stateTarget, stateReplacement);

// 2. Add bulk delete function
const funcTarget = `  const handleDeleteClass = async (classId: string) => {`;
const funcReplacement = `  const handleDeleteAllStudents = async () => {
    if (users.filter(u => u.role === 'student').length === 0) {
      setSysError('Không có học sinh nào để xóa.');
      setTimeout(() => setSysError(''), 3000);
      return;
    }
    
    if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ học sinh cùng với tất cả dữ liệu bài tập và điểm số của họ. Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }

    setIsDeletingAll(true);
    setSysMsg('Đang xóa toàn bộ danh sách học sinh. Vui lòng không đóng trang web này...');
    
    const studentsList = users.filter(u => u.role === 'student');
    let successCount = 0;
    
    try {
      const secondApp = initializeApp(firebaseConfig, 'SecondaryAppDelAll' + Date.now());
      const secondAuth = getAuth(secondApp);

      for (const u of studentsList) {
        if (!u.rawPassword) continue;
        
        try {
          // Xóa trên Firebase Auth
          const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
          await deleteUser(cred.user);
          
          // Xóa document trên Firestore (users)
          await deleteDoc(doc(db, 'users', u.id));
          
          // Xóa dữ liệu student_stats
          const qStats = query(collection(db, 'student_stats'), where('studentId', '==', u.id));
          const snapStats = await getDocs(qStats);
          const deleteStatsPromises = snapStats.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deleteStatsPromises);
          
          // Xóa dữ liệu submissions
          const qSubs = query(collection(db, 'submissions'), where('studentId', '==', u.id));
          const snapSubs = await getDocs(qSubs);
          const deleteSubsPromises = snapSubs.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deleteSubsPromises);
          
          successCount++;
        } catch (e) {
          console.error(\`Lỗi khi xóa học sinh \${u.email}:\`, e);
        }
      }
      
      deleteApp(secondApp);
      await loadData();
      setSysMsg(\`Đã xóa thành công \${successCount} học sinh.\`);
      setTimeout(() => setSysMsg(''), 5000);
    } catch (e: any) {
      console.error(e);
      setSysError('Có lỗi xảy ra trong quá trình xóa hàng loạt.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {`;
content = content.replace(funcTarget, funcReplacement);

// 3. Add button to UI (Tab "student")
const uiTarget = `          {activeTab === 'student' && (
            <div className="flex gap-2">
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                <Users size={18} />
                Nhập danh sách
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                <UserPlus size={18} />
                Thêm học sinh
              </button>
            </div>
          )}`;
const uiReplacement = `          {activeTab === 'student' && (
            <div className="flex gap-2">
              <button 
                onClick={handleDeleteAllStudents} 
                disabled={isDeletingAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                <Trash2 size={18} />
                {isDeletingAll ? 'Đang xóa...' : 'Xóa toàn bộ DS'}
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                <Users size={18} />
                Nhập danh sách
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                <UserPlus size={18} />
                Thêm học sinh
              </button>
            </div>
          )}`;
content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

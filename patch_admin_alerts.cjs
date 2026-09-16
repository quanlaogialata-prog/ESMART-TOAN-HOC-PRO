const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf-8');

// Replace alerts with console.log or simple state messages.
// Since it's an admin dashboard, we can just use a simple message state.

// 1. Add a message state at the top of the component
content = content.replace(
  "const [showClassModal, setShowClassModal] = useState(false);",
  "const [showClassModal, setShowClassModal] = useState(false);\n  const [sysMsg, setSysMsg] = useState('');\n  const [sysError, setSysError] = useState('');"
);

// 2. Remove confirm from handleDeleteClass, make it a two-click or just delete
content = content.replace(
  /const handleDeleteClass = async \(classId: string\) => \{[\s\S]*?loadData\(\);\s*\n\s*\}\s*\};/,
  `const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const handleDeleteClass = async (classId: string) => {
    if (classToDelete !== classId) {
      setClassToDelete(classId);
      setTimeout(() => setClassToDelete(null), 3000); // Reset after 3s
      return;
    }
    await deleteDoc(doc(db, 'classes', classId));
    setClassToDelete(null);
    loadData();
  };`
);

// update class delete button to show "Xóa?" when classToDelete === c.id
content = content.replace(
  /<button\s+onClick=\{\(\) => handleDeleteClass\(c\.id\)\}[\s\S]*?<Trash2 size=\{16\} \/>\s*<\/button>/,
  `<button onClick={() => handleDeleteClass(c.id)} className="text-red-500 hover:text-red-700 p-2 transition-colors">
     {classToDelete === c.id ? <span className="text-xs font-bold">Xác nhận xóa?</span> : <Trash2 size={16} />}
   </button>`
);

// 3. Fix handleDeleteDataByGrade (remove confirm, use sysMsg/sysError)
const oldFuncRegex = /const handleDeleteDataByGrade = async \(\) => \{[\s\S]*?alert\("Lỗi khi xóa: " \+ err\.message\);\s*\}\s*\};/;
const newFunc = `const [isDeletingData, setIsDeletingData] = useState(false);
  const handleDeleteDataByGrade = async () => {
    setIsDeletingData(true);
    setSysMsg(''); setSysError('');
    try {
      const isAll = deleteDataGrade === 'all';
      let topicsSnap;
      if (isAll) {
        topicsSnap = await getDocs(collection(db, 'topics'));
      } else {
        topicsSnap = await getDocs(query(collection(db, 'topics'), where('grade', '==', Number(deleteDataGrade))));
      }
      
      let deletedCount = 0;
      let totalLessons = 0;
      for (const t of topicsSnap.docs) {
        const topicId = t.id;
        await deleteDoc(doc(db, 'topics', topicId));
        deletedCount++;
        const lessonsSnap = await getDocs(query(collection(db, 'lessons'), where('topicId', '==', topicId)));
        for (const l of lessonsSnap.docs) {
          await deleteDoc(doc(db, 'lessons', l.id));
          totalLessons++;
        }
        const testsSnap = await getDocs(query(collection(db, 'tests'), where('topicId', '==', topicId)));
        for (const ts of testsSnap.docs) {
          await deleteDoc(doc(db, 'tests', ts.id));
        }
      }
      if (isAll) {
        const allLessons = await getDocs(collection(db, 'lessons'));
        for (const l of allLessons.docs) await deleteDoc(doc(db, 'lessons', l.id));
        const allTests = await getDocs(collection(db, 'tests'));
        for (const ts of allTests.docs) await deleteDoc(doc(db, 'tests', ts.id));
      }
      setSysMsg(\`Thành công! Đã xóa \${deletedCount} chủ đề và \${totalLessons} bài học.\`);
      setTimeout(() => setShowDeleteDataModal(false), 2000);
    } catch (err: any) {
      console.error("Delete Error:", err);
      setSysError("Lỗi khi xóa: " + err.message);
    } finally {
      setIsDeletingData(false);
    }
  };`;
content = content.replace(oldFuncRegex, newFunc);

// Update modal button for deleting data
content = content.replace(
  /<button\s+onClick=\{handleDeleteDataByGrade\}\s+className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"\s*>\s*<Trash2 size=\{16\} \/> Xóa ngay\s*<\/button>/,
  `<button onClick={handleDeleteDataByGrade} disabled={isDeletingData} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
     <Trash2 size={16} /> {isDeletingData ? 'Đang xóa...' : 'Xóa ngay'}
   </button>`
);

// Add sysMsg/sysError display in the modal
content = content.replace(
  /<div className="pt-4 flex gap-3">/,
  `{sysMsg && <div className="text-green-600 text-sm font-medium">{sysMsg}</div>}
   {sysError && <div className="text-red-600 text-sm font-medium">{sysError}</div>}
   <div className="pt-4 flex gap-3">`
);

// Replace other alerts with setSysMsg / setSysError
content = content.replace(/alert\("Đã tạo dữ liệu bài học từ hệ thống thành công!"\);/g, "setSysMsg('Đã tạo dữ liệu bài học từ hệ thống thành công!'); setTimeout(() => setSysMsg(''), 3000);");
content = content.replace(/alert\("Lỗi: " \+ e\.message\);/g, "setSysError('Lỗi: ' + e.message); setTimeout(() => setSysError(''), 3000);");
content = content.replace(/alert\("Đã nhập dữ liệu bài học thành công!"\);/g, "setSysMsg('Đã nhập dữ liệu thành công!'); setTimeout(() => setSysMsg(''), 3000);");
content = content.replace(/alert\("Lỗi nhập dữ liệu: " \+ e\.message\);/g, "setSysError('Lỗi nhập dữ liệu: ' + e.message); setTimeout(() => setSysError(''), 3000);");

// Render global sysMsg and sysError at the top of the dashboard
content = content.replace(
  /<div className="p-8">/,
  `<div className="p-8">
     {sysMsg && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{sysMsg}</div>}
     {sysError && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{sysError}</div>}`
);

// Fix add user alerts
content = content.replace(/if \(!newUsername \|\| !newPassword\) return alert\("Vui lòng nhập tài khoản và mật khẩu"\);/g, "if (!newUsername || !newPassword) { setSysError('Vui lòng nhập tài khoản và mật khẩu'); setTimeout(()=>setSysError(''),3000); return; }");
content = content.replace(/alert\("Tạo người dùng thành công!"\);/g, "setSysMsg('Tạo người dùng thành công!'); setTimeout(()=>setSysMsg(''),3000);");
content = content.replace(/alert\("Lỗi tạo người dùng: " \+ err\.message\);/g, "setSysError('Lỗi tạo người dùng: ' + err.message); setTimeout(()=>setSysError(''),3000);");

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

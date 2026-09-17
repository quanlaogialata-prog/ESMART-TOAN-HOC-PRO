import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const targetOld = `  const handleDeleteClass = async (classId: string) => {
    if (classToDelete !== classId) {
      setClassToDelete(classId);
      setTimeout(() => setClassToDelete(null), 3000); // Reset after 3s
      return;
    }
    await deleteDoc(doc(db, 'classes', classId));
    setClassToDelete(null);
    loadData();
  };`;

const replacementNew = `  const handleDeleteClass = async (classId: string) => {
    if (classToDelete !== classId) {
      setClassToDelete(classId);
      setTimeout(() => setClassToDelete(null), 3000); // Reset after 3s
      return;
    }
    
    setSysMsg('Đang xóa lớp và danh sách học sinh...');
    const cls = schoolClasses.find(c => c.id === classId);
    
    if (cls) {
      const studentsInClass = users.filter(u => u.role === 'student' && u.className === cls.name);
      if (studentsInClass.length > 0) {
        try {
          const secondApp = initializeApp(firebaseConfig, 'SecondaryAppDelClass' + Date.now());
          const secondAuth = getAuth(secondApp);

          for (const u of studentsInClass) {
            try {
              if (u.rawPassword) {
                const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
                await deleteUser(cred.user);
              }
              
              await deleteDoc(doc(db, 'users', u.id));
              
              const qStats = query(collection(db, 'student_stats'), where('studentId', '==', u.id));
              const snapStats = await getDocs(qStats);
              await Promise.all(snapStats.docs.map(d => deleteDoc(d.ref)));
              
              const qSubs = query(collection(db, 'submissions'), where('studentId', '==', u.id));
              const snapSubs = await getDocs(qSubs);
              await Promise.all(snapSubs.docs.map(d => deleteDoc(d.ref)));
            } catch (err) {
              console.error('Lỗi khi xóa học sinh:', u.email, err);
            }
          }
          deleteApp(secondApp);
        } catch (err) {
          console.error('Lỗi khởi tạo Auth phụ:', err);
        }
      }
    }

    await deleteDoc(doc(db, 'classes', classId));
    setClassToDelete(null);
    setSysMsg('Đã xóa lớp và học sinh thành công.');
    setTimeout(() => setSysMsg(''), 3000);
    loadData();
  };`;

content = content.replace(targetOld, replacementNew);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

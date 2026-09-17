import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, setDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, updatePassword, deleteUser } from 'firebase/auth';
import { db, firebaseConfig } from '../../lib/firebase';
import { Users, UserPlus, BookOpen, Database, Key, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  

  // User Management State
  const [activeTab, setActiveTab] = useState<'teacher' | 'student' | 'classes'>('teacher');
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

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

    const lines = importText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    setCreatingUser(true);
    setSysMsg(`Đang nhập ${lines.length} học sinh...`);
    setSysError('');
    
    let secondApp = null;
    let successCount = 0;
    try {
      secondApp = initializeApp(firebaseConfig, 'SecondaryAppImport' + Date.now());
      const secondAuth = getAuth(secondApp);
      const processedEmailsInCurrentBatch = new Set<string>();

      for (const name of lines) {
        const [rawName, phone] = name.split(',');
        const cleanName = rawName ? rawName.trim() : 'Unknown';
        const cleanPhone = phone ? phone.trim() : '';
        const baseSafeName = cleanName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let finalSafeName = baseSafeName;
        let counter = 1;
        while (
          users.some(u => u.email === `${finalSafeName}@toanhoc.pro`) || 
          processedEmailsInCurrentBatch.has(`${finalSafeName}@toanhoc.pro`)
        ) {
          finalSafeName = `${baseSafeName}${counter}`;
          counter++;
        }
        
        const email = `${finalSafeName}@toanhoc.pro`;
        processedEmailsInCurrentBatch.add(email);
        // Convert "Nguyễn Văn Tuấn" -> "tuan" for password
        const nameParts = cleanName.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1] || 'user';
        const firstNameNoTones = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        const password = `${firstNameNoTones}123456`;

        const cred = await createUserWithEmailAndPassword(secondAuth, email, password);
        
        const userData = {
          role: 'student',
          email: email,
          fullName: cleanName,
          displayName: cleanName,
          parentPhone: cleanPhone,
          rawPassword: password,
          grade: importGrade,
          className: importClassName,
          permissions: { lessons: true, tests: true },
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', cred.user.uid), userData);
        successCount++;
        setSysMsg(`Đã tạo: ${successCount}/${lines.length}`);
      }
      
      setSysMsg(`Đã nhập thành công ${successCount} học sinh.`);
      setShowImportModal(false);
      setImportText('');
      await loadData();
      setTimeout(() => setSysMsg(''), 3000);
    } catch (error: any) {
      console.error(error);
      setSysError('Lỗi trong quá trình nhập: ' + error.message);
    } finally {
      setCreatingUser(false);
      if (secondApp) {
        try { deleteApp(secondApp); } catch(e) {}
      }
    }
  };

  
  // New User Form
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  // Removed newUsername and newPassword
  const [newRole, setNewRole] = useState<'teacher' | 'student'>('teacher');
  const [newGrade, setNewGrade] = useState('9');
  const [newClassName, setNewClassName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [showClassModal, setShowClassModal] = useState(false);
  const [sysMsg, setSysMsg] = useState('');
  const [syncingPasswords, setSyncingPasswords] = useState(false);
  const [sysError, setSysError] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [classFormGrade, setClassFormGrade] = useState('9');
  const [classFormName, setClassFormName] = useState('');
  const [newPerms, setNewPerms] = useState({ lessons: true, tests: true });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
      const clsSnap = await getDocs(collection(db, 'classes'));
      const fetchedClasses = clsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      fetchedClasses.sort((a: any, b: any) => {
        const gradeDiff = Number(a.grade || 0) - Number(b.grade || 0);
        if (gradeDiff !== 0) return gradeDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      setSchoolClasses(fetchedClasses);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

    
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

  const [userToDelete, setUserToDelete] = useState<string | null>(null);
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
    setSysMsg('Đang xóa tài khoản...');
    setSysError('');
    let secondApp: any = null;
    try {
      secondApp = initializeApp(firebaseConfig, 'SecondaryAppDel' + Date.now());
      const secondAuth = getAuth(secondApp);
      const cred = await signInWithEmailAndPassword(secondAuth, u.email, u.rawPassword);
      await deleteUser(cred.user);
      await deleteDoc(doc(db, 'users', u.id));

      if (u.role === 'student') {
        const qStats = query(collection(db, 'student_stats'), where('studentId', '==', u.id));
        const snapStats = await getDocs(qStats);
        snapStats.forEach(d => deleteDoc(d.ref));
        
        const qSubs = query(collection(db, 'submissions'), where('studentId', '==', u.id));
        const snapSubs = await getDocs(qSubs);
        snapSubs.forEach(d => deleteDoc(d.ref));
      }

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

  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const handleDeleteAllStudents = async () => {
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
          console.error(`Lỗi khi xóa học sinh ${u.email}:`, e);
        }
      }
      
      deleteApp(secondApp);
      await loadData();
      setSysMsg(`Đã xóa thành công ${successCount} học sinh.`);
      setTimeout(() => setSysMsg(''), 5000);
    } catch (e: any) {
      console.error(e);
      setSysError('Có lỗi xảy ra trong quá trình xóa hàng loạt.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
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
  };
  
    


  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!classFormName) return;
    await addDoc(collection(db, 'classes'), {
      grade: classFormGrade,
      name: classFormName
    });
    setClassFormName('');
    setShowClassModal(false);
    loadData();
  };

  
  const handleSyncPasswords = async () => {
    
    setSyncingPasswords(true);
    setSysMsg('Bắt đầu đồng bộ mật khẩu...');
    setSysError('');

    try {
      const appName = 'SecondaryAppSync_' + Date.now();
      const secondApp = initializeApp(firebaseConfig, appName);
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

        const nameParts = u.fullName.trim().split(/\s+/);
        const firstName = nameParts[nameParts.length - 1] || 'user';
        const firstNameNoTones = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        const newPassword = `${firstNameNoTones}123456`;

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
          setSysMsg(`Đang đồng bộ... (${successCount} thành công)`);
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

      setSysMsg(`Đồng bộ hoàn tất! Cập nhật thành công: ${successCount}, Bỏ qua/Lỗi: ${failCount}`);
      loadData();
      try { await deleteApp(secondApp); } catch(e) {}
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi hệ thống: ' + err.message);
    } finally {
      setSyncingPasswords(false);
      setTimeout(() => setSysMsg(''), 6000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName) { setSysError('Vui lòng nhập họ và tên'); setTimeout(()=>setSysError(''),3000); return; }
    
    setCreatingUser(true);
    let secondApp: any = null;
    try {
      // Use secondary app to prevent signing out the current admin
      secondApp = initializeApp(firebaseConfig, 'SecondaryApp' + Date.now());
      const secondAuth = getAuth(secondApp);
      const baseSafeName = newFullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let finalSafeName = baseSafeName;
      let counter = 1;
      while (users.some(u => u.email === `${finalSafeName}@toanhoc.pro`)) {
        finalSafeName = `${baseSafeName}${counter}`;
        counter++;
      }
      
      const generatedEmail = `${finalSafeName}@toanhoc.pro`;
      const email = (newRole === 'teacher' && newEmail.trim()) ? newEmail.trim() : generatedEmail;
      // Convert "Nguyễn Văn Tuấn" -> "tuan" for password
      const nameParts = newFullName.trim().split(/\s+/);
      const firstName = nameParts[nameParts.length - 1] || 'user';
      const firstNameNoTones = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
      const generatedPassword = `${firstNameNoTones}123456`;
      
      const cred = await createUserWithEmailAndPassword(secondAuth, email, generatedPassword);
      
      const userData: any = {
        role: newRole,
        fullName: newFullName,
        email: email,
        displayName: newFullName,
        rawPassword: generatedPassword,
        createdAt: new Date().toISOString()
      };

      if (newRole === 'student') {
        userData.grade = newGrade;
        userData.className = newClassName || 'Chưa phân lớp';
        userData.permissions = newPerms;
      }

      await setDoc(doc(db, 'users', cred.user.uid), userData);
      await signOut(secondAuth); // cleanup
      
      setShowAddModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewClassName('');
      setNewParentPhone('');
      loadData();
      setSysMsg('Tạo người dùng thành công!'); setTimeout(()=>setSysMsg(''),3000);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message;
      if (err.code === 'auth/email-already-in-use') errMsg = 'Tài khoản (Tên truy cập) này đã tồn tại!';
      else if (err.code === 'auth/weak-password') errMsg = 'Mật khẩu phải có ít nhất 6 ký tự!';
      setSysError('Lỗi tạo người dùng: ' + errMsg); 
      setTimeout(()=>setSysError(''), 5000);
    } finally {
      if (secondApp) {
        try { await deleteApp(secondApp); } catch(e) { console.error(e); }
      }
      setCreatingUser(false);
    }
  };

    const handleSaveAssignedClasses = async () => {
    if(!assigningTeacher) return;
    await updateDoc(doc(db, 'users', assigningTeacher.id), { 
      'permissions.assignedClasses': assignedClasses 
    });
    setShowAssignModal(false);
    loadData();
  };

  const togglePermission = async (userId: string, currentPerms: any, field: string) => {
    const updated = { ...currentPerms, [field]: !currentPerms[field] };
    await updateDoc(doc(db, 'users', userId), { permissions: updated });
    loadData();
  };

  if (loading) return <div>Đang tải danh sách người dùng...</div>;

  const filteredUsers = users.filter(u => u.role === activeTab).sort((a: any, b: any) => {
    if (activeTab === 'student') {
      const gradeDiff = Number(a.grade || 0) - Number(b.grade || 0);
      if (gradeDiff !== 0) return gradeDiff;
      const classDiff = (a.className || '').localeCompare(b.className || '');
      if (classDiff !== 0) return classDiff;
    }
    const nameA = a.fullName || a.displayName || '';
    const nameB = b.fullName || b.displayName || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bảng điều khiển Quản trị</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản người dùng và hệ thống</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveTab('teacher')}
          className={`cursor-pointer p-6 rounded-xl shadow-sm border flex items-center justify-between transition-all ${activeTab === 'teacher' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${activeTab === 'teacher' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <BookOpen size={24} />
            </div>
            <div>
              <p className={`font-medium ${activeTab === 'teacher' ? 'text-blue-800' : 'text-gray-500 text-sm'}`}>Quản lý Giáo viên</p>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'teacher').length}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('student')}
          className={`cursor-pointer p-6 rounded-xl shadow-sm border flex items-center justify-between transition-all ${activeTab === 'student' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${activeTab === 'student' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600'}`}>
              <Users size={24} />
            </div>
            <div>
              <p className={`font-medium ${activeTab === 'student' ? 'text-orange-800' : 'text-gray-500 text-sm'}`}>Quản lý Học sinh</p>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'student').length}</p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('classes')}
          className={`cursor-pointer p-6 rounded-xl shadow-sm border flex items-center justify-between transition-all ${activeTab === 'classes' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-green-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${activeTab === 'classes' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'}`}>
              <BookOpen size={24} />
            </div>
            <div>
              <p className={`font-medium ${activeTab === 'classes' ? 'text-green-800' : 'text-gray-500 text-sm'}`}>Quản lý Khối Lớp</p>
              <p className="text-2xl font-bold text-gray-800">{schoolClasses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Danh sách {activeTab === 'teacher' ? 'Giáo viên' : activeTab === 'student' ? 'Học sinh' : 'Khối Lớp'}
          </h2>
          <div className="flex gap-2">
            {(activeTab === 'student' || activeTab === 'teacher') && (
              <button 
                onClick={handleSyncPasswords}
                disabled={syncingPasswords}
                className="bg-yellow-500 text-white border border-yellow-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <Key size={16} /> {syncingPasswords ? 'Đang đồng bộ...' : 'Đồng bộ Mật khẩu'}
              </button>
            )}
            {activeTab === 'student' && (
              <button 
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-700"
              >
                Nhập danh sách
              </button>
            )}
            <button 
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
          </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {activeTab !== 'classes' ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Họ và Tên</th>
                <th className="px-6 py-4 font-medium">Tên hiển thị</th>
                {activeTab === 'student' && <th className="px-6 py-4 font-medium">Khối</th>}
                {activeTab === 'student' && <th className="px-6 py-4 font-medium">Lớp</th>}
                <th className="px-6 py-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td>
                </tr>
              )}
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-800">{u.fullName || u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.displayName}</td>
                  {activeTab === 'student' && (
                    <td className="px-6 py-4 text-gray-600">Khối {u.grade || '9'}</td>
                  )}
                  {activeTab === 'student' && (
                    <td className="px-6 py-4 text-gray-600">{u.className || '-'}</td>
                  )}
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center flex-wrap">
                        {u.role === 'student' ? (
                          <>
                            <button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'lessons')}
                              className={`text-xs px-2 py-1 rounded border ${u.permissions?.lessons !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                            >
                              Bài học: {u.permissions?.lessons !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'tests')}
                              className={`text-xs px-2 py-1 rounded border ${u.permissions?.tests !== false ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                            >
                              Kiểm tra: {u.permissions?.tests !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button onClick={() => { setEditingUserPass(u); setNewPass(''); setSysError(''); }} className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">Đổi MK</button>
                            <button onClick={() => handleDeleteUser(u)} className={`text-xs px-2 py-1 rounded border ${userToDelete === u.id ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 border-red-200 text-red-700'}`}>{userToDelete === u.id ? 'Xác nhận xóa' : 'Xóa'}</button>

                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'lessons')}
                              className={`text-xs px-2 py-1 rounded border ${u.permissions?.lessons !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                            >
                              Bài học: {u.permissions?.lessons !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'tests')}
                              className={`text-xs px-2 py-1 rounded border ${u.permissions?.tests !== false ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                            >
                              Kiểm tra: {u.permissions?.tests !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button 
                              onClick={() => {
                                setAssigningTeacher(u);
                                setAssignedClasses(u.permissions?.assignedClasses || []);
                                setShowAssignModal(true);
                              }}
                              className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1"
                            >
                              Giao lớp ({u.permissions?.assignedClasses?.length || 0})
                            </button>
                            <button onClick={() => { setEditingUserPass(u); setNewPass(''); setSysError(''); }} className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">Đổi MK</button>
                            <button onClick={() => handleDeleteUser(u)} className={`text-xs px-2 py-1 rounded border ${userToDelete === u.id ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 border-red-200 text-red-700'}`}>{userToDelete === u.id ? 'Xác nhận xóa' : 'Xóa'}</button>

                          </>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Khối</th>
                  <th className="px-6 py-4 font-medium">Tên Lớp</th>
                  <th className="px-6 py-4 font-medium">Sĩ số</th>
                  <th className="px-6 py-4 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schoolClasses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td>
                  </tr>
                )}
                {schoolClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-800">Khối {cls.grade}</td>
                    <td className="px-6 py-4 text-gray-600">{cls.name}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium text-blue-600">
                      {users.filter(u => u.role === 'student' && String(u.grade) === String(cls.grade) && u.className === cls.name).length} học sinh
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                       <button onClick={() => handleDeleteClass(cls.id)} className={`text-xs px-2 py-1 rounded border ${classToDelete === cls.id ? 'bg-red-600 text-white border-red-600' : 'text-red-500 border-red-200 bg-red-50'}`}>{classToDelete === cls.id ? 'Xác nhận xóa' : 'Xóa'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      
      
      {/* Assign Classes Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Giao Lớp cho Giáo viên</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-2">Chọn các khối/lớp mà giáo viên <strong>{assigningTeacher?.displayName}</strong> được phép quản lý:</p>
              
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {schoolClasses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Chưa có lớp nào được tạo.</p>
                ) : (
                  schoolClasses.map(cls => (
                    <label key={cls.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={assignedClasses.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedClasses([...assignedClasses, cls.id]);
                          } else {
                            setAssignedClasses(assignedClasses.filter(id => id !== cls.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">Khối {cls.grade} - Lớp {cls.name}</span>
                    </label>
                  ))
                )}
              </div>
              
              {sysMsg && <div className="text-green-600 text-sm font-medium">{sysMsg}</div>}
   {sysError && <div className="text-red-600 text-sm font-medium">{sysError}</div>}
   <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleSaveAssignedClasses}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Thêm Lớp Mới</h2>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối</label>
                  <select 
                    value={classFormGrade}
                    onChange={e => setClassFormGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp</label>
                  <input 
                    type="text" 
                    required
                    value={classFormName}
                    onChange={e => setClassFormName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: 9A1"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Thêm Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Import Students Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nhập học sinh theo danh sách</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp</label>
                  <select 
                    value={importGrade} onChange={e => { setImportGrade(e.target.value); setImportClassName(""); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp</label>
                  <select 
                    value={importClassName} onChange={e => setImportClassName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {schoolClasses.filter(c => String(c.grade) === String(importGrade)).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh sách (Mỗi dòng một học sinh, định dạng: <b>Họ và tên, Số điện thoại (tùy chọn)</b>)
                </label>
                <textarea 
                  value={importText} onChange={e => setImportText(e.target.value)}
                  rows={5}
                  placeholder="Nguyễn Văn A, 0901234567&#10;Trần Thị B&#10;Lê Văn C, 0987654321"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                />
              </div>
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Email sẽ được tự động tạo theo dạng: <b>hoten@toanhoc.pro</b></li>
                  <li>Mật khẩu mặc định là: <b>tên123456</b> (VD: Nguyễn Văn Tuấn {'->'} tuan123456)</li>
                </ul>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleImportStudents}
                  disabled={creatingUser}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creatingUser ? 'Đang nhập...' : 'Bắt đầu Nhập'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Thêm {newRole === 'teacher' ? 'Giáo viên' : 'Học sinh'} Mới</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input 
                  type="text" required
                  value={newFullName} onChange={e => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {newRole === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" required
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
              
              {newRole === 'student' && (
                <>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp</label>
                      <select 
                        value={newGrade} onChange={e => { setNewGrade(e.target.value); setNewClassName(""); }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp</label>
                      <select 
                        required value={newClassName} onChange={e => setNewClassName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Chọn lớp --</option>
                        {schoolClasses.filter(c => String(c.grade) === String(newGrade)).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quyền truy cập</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={newPerms.lessons}
                          onChange={e => setNewPerms({...newPerms, lessons: e.target.checked})}
                        />
                        <span className="text-sm">Vào Bài học</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={newPerms.tests}
                          onChange={e => setNewPerms({...newPerms, tests: e.target.checked})}
                        />
                        <span className="text-sm">Làm Kiểm tra</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-gray-500 italic mt-2">
                Mật khẩu mặc định: Tên (chữ thường, không dấu) + 123456 (VD: tuan123456)
              </p>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creatingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

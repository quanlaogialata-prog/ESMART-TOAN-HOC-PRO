import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldLoadData = `  const loadData = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
      const clsSnap = await getDocs(collection(db, 'classes'));
      setSchoolClasses(clsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) {`;

const newLoadData = `  const loadData = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
      const clsSnap = await getDocs(collection(db, 'classes'));
      const fetchedClasses = clsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedClasses.sort((a, b) => {
        const gradeDiff = Number(a.grade || 0) - Number(b.grade || 0);
        if (gradeDiff !== 0) return gradeDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      setSchoolClasses(fetchedClasses);
    } catch(e) {`;

content = content.replace(oldLoadData, newLoadData);


const oldFilteredUsers = `  const filteredUsers = users.filter(u => u.role === activeTab);`;

const newFilteredUsers = `  const filteredUsers = users.filter(u => u.role === activeTab).sort((a, b) => {
    if (activeTab === 'student') {
      const gradeDiff = Number(a.grade || 0) - Number(b.grade || 0);
      if (gradeDiff !== 0) return gradeDiff;
      const classDiff = (a.className || '').localeCompare(b.className || '');
      if (classDiff !== 0) return classDiff;
    }
    const nameA = a.fullName || a.displayName || '';
    const nameB = b.fullName || b.displayName || '';
    return nameA.localeCompare(nameB);
  });`;

content = content.replace(oldFilteredUsers, newFilteredUsers);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

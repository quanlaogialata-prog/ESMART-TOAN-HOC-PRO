import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// 1. Add states
const stateRegex = /const \[loading, setLoading\] = useState\(true\);/;
const stateReplace = `const [loading, setLoading] = useState(true);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');`;
content = content.replace(stateRegex, stateReplace);

// 2. Add load classes
const loadRegex = /const topicsSnap = await getDocs\(collection\(db, 'topics'\)\);/;
const loadReplace = `const clsSnap = await getDocs(collection(db, 'classes'));
    const clsData = clsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    setSchoolClasses(clsData);
    if (user) {
      const uDoc = await getDoc(doc(db, 'users', user.uid));
      if (uDoc.exists()) {
        setAssignedClasses(uDoc.data().permissions?.assignedClasses || []);
      }
    }
    const topicsSnap = await getDocs(collection(db, 'topics'));`;
content = content.replace(loadRegex, loadReplace);

// 3. Update handleAssignTest
const assignHandlerRegex = /const handleAssignTest = async \(e: React\.FormEvent\) => \{[\s\S]*?setShowAssignModal\(false\);\n      setAssignDate\(''\);\n    \} catch \(err: any\) \{/g;
const assignHandlerReplace = `const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDate || !assigningTest || !selectedClassId) {
      setSysError("Vui lòng chọn lớp và ngày hạn nộp!");
      setTimeout(()=>setSysError(''), 3000);
      return;
    }
    const cls = schoolClasses.find(c => c.id === selectedClassId);
    if (!cls) return;
    try {
      await addDoc(collection(db, 'assignments'), {
        testId: assigningTest.id,
        testTitle: assigningTest.title,
        testType: assigningTest.type,
        testDuration: assigningTest.durationMinutes,
        grade: cls.grade,
        classId: cls.id,
        className: cls.name,
        assignedDate: new Date().toISOString(),
        dueDate: assignDate,
        assignedBy: user?.uid,
        createdAt: new Date().toISOString()
      });
      // Success
      setShowAssignModal(false);
      setAssignDate('');
      setSelectedClassId('');
    } catch (err: any) {`;
content = content.replace(assignHandlerRegex, assignHandlerReplace);

// 4. Update the modal UI
const modalRegex = /<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Khối lớp nhận bài<\/label>\s*<div className="px-4 py-2 border border-gray-200 bg-blue-50 text-blue-700 rounded-lg font-bold">\s*Khối \{selectedGrade\}\s*<\/div>\s*<\/div>/g;
const modalReplace = `<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp nhận bài</label>
                <select 
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn lớp --</option>
                  {(role === 'admin' 
                    ? schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade))
                    : schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade) && assignedClasses.includes(c.id))
                  ).map(c => (
                    <option key={c.id} value={c.id}>Khối {c.grade} - Lớp {c.name}</option>
                  ))}
                </select>
                {(role === 'admin' 
                    ? schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade))
                    : schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade) && assignedClasses.includes(c.id))
                  ).length === 0 && <p className="text-red-500 text-xs mt-1">Bạn chưa được phân quyền phụ trách lớp nào ở khối này.</p>}
              </div>`;
content = content.replace(modalRegex, modalReplace);

// 5. Ensure getDoc is imported
if (!content.includes("getDoc")) {
    content = content.replace(/import \{ collection, query, getDocs, addDoc, where, deleteDoc, doc, updateDoc \} from 'firebase\/firestore';/, "import { collection, query, getDocs, addDoc, where, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';");
}

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Patched ManageTests");

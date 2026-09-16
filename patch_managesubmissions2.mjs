import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

// 1. Add useAuth import
if (!content.includes('useAuth')) {
    content = content.replace(/import \{ db \} from '\.\.\/\.\.\/lib\/firebase';/, "import { db } from '../../lib/firebase';\nimport { useAuth } from '../../contexts/AuthContext';");
}

// 2. Add user from useAuth
content = content.replace(/export default function ManageSubmissions\(\) \{/, "export default function ManageSubmissions() {\n  const { user, role } = useAuth();");

// 3. Modify fetchData
const fetchRegex = /const fetchData = async \(\) => \{[\s\S]*?setSubmissions\(subs\);\n    \} catch \(e\) \{/g;
const fetchReplace = `const fetchData = async () => {
    setLoading(true);
    try {
      let assignedClassIds: string[] = [];
      if (user) {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) {
          assignedClassIds = uDoc.data().permissions?.assignedClasses || [];
        }
      }

      const asmSnap = await getDocs(collection(db, 'assignments'));
      const asmMap: any = {};
      asmSnap.forEach(d => {
        asmMap[d.id] = d.data();
      });
      setAssignments(asmMap);

      const subQ = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      const subSnap = await getDocs(subQ);
      const subs: any[] = [];
      subSnap.forEach(d => {
        const subData = d.data();
        const asm = asmMap[subData.assignmentId];
        
        // Filter out if teacher is not admin and assignment belongs to a class they don't manage
        if (role !== 'admin' && asm && asm.classId) {
          if (!assignedClassIds.includes(asm.classId)) {
             return; // Skip this submission
          }
        }
        
        subs.push({ id: d.id, ...subData });
      });
      setSubmissions(subs);
    } catch (e) {`;
content = content.replace(fetchRegex, fetchReplace);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', content);
console.log("Patched ManageSubmissions for class filtering");

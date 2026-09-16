import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const stateStr = `  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');`;

const newStateStr = stateStr + `
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);`;

code = code.replace(stateStr, newStateStr);

const loadDataStr = `    const testsData = testsSnap.docs.map(d => {
      const data = d.data();
      const topic = topicsData.find(t => t.id === data.topicId);
      return { 
        id: d.id, 
        ...data, 
        grade: data.grade || (topic ? topic.grade : null) 
      };
    });
    setTests(testsData);`;

const newLoadDataStr = loadDataStr + `

    const asmSnap = await getDocs(collection(db, 'assignments'));
    setAssignmentsList(asmSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const subSnap = await getDocs(collection(db, 'submissions'));
    setSubmissionsList(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const stuSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    setStudentsList(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));`;

code = code.replace(loadDataStr, newLoadDataStr);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);

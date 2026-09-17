import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

const targetOld = `      const subSnap = await getDocs(collection(db, 'submissions'));
      const subData = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const classAssignmentIds = asmData.map(a => a.id);
      const classSubData = subData.filter(s => classAssignmentIds.includes(s.assignmentId));
      
      setSubmissions(classSubData);`;

const replacementNew = `      const subSnap = await getDocs(collection(db, 'submissions'));
      const subData = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const classAssignmentIds = asmData.map(a => a.id);
      const studentIdMap = {};
      stuData.forEach(s => studentIdMap[s.id] = true);

      const classSubData = subData.filter(s => 
        classAssignmentIds.includes(s.assignmentId) && 
        studentIdMap[s.studentId]
      );
      
      setSubmissions(classSubData);`;

content = content.replace(targetOld, replacementNew);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);

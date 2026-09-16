import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

// 1. Update fetchData to get users and construct dummy submissions
const fetchDataRegex = /const fetchData = async \(\) => \{[\s\S]*?setSubmissions\(subs\);\n\s*\} catch \(e\) \{/;
const newFetchData = `const fetchData = async () => {
    setLoading(true);
    try {
      let assignedClassIds: string[] = [];
      if (user) {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) {
          assignedClassIds = uDoc.data().permissions?.assignedClasses || [];
        }
      }

      // Fetch all student users
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const allStudents: any[] = [];
      usersSnap.forEach(d => allStudents.push({ id: d.id, ...d.data() }));

      const asmSnap = await getDocs(collection(db, 'assignments'));
      const asmMap: any = {};
      asmSnap.forEach(d => {
        asmMap[d.id] = d.data();
      });
      setAssignments(asmMap);

      const subQ = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      const subSnap = await getDocs(subQ);
      const subs: any[] = [];
      const subsMap: any = {};

      subSnap.forEach(d => {
        const subData = d.data();
        const asm = asmMap[subData.assignmentId];
        
        // Filter out if teacher is not admin and assignment belongs to a class they don't manage
        if (role !== 'admin' && asm && asm.classId) {
          if (!assignedClassIds.includes(asm.classId)) {
             return; // Skip this submission
          }
        }
        
        subsMap[\`\${subData.assignmentId}_\${subData.studentId}\`] = true;
        subs.push({ id: d.id, ...subData });
      });

      // Find missing submissions for overdue assignments
      Object.keys(asmMap).forEach(asmId => {
        const asm = asmMap[asmId];
        if (role !== 'admin' && asm.classId && !assignedClassIds.includes(asm.classId)) return;
        
        const targetStudents = allStudents.filter(s => s.className === asm.className && Number(s.grade) === Number(asm.grade));
        
        targetStudents.forEach(student => {
          if (!subsMap[\`\${asmId}_\${student.id}\`]) {
            const dueDateToUse = asm.extensions && asm.extensions[student.id] ? asm.extensions[student.id] : asm.dueDate;
            if (new Date() > new Date(dueDateToUse)) {
              subs.push({
                id: \`overdue-\${asmId}-\${student.id}\`,
                isOverdueFlag: true,
                assignmentId: asmId,
                studentEmail: student.email,
                studentId: student.id,
                score: 0,
                maxScore: asm.testDuration ? 10 : 10,
                submittedAt: null
              });
            }
          }
        });
      });

      setSubmissions(subs);
    } catch (e) {`;

content = content.replace(fetchDataRegex, newFetchData);


// 2. Update confirmReassign
const confirmReassignRegex = /const confirmReassign = async \(\) => \{[\s\S]*?setReassignSubId\(null\);\n\s*fetchData\(\);\n\s*\} catch \(e\) \{/;

const newConfirmReassign = `const confirmReassign = async () => {
    if (!reassignSubId) return;
    try {
      let isDummy = reassignSubId.startsWith('overdue-');
      let asmId = '';
      let sId = '';
      
      if (isDummy) {
        const parts = reassignSubId.split('-');
        asmId = parts[1];
        sId = parts[2];
      } else {
        const subSnap = await getDoc(doc(db, 'submissions', reassignSubId));
        if (subSnap.exists()) {
          asmId = subSnap.data().assignmentId;
          sId = subSnap.data().studentId;
        }
        await deleteDoc(doc(db, 'submissions', reassignSubId));
      }

      if (asmId && sId) {
        const asmRef = doc(db, 'assignments', asmId);
        const aSnap = await getDoc(asmRef);
        if (aSnap.exists()) {
           const aData = aSnap.data();
           const currentDueDate = aData.extensions && aData.extensions[sId] ? aData.extensions[sId] : aData.dueDate;
           if (new Date() > new Date(currentDueDate)) {
              const ext = aData.extensions || {};
              const nextDay = new Date();
              nextDay.setDate(nextDay.getDate() + 1); // extend by 24h
              ext[sId] = nextDay.toISOString();
              await updateDoc(asmRef, { extensions: ext });
           }
        }
      }

      setSysMsg('Đã giao lại bài thành công! Học sinh được gia hạn thêm 1 ngày để làm lại.');
      setTimeout(() => setSysMsg(''), 3000);
      setReassignSubId(null);
      fetchData();
    } catch (e) {`;

content = content.replace(confirmReassignRegex, newConfirmReassign);

// 3. Render row differently for overdue
const rowRenderRegex = /<td className="p-4 text-center">\s*<button\s*onClick=\{\(\) => openSubmission\(sub\)\}\s*className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"\s*>\s*<Edit size=\{16\} \/> Chấm bài\s*<\/button>\s*<button/;

const newRowRender = `<td className="p-4 text-center">
                    {sub.isOverdueFlag ? (
                        <div className="inline-flex px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium items-center">
                           Quá hạn
                        </div>
                    ) : (
                        <button 
                          onClick={() => openSubmission(sub)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Edit size={16} /> Chấm bài
                        </button>
                    )}
                    <button`;
                    
content = content.replace(rowRenderRegex, newRowRender);

const dateRenderRegex = /const date = new Date\(sub\.submittedAt\)\.toLocaleString\('vi-VN'\);/;
const newDateRender = `const date = sub.isOverdueFlag ? 'Chưa nộp' : new Date(sub.submittedAt).toLocaleString('vi-VN');`;
content = content.replace(dateRenderRegex, newDateRender);

const scoreRenderRegex = /<span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm">\s*\{Number\(sub\.score \|\| 0\)\.toFixed\(2\)\} \/ \{sub\.maxScore\}\s*<\/span>/;
const newScoreRender = `{sub.isOverdueFlag ? (
                      <span className="text-gray-400 font-medium text-sm">-- / --</span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm">
                        {Number(sub.score || 0).toFixed(2)} / {sub.maxScore}
                      </span>
                    )}`;
content = content.replace(scoreRenderRegex, newScoreRender);


fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', content);
console.log("Patched ManageSubmissions.tsx");

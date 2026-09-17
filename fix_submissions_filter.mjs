import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

const targetOld = `      subSnap.forEach(d => {
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
      });`;

const replacementNew = `      const studentIdMap = {};
      allStudents.forEach(s => studentIdMap[s.id] = s);

      subSnap.forEach(d => {
        const subData = d.data();
        const asm = asmMap[subData.assignmentId];
        
        // Skip submission if student no longer exists
        if (!studentIdMap[subData.studentId]) {
          return;
        }

        // Filter out if teacher is not admin and assignment belongs to a class they don't manage
        if (role !== 'admin' && asm && asm.classId) {
          if (!assignedClassIds.includes(asm.classId)) {
             return; // Skip this submission
          }
        }
        
        subsMap[\`\${subData.assignmentId}_\${subData.studentId}\`] = true;
        subs.push({ id: d.id, ...subData });
      });`;

content = content.replace(targetOld, replacementNew);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', content);

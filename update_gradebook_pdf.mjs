import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

const regex = /const handleDownloadTestPdf = \(\) => \{[\s\S]*?setShowTestPdfModal\(false\);\n  \};/g;

const newFunc = `const handleDownloadTestPdf = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    const doc = new jsPDF('landscape');
    const title = removeVietnameseTones(\`Ten bai kiem tra: \${asm.testTitle || 'Khong ten'}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${teacherName}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(asm.assignedDate).toLocaleString('vi-VN')}\`);
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(teacherStr, 14, 30);
    doc.text(assignedDateStr, 14, 38);

    const tableData = students.map((stu, idx) => {
      const sub = submissions.find(s => s.studentId === stu.id && s.assignmentId === asm.id);
      
      let startTimeStr = 'Chua lam';
      let submitTimeStr = 'Chua nop';
      let durationStr = '-';
      let scoreStr = 'Chua nop';
      let partScoresStr = '';
      let feedbackStr = '';

      if (sub && sub.submittedAt) {
        submitTimeStr = removeVietnameseTones(new Date(sub.submittedAt).toLocaleString('vi-VN'));
        
        if (sub.timeSpent) {
           const durationMins = Math.floor(sub.timeSpent / 60);
           const durationSecs = sub.timeSpent % 60;
           durationStr = removeVietnameseTones(\`\${durationMins} phut \${durationSecs} giay\`);
           
           const startTime = new Date(new Date(sub.submittedAt).getTime() - sub.timeSpent * 1000);
           startTimeStr = removeVietnameseTones(startTime.toLocaleString('vi-VN'));
        } else {
           startTimeStr = removeVietnameseTones(new Date(sub.submittedAt).toLocaleString('vi-VN'));
        }

        if (typeof sub.score === 'number') {
          scoreStr = sub.score.toString();
        } else {
          scoreStr = 'Cho cham';
        }

        if (sub.feedback && Array.isArray(sub.feedback)) {
          partScoresStr = sub.feedback.map((f: any, i: number) => \`Cau \${i+1}: \${f.score !== undefined ? f.score : 0}/\${f.maxScore || 0}\`).join('\\n');
          feedbackStr = sub.feedback.filter((f: any) => f.feedback).map((f: any, i: number) => \`Cau \${i+1}: \${removeVietnameseTones(f.feedback)}\`).join('\\n');
        }
      }
      
      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        partScoresStr,
        scoreStr,
        feedbackStr
      ];
    });

    autoTable(doc, {
      startY: 48,
      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Diem tung phan'), removeVietnameseTones('Tong diem'), removeVietnameseTones('Nhan xet')]],
      body: tableData,
      styles: { cellWidth: 'wrap', fontSize: 9 },
      columnStyles: {
        5: { cellWidth: 35 },
        7: { cellWidth: 50 }
      }
    });

    doc.save(\`Ket_qua_bai_kiem_tra_\${removeVietnameseTones(asm.testTitle || 'Kiem_tra')}.pdf\`);
    setShowTestPdfModal(false);
  };`;

if (!content.match(regex)) {
  console.log('Regex did not match');
} else {
  content = content.replace(regex, newFunc);
  
  // Update import to fix potential download issue
  content = content.replace("import jsPDF from 'jspdf';", "import { jsPDF } from 'jspdf';");

  fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);
  console.log('Updated successfully');
}

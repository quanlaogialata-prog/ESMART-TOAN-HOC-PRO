import fs from 'fs';

// ==========================================
// 1. REVERT GRADEBOOK.TSX
// ==========================================
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// Revert imports
gradebook = gradebook.replace(
  "import * as XLSX from 'xlsx';",
  "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// Revert handleDownloadTestExcel -> handleDownloadTestPdf
let testPdfFunc = `
  const handleDownloadTestPdf = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    const doc = new jsPDF('landscape');
    const title = removeVietnameseTones(\`Ten bai kiem tra: \${asm.testTitle || 'Khong ten'}\`);
    const classNameStr = removeVietnameseTones(\`Lop: \${cls.name}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${teacherName}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(asm.assignedDate).toLocaleString('vi-VN')}\`);
    const dueDateStr = asm.dueDate ? removeVietnameseTones(\`Thoi han nop bai: \${new Date(asm.dueDate).toLocaleString('vi-VN')}\`) : 'Thoi han nop bai: Khong co';

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(classNameStr, 14, 30);
    doc.text(teacherStr, 14, 38);
    doc.text(assignedDateStr, 14, 46);
    doc.text(dueDateStr, 14, 54);

    const tableData = students.map((stu, idx) => {
      const sub = submissions.find(s => s.studentId === stu.id && s.assignmentId === asm.id);
      
      let startTimeStr = 'Chua lam';
      let submitTimeStr = 'Chua nop';
      let durationStr = '-';
      let scoreStr = 'Chua nop';
      let mcqStr = '-';
      let essayStr = '-';

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

        if (sub.mcqMax > 0) {
           const pct = ((sub.mcqScore || 0) / sub.mcqMax) * 100;
           mcqStr = \`\${Number(sub.mcqScore || 0).toFixed(1)}/\${sub.mcqMax} (\${pct.toFixed(0)}%)\`;
        }
        if (sub.essayMax > 0) {
           const pct = ((sub.essayScore || 0) / sub.essayMax) * 100;
           essayStr = \`\${Number(sub.essayScore || 0).toFixed(1)}/\${sub.essayMax} (\${pct.toFixed(0)}%)\`;
        }
      }
      
      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        mcqStr,
        essayStr,
        scoreStr
      ];
    });

    autoTable(doc, {
      startY: 64,
      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Diem Trac nghiem'), removeVietnameseTones('Diem Tu luan'), removeVietnameseTones('Tong diem')]],
      body: tableData,
      styles: { cellWidth: 'wrap', fontSize: 9 }
    });

    try {
      doc.save(\`Bang_diem_\${removeVietnameseTones(cls.name).replace(/[^a-zA-Z0-9]/g, '_')}_\${removeVietnameseTones(asm.testTitle || 'Kiem_tra').replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`);
    } catch(e) {
      const pdfOutput = doc.output('blob');
      const url = URL.createObjectURL(pdfOutput);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Bang_diem.pdf\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowTestPdfModal(false);
  };
`;
gradebook = gradebook.replace(/const handleDownloadTestExcel = \(\) => \{[\s\S]*?setShowTestPdfModal\(false\);\n  };/, testPdfFunc);

// Revert handleDownloadPeriodExcel -> handleDownloadPeriodPdf
let periodPdfFunc = `
  const handleDownloadPeriodPdf = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    const doc = new jsPDF();
    let timeText = 'Tat ca';
    if (timeFilter === 'week') timeText = 'Tuan nay';
    if (timeFilter === 'month') timeText = 'Thang nay';
    if (timeFilter === 'semester') timeText = 'Hoc ky nay';

    const title = removeVietnameseTones(\`Tong hop ket qua hoc tap\`);
    const timeStr = removeVietnameseTones(\`Thoi gian: \${timeText}\`);
    const classNameStr = removeVietnameseTones(\`Lop: \${cls.name}\`);
    const teacher = removeVietnameseTones(\`Giao vien: \${teacherName}\`);

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(timeStr, 14, 30);
    doc.text(classNameStr, 14, 38);
    doc.text(teacher, 14, 46);

    const tableData = students.map((s, idx) => {
      const stats = getStudentStats(s.id);
      return [
        idx + 1,
        removeVietnameseTones(s.displayName || 'Khong ten'),
        stats.count,
        stats.avg
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('So bai da lam'), removeVietnameseTones('Diem trung binh')]],
      body: tableData,
    });

    try {
      doc.save(\`Tong_hop_ket_qua_\${timeText}_Lop_\${removeVietnameseTones(cls.name).replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`);
    } catch(e) {
      const pdfOutput = doc.output('blob');
      const url = URL.createObjectURL(pdfOutput);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Tong_hop.pdf\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
`;
gradebook = gradebook.replace(/const handleDownloadPeriodExcel = \(\) => \{[\s\S]*?XLSX\.writeFile.*?\.xlsx.*?\);\n  };/, periodPdfFunc);

// Revert Button Labels
gradebook = gradebook.replace(/handleDownloadTestExcel/g, 'handleDownloadTestPdf');
gradebook = gradebook.replace(/handleDownloadPeriodExcel/g, 'handleDownloadPeriodPdf');
gradebook = gradebook.replace(/Tải xuống Excel bảng điểm/g, 'Tải xuống bảng điểm bài kiểm tra');
gradebook = gradebook.replace(/Tải kết quả \(Excel\) -/g, 'Tải xuống kết quả');
gradebook = gradebook.replace(/Tải file Excel/g, 'Tải file PDF');
gradebook = gradebook.replace(/tải file Excel\./g, 'tải file PDF.');

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);


// ==========================================
// 2. REVERT MANAGETESTS.TSX
// ==========================================
let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// Revert imports
manageTests = manageTests.replace(
  "import * as XLSX from 'xlsx';",
  "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// Revert exportGradebookForAssignment
let exportFunc = `
  const exportGradebookForAssignment = (a: any) => {
    const classStudents = studentsList.filter(s => s.className === a.className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const doc = new jsPDF('landscape');
    const title = removeVietnameseTones(\`Ten bai kiem tra: \${a.testTitle || 'Khong ten'}\`);
    const classNameStr = removeVietnameseTones(\`Lop: \${a.className}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${user?.displayName || user?.email || 'Giao vien'}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(a.assignedDate).toLocaleString('vi-VN')}\`);
    const dueDateStr = a.dueDate ? removeVietnameseTones(\`Thoi han nop bai: \${new Date(a.dueDate).toLocaleString('vi-VN')}\`) : 'Thoi han nop bai: Khong co';

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(classNameStr, 14, 30);
    doc.text(teacherStr, 14, 38);
    doc.text(assignedDateStr, 14, 46);
    doc.text(dueDateStr, 14, 54);

    const tableData = classStudents.map((stu, idx) => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === a.id);
      
      let startTimeStr = 'Chua lam';
      let submitTimeStr = 'Chua nop';
      let durationStr = '-';
      let scoreStr = 'Chua nop';
      let mcqStr = '-';
      let essayStr = '-';

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

        if (sub.mcqMax > 0) {
           const pct = ((sub.mcqScore || 0) / sub.mcqMax) * 100;
           mcqStr = \`\${Number(sub.mcqScore || 0).toFixed(1)}/\${sub.mcqMax} (\${pct.toFixed(0)}%)\`;
        }
        if (sub.essayMax > 0) {
           const pct = ((sub.essayScore || 0) / sub.essayMax) * 100;
           essayStr = \`\${Number(sub.essayScore || 0).toFixed(1)}/\${sub.essayMax} (\${pct.toFixed(0)}%)\`;
        }
      }
      
      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        mcqStr,
        essayStr,
        scoreStr
      ];
    });

    autoTable(doc, {
      startY: 64,
      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Diem Trac nghiem'), removeVietnameseTones('Diem Tu luan'), removeVietnameseTones('Tong diem')]],
      body: tableData,
      styles: { cellWidth: 'wrap', fontSize: 9 }
    });

    try {
      doc.save(\`Bang_diem_\${removeVietnameseTones(a.className).replace(/[^a-zA-Z0-9]/g, '_')}_\${removeVietnameseTones(a.testTitle || 'Kiem_tra').replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`);
    } catch(e) {
      const pdfOutput = doc.output('blob');
      const url = URL.createObjectURL(pdfOutput);
      const aLink = document.createElement('a');
      aLink.href = url;
      aLink.download = \`Bang_diem.pdf\`;
      document.body.appendChild(aLink);
      aLink.click();
      document.body.removeChild(aLink);
      URL.revokeObjectURL(url);
    }
  };
`;
manageTests = manageTests.replace(/const exportGradebookForAssignment = \(\w+: any\) => \{[\s\S]*?XLSX\.writeFile.*?\.xlsx.*?\);\n  };/, exportFunc);

// Revert Button Labels
manageTests = manageTests.replace(/Xuất Excel bảng điểm lớp/g, 'Xuất PDF bảng điểm lớp');
manageTests = manageTests.replace(/bảng điểm Excel/g, 'bảng điểm PDF');

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);

console.log("Successfully reverted to PDF format!");

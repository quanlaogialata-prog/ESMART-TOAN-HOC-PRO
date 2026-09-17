import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// Replace imports
content = content.replace(
  "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';",
  "import * as XLSX from 'xlsx';"
);
content = content.replace(
  "import { jsPDF } from 'jspdf';",
  "import * as XLSX from 'xlsx';"
);

let exportFunc = `
  const exportGradebookForAssignment = (a: any) => {
    const classStudents = studentsList.filter(s => s.className === a.className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const tableData = classStudents.map((stu, idx) => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === a.id);
      
      let startTimeStr = 'Chưa làm';
      let submitTimeStr = 'Chưa nộp';
      let durationStr = '-';
      let scoreStr = 'Chưa nộp';
      let mcqStr = '-';
      let essayStr = '-';

      if (sub && sub.submittedAt) {
        submitTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
        
        if (sub.timeSpent) {
           const durationMins = Math.floor(sub.timeSpent / 60);
           const durationSecs = sub.timeSpent % 60;
           durationStr = \`\${durationMins} phút \${durationSecs} giây\`;
           
           const startTime = new Date(new Date(sub.submittedAt).getTime() - sub.timeSpent * 1000);
           startTimeStr = startTime.toLocaleString('vi-VN');
        } else {
           startTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
        }

        if (typeof sub.score === 'number') {
          scoreStr = sub.score.toString();
        } else {
          scoreStr = 'Chờ chấm';
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
      
      return {
        'STT': idx + 1,
        'Họ tên': stu.displayName || 'Không tên',
        'T.Gian Làm Bài': startTimeStr,
        'T.Gian Nộp Bài': submitTimeStr,
        'Thời lượng': durationStr,
        'Điểm Trắc nghiệm': mcqStr,
        'Điểm Tự luận': essayStr,
        'Tổng điểm': scoreStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bảng điểm");
    XLSX.writeFile(wb, \`Bang_diem_\${a.className}_\${a.testTitle || 'Kiem_tra'}.xlsx\`);
  };
`;
content = content.replace(/const exportGradebookForAssignment = \(\w+: any\) => \{[\s\S]*?doc\.save.*?\.pdf.*?\);\n  };/, exportFunc);

content = content.replace(/Xuất PDF bảng điểm/g, 'Xuất Excel bảng điểm');
content = content.replace(/bảng điểm PDF/g, 'bảng điểm Excel');

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

console.log("Updated ManageTests to Excel");

import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// Replace imports
content = content.replace(
  "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';",
  "import * as XLSX from 'xlsx';"
);

// Replace handleDownloadTestPdf
let testPdfFunc = `
  const handleDownloadTestExcel = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    const tableData = students.map((stu, idx) => {
      const sub = submissions.find(s => s.studentId === stu.id && s.assignmentId === asm.id);
      
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
    XLSX.writeFile(wb, \`Bang_diem_\${cls.name}_\${asm.testTitle || 'Kiem_tra'}.xlsx\`);
    
    setShowTestPdfModal(false);
  };
`;
content = content.replace(/const handleDownloadTestPdf = \(\) => \{[\s\S]*?setShowTestPdfModal\(false\);\n  };/, testPdfFunc);

// Replace handleDownloadPeriodPdf
let periodPdfFunc = `
  const handleDownloadPeriodExcel = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    let timeText = 'Tất cả';
    if (timeFilter === 'week') timeText = 'Tuần này';
    if (timeFilter === 'month') timeText = 'Tháng này';
    if (timeFilter === 'semester') timeText = 'Học kỳ này';

    const tableData = students.map((s, idx) => {
      const stats = getStudentStats(s.id);
      return {
        'STT': idx + 1,
        'Họ tên': s.displayName || 'Không tên',
        'Số bài đã làm': stats.count,
        'Điểm trung bình': stats.avg
      };
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tổng hợp");
    XLSX.writeFile(wb, \`Tong_hop_ket_qua_\${timeText}_Lop_\${cls.name}.xlsx\`);
  };
`;
content = content.replace(/const handleDownloadPeriodPdf = \(\) => \{[\s\S]*?doc\.save.*?\.pdf.*?\);\n  };/, periodPdfFunc);

// Replace button texts
content = content.replace(/handleDownloadTestPdf/g, 'handleDownloadTestExcel');
content = content.replace(/handleDownloadPeriodPdf/g, 'handleDownloadPeriodExcel');
content = content.replace(/Tải xuống bảng điểm bài kiểm tra/g, 'Tải xuống Excel bảng điểm');
content = content.replace(/Tải xuống kết quả \{timeFilter === 'week' \? 'tuần' : timeFilter === 'month' \? 'tháng' : timeFilter === 'semester' \? 'học kỳ' : 'tất cả'\}/g, "Tải kết quả (Excel)");
content = content.replace(/Tải file PDF/g, 'Tải file Excel');
content = content.replace(/Lưu ý: Trên một số điện thoại.*?tải file PDF\./g, 'Lưu ý: Trên một số điện thoại, bạn cần mở ứng dụng trong Tab mới (biểu tượng mũi tên ở góc trên) để tải file Excel.');

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);

console.log("Updated Gradebook to Excel");

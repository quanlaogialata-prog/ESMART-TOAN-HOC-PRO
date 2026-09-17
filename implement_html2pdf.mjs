import fs from 'fs';

// ==============================
// 1. ManageTests.tsx
// ==============================
let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// Add import if missing
if (!manageTests.includes("import html2pdf")) {
  manageTests = manageTests.replace(
    "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';",
    "import html2pdf from 'html2pdf.js';"
  );
}

let exportFunc = `
  const exportGradebookForAssignment = (a: any) => {
    const classStudents = studentsList.filter(s => s.className === a.className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    
    let html = \`
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #1f2937;">BẢNG ĐIỂM BÀI KIỂM TRA</h2>
      <div style="margin-bottom: 20px; font-size: 14px;">
        <p><b>Tên bài kiểm tra:</b> \${a.testTitle || 'Không tên'}</p>
        <p><b>Lớp:</b> \${a.className}</p>
        <p><b>Giáo viên:</b> \${user?.displayName || user?.email || 'Giáo viên'}</p>
        <p><b>Giao lúc:</b> \${new Date(a.assignedDate).toLocaleString('vi-VN')}</p>
        <p><b>Hạn nộp:</b> \${a.dueDate ? new Date(a.dueDate).toLocaleString('vi-VN') : 'Không có'}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #e5e7eb; padding: 8px;">STT</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Bắt đầu làm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Nộp bài</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Thời gian</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Trắc nghiệm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tự luận</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tổng điểm</th>
          </tr>
        </thead>
        <tbody>
    \`;

    classStudents.forEach((stu, idx) => {
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
           durationStr = \`\${durationMins}p \${durationSecs}s\`;
           
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
           mcqStr = \`\${Number(sub.mcqScore || 0).toFixed(1)}/\${sub.mcqMax}\`;
        }
        if (sub.essayMax > 0) {
           essayStr = \`\${Number(sub.essayScore || 0).toFixed(1)}/\${sub.essayMax}\`;
        }
      }
      
      html += \`
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${idx + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">\${stu.displayName || 'Không tên'}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${startTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${submitTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${durationStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${mcqStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${essayStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: bold; color: #2563eb;">\${scoreStr}</td>
        </tr>
      \`;
    });

    html += \`
        </tbody>
      </table>
    \`;
    
    container.innerHTML = html;
    
    const opt = {
      margin:       0.4,
      filename:     \`Bang_diem_\${a.className}_\${Date.now()}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(container).save();
  };
`;
manageTests = manageTests.replace(/const exportGradebookForAssignment = \(\w+: any\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n    \}\n  };/, exportFunc);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);

// ==============================
// 2. Gradebook.tsx
// ==============================
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

if (!gradebook.includes("import html2pdf")) {
  gradebook = gradebook.replace(
    "import { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';",
    "import html2pdf from 'html2pdf.js';"
  );
}

let testPdfFunc = `
  const handleDownloadTestPdf = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    
    let html = \`
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #1f2937;">BẢNG ĐIỂM BÀI KIỂM TRA</h2>
      <div style="margin-bottom: 20px; font-size: 14px;">
        <p><b>Tên bài kiểm tra:</b> \${asm.testTitle || 'Không tên'}</p>
        <p><b>Lớp:</b> \${cls.name}</p>
        <p><b>Giáo viên:</b> \${teacherName}</p>
        <p><b>Giao lúc:</b> \${new Date(asm.assignedDate).toLocaleString('vi-VN')}</p>
        <p><b>Hạn nộp:</b> \${asm.dueDate ? new Date(asm.dueDate).toLocaleString('vi-VN') : 'Không có'}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #e5e7eb; padding: 8px;">STT</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Bắt đầu làm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Nộp bài</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Thời gian</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Trắc nghiệm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tự luận</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tổng điểm</th>
          </tr>
        </thead>
        <tbody>
    \`;

    students.forEach((stu, idx) => {
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
           durationStr = \`\${durationMins}p \${durationSecs}s\`;
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
           mcqStr = \`\${Number(sub.mcqScore || 0).toFixed(1)}/\${sub.mcqMax}\`;
        }
        if (sub.essayMax > 0) {
           essayStr = \`\${Number(sub.essayScore || 0).toFixed(1)}/\${sub.essayMax}\`;
        }
      }
      
      html += \`
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${idx + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">\${stu.displayName || 'Không tên'}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${startTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${submitTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${durationStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${mcqStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${essayStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: bold; color: #2563eb;">\${scoreStr}</td>
        </tr>
      \`;
    });

    html += \`
        </tbody>
      </table>
    \`;
    
    container.innerHTML = html;
    
    const opt = {
      margin:       0.4,
      filename:     \`Bang_diem_\${cls.name}_\${Date.now()}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(container).save();
    
    setShowTestPdfModal(false);
  };
`;
gradebook = gradebook.replace(/const handleDownloadTestPdf = \(\) => \{[\s\S]*?setShowTestPdfModal\(false\);\n  };/, testPdfFunc);

let periodPdfFunc = `
  const handleDownloadPeriodPdf = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    let timeText = 'Tất cả';
    if (timeFilter === 'week') timeText = 'Tuần này';
    if (timeFilter === 'month') timeText = 'Tháng này';
    if (timeFilter === 'semester') timeText = 'Học kỳ này';

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    
    let html = \`
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #1f2937;">TỔNG HỢP KẾT QUẢ HỌC TẬP</h2>
      <div style="margin-bottom: 20px; font-size: 14px;">
        <p><b>Thời gian:</b> \${timeText}</p>
        <p><b>Lớp:</b> \${cls.name}</p>
        <p><b>Giáo viên:</b> \${teacherName}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #e5e7eb; padding: 8px;">STT</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Số bài đã làm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Điểm trung bình</th>
          </tr>
        </thead>
        <tbody>
    \`;

    students.forEach((s, idx) => {
      const stats = getStudentStats(s.id);
      html += \`
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${idx + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">\${s.displayName || 'Không tên'}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">\${stats.count}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: bold; color: #2563eb;">\${stats.avg}</td>
        </tr>
      \`;
    });

    html += \`
        </tbody>
      </table>
    \`;
    
    container.innerHTML = html;
    
    const opt = {
      margin:       0.5,
      filename:     \`Tong_hop_ket_qua_\${cls.name}_\${Date.now()}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
  };
`;
gradebook = gradebook.replace(/const handleDownloadPeriodPdf = \(\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n    \}\n  };/, periodPdfFunc);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);

console.log("Updated exports to html2pdf!");

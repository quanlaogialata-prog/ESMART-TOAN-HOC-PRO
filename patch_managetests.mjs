import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// 1. Add imports
const importsTarget = `import { Edit, Trash2, Plus, Users, BookOpen } from 'lucide-react';
import MathText from '../../components/MathText';`;

const importsReplacement = `import { Edit, Trash2, Plus, Users, BookOpen } from 'lucide-react';
import MathText from '../../components/MathText';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';`;

content = content.replace(importsTarget, importsReplacement);

// 2. Replace exportGradebookForAssignment
const oldExportMatch = `  const exportGradebookForAssignment = (assignmentId: string, className: string, testTitle: string) => {
    const classStudents = studentsList.filter(s => s.className === className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Họ và tên,Lớp,Điểm,Ngày nộp,Trạng thái\\n";

    classStudents.forEach(stu => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === assignmentId);
      const score = sub && typeof sub.score === 'number' ? sub.score : 'Chưa làm';
      const date = sub ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : '';
      const status = sub ? (sub.score !== undefined ? 'Đã chấm' : 'Chờ chấm') : 'Chưa nộp';
      
      csvContent += \`"\${stu.displayName}","\${stu.className || ''}","\${score}","\${date}","\${status}"\\n\`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`Diem_\${className}_\${testTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };`;

const newExportFunc = `  const removeVietnameseTones = (str: string) => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
  }

  const exportGradebookForAssignment = (assignmentId: string, className: string, testTitle: string) => {
    const classStudents = studentsList.filter(s => s.className === className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const doc = new jsPDF('landscape');
    const title = removeVietnameseTones(\`Bang diem: \${testTitle || 'Khong ten'}\`);
    const classStr = removeVietnameseTones(\`Lop: \${className}\`);
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(classStr, 14, 30);

    const tableData = classStudents.map((stu, idx) => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === assignmentId);
      
      let dateStr = 'Chua nop';
      if (sub && sub.submittedAt) {
        dateStr = removeVietnameseTones(new Date(sub.submittedAt).toLocaleString('vi-VN'));
      }
      
      let scoreStr = 'Chua nop';
      let partScoresStr = '';
      let feedbackStr = '';

      if (sub) {
        if (typeof sub.score === 'number') {
          scoreStr = sub.score.toString();
        } else {
          scoreStr = 'Cho cham';
        }

        if (sub.feedback && Array.isArray(sub.feedback)) {
          partScoresStr = sub.feedback.map((f: any, i: number) => \`Cau \${i+1}: \${f.score !== undefined ? f.score : 0}/\${f.maxScore || 0}\`).join('\\n');
          feedbackStr = sub.feedback.filter((f: any) => f.feedback).map((f: any, i: number) => \`Cau \${i+1}: \${f.feedback}\`).join('\\n');
        }
      }
      
      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        dateStr,
        removeVietnameseTones(partScoresStr),
        scoreStr,
        removeVietnameseTones(feedbackStr)
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('Thoi gian nop'), removeVietnameseTones('Diem tung phan'), removeVietnameseTones('Tong diem'), removeVietnameseTones('Nhan xet')]],
      body: tableData,
      styles: { cellWidth: 'wrap' },
      columnStyles: {
        3: { cellWidth: 40 },
        5: { cellWidth: 60 }
      }
    });

    doc.save(\`Diem_\${className}_\${removeVietnameseTones(testTitle).replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`);
  };`;

content = content.replace(oldExportMatch, newExportFunc);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

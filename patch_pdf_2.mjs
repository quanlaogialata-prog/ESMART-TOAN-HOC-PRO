import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex = /const exportGradebookForAssignment = \([\s\S]*?document\.body\.removeChild\(link\);\n  };/g;
if (!content.match(regex)) {
  console.log("Could not find the function with regex");
}

const replacementNew = `const exportGradebookForAssignment = (a: any) => {
    const classStudents = studentsList.filter(s => s.className === a.className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const doc = new jsPDF('landscape');
    const title = removeVietnameseTones(\`Ten bai kiem tra: \${a.testTitle || 'Khong ten'}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${user?.displayName || user?.email || 'Giao vien'}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(a.assignedDate).toLocaleString('vi-VN')}\`);
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(teacherStr, 14, 30);
    doc.text(assignedDateStr, 14, 38);

    const tableData = classStudents.map((stu, idx) => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === a.id);
      
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

    doc.save(\`Diem_\${a.className}_\${removeVietnameseTones(a.testTitle).replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`);
  };`;

content = content.replace(regex, replacementNew);

// Add removeVietnameseTones if it's not there yet
if (!content.includes('const removeVietnameseTones =')) {
  const insertIndex = content.indexOf(replacementNew);
  const helper = `  const removeVietnameseTones = (str: string) => {
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

  `;
  content = content.slice(0, insertIndex) + helper + content.slice(insertIndex);
}

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

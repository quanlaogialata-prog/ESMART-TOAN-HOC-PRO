import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

content = content.replace(
  `      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        partScoresStr,
        scoreStr,
        feedbackStr
      ];`,
  `      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        scoreStr
      ];`
);

content = content.replace(
  `      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Diem tung phan'), removeVietnameseTones('Tong diem'), removeVietnameseTones('Nhan xet')]],`,
  `      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Tong diem')]],`
);

content = content.replace(
  `      styles: { cellWidth: 'wrap', fontSize: 9 },
      columnStyles: {
        5: { cellWidth: 35 },
        7: { cellWidth: 50 }
      }`,
  `      styles: { cellWidth: 'wrap', fontSize: 9 }`
);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);

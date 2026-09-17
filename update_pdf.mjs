import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

const replacement1 = `      let startTimeStr = 'Chua lam';
      let submitTimeStr = 'Chua nop';
      let durationStr = '-';
      let scoreStr = 'Chua nop';
      let mcqStr = '-';
      let essayStr = '-';`;

content = content.replace(
  `      let startTimeStr = 'Chua lam';
      let submitTimeStr = 'Chua nop';
      let durationStr = '-';
      let scoreStr = 'Chua nop';
      let partScoresStr = '';
      let feedbackStr = '';`,
  replacement1
);

const replacement2 = `        if (typeof sub.score === 'number') {
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
        }`;

content = content.replace(
  `        if (typeof sub.score === 'number') {
          scoreStr = sub.score.toString();
        } else {
          scoreStr = 'Cho cham';
        }

        if (sub.feedback && Array.isArray(sub.feedback)) {
          partScoresStr = sub.feedback.map((f: any, i: number) => \`Cau \${i+1}: \${f.score !== undefined ? f.score : 0}/\${f.maxScore || 0}\`).join('\\n');
          feedbackStr = sub.feedback.filter((f: any) => f.feedback).map((f: any, i: number) => \`Cau \${i+1}: \${removeVietnameseTones(f.feedback)}\`).join('\\n');
        }`,
  replacement2
);

const replacement3 = `      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        mcqStr,
        essayStr,
        scoreStr
      ];`;

content = content.replace(
  `      return [
        idx + 1,
        removeVietnameseTones(stu.displayName || 'Khong ten'),
        startTimeStr,
        submitTimeStr,
        durationStr,
        scoreStr
      ];`,
  replacement3
);

const replacement4 = `      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Diem Trac nghiem'), removeVietnameseTones('Diem Tu luan'), removeVietnameseTones('Tong diem')]],`;

content = content.replace(
  `      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('T.Gian Lam Bai'), removeVietnameseTones('T.Gian Nop Bai'), removeVietnameseTones('Thoi luong'), removeVietnameseTones('Tong diem')]],`,
  replacement4
);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);

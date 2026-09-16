import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const searchGrade = `             if (gradeData && gradeData.score !== undefined) {
                const parsedScore = Number(gradeData.score);
                if (!isNaN(parsedScore)) {
                  qScore = parsedScore;
                  qFeedback = gradeData.feedback || 'AI đã chấm bài tự luận này.';
                } else {
                  qScore = pts * 0.5;
                  qFeedback = 'Hệ thống AI trả về điểm không hợp lệ. Cần giáo viên xem lại. Nhận xét: ' + (gradeData.feedback || '');
                }
             } else {
                qScore = pts * 0.5;
                qFeedback = 'Hệ thống AI không phản hồi điểm số. Cần giáo viên chấm lại.';
             }`;

const replaceGrade = `             if (gradeData && gradeData.score !== undefined) {
                const parsedScore = Number(gradeData.score);
                if (!isNaN(parsedScore)) {
                  qScore = parsedScore;
                  qFeedback = gradeData.feedback || 'AI đã chấm bài tự luận này.';
                } else {
                  qScore = pts * 0.5;
                  qFeedback = 'Hệ thống AI trả về điểm không hợp lệ. Cần giáo viên xem lại. Nhận xét: ' + (gradeData.feedback || '');
                }
             } else if (gradeData && gradeData.error) {
                qScore = 0;
                qFeedback = gradeData.error;
             } else {
                qScore = pts * 0.5;
                qFeedback = 'Hệ thống AI không phản hồi điểm số. Cần giáo viên chấm lại.';
             }`;

content = content.replace(searchGrade, replaceGrade);
fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("Patched grade-essay error handling");

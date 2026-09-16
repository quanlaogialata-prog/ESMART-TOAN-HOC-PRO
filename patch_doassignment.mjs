import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const regexVars = /let totalScore = 0;\s*let maxScore = 0;\s*const feedback: any\[\] = \[\];/;
const replaceVars = `let totalScore = 0;
    let maxScore = 0;
    let mcqScore = 0;
    let essayScore = 0;
    let mcqMax = 0;
    let essayMax = 0;
    const feedback: any[] = [];`;

content = content.replace(regexVars, replaceVars);

// Replace MCQ checking block
const regexMcq = /if \(q\.type === 'mcq' \|\| q\.type === 'tf'\) \{\s*if \(studentAns === q\.correctAnswer\) \{\s*qScore = pts;\s*qFeedback = 'Chính xác';\s*\} else \{\s*qFeedback = \`Sai\. Đáp án đúng là: \$\{q\.correctAnswer\}\`;\s*\}\s*\} else if \(q\.type === 'short'\) \{\s*if \(studentAns\.toLowerCase\(\)\.trim\(\) === \(q\.correctAnswer \|\| ''\)\.toLowerCase\(\)\.trim\(\)\) \{\s*qScore = pts;\s*qFeedback = 'Chính xác';\s*\} else \{\s*qFeedback = \`Sai\. Đáp án đúng là: \$\{q\.correctAnswer\}\`;\s*\}\s*\} else if \(q\.type === 'essay'\) \{/g;

const replaceMcq = `if (q.type === 'mcq' || q.type === 'tf') {
        mcqMax += pts;
        if (studentAns === q.correctAnswer) {
          qScore = pts;
          qFeedback = 'Chính xác';
        } else {
          qFeedback = \`Sai. Đáp án đúng là: \$\{q.correctAnswer\}\`;
        }
      } else if (q.type === 'short') {
        mcqMax += pts;
        if (studentAns.toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim()) {
          qScore = pts;
          qFeedback = 'Chính xác';
        } else {
          qFeedback = \`Sai. Đáp án đúng là: \$\{q.correctAnswer\}\`;
        }
      } else if (q.type === 'essay') {
        essayMax += pts;`;
content = content.replace(regexMcq, replaceMcq);

// Replace accumulating score
const regexAccumulate = /totalScore \+= qScore;/;
const replaceAccumulate = `if (q.type === 'essay') {
        essayScore += qScore;
      } else {
        mcqScore += qScore;
      }
      totalScore += qScore;`;
content = content.replace(regexAccumulate, replaceAccumulate);

// Replace saving result
const regexSubmission = /score: totalScore,\s*maxScore,\s*feedback,/;
const replaceSubmission = `score: totalScore,
      maxScore,
      mcqScore,
      mcqMax,
      essayScore,
      essayMax,
      feedback,`;
content = content.replace(regexSubmission, replaceSubmission);

// Replace UI display
const regexUI = /<div className="text-4xl font-black text-blue-600 my-4">\s*\{result\.score\} \/ \{result\.maxScore\} <span className="text-lg text-gray-500 font-medium">điểm<\/span>\s*<\/div>\s*<p className="text-gray-500">Hệ thống đã tự động chấm điểm bài làm của bạn\.<\/p>/;
const replaceUI = `<div className="w-full max-w-md bg-gray-50 rounded-xl p-6 mt-4">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-600 font-medium text-lg">Tổng điểm</span>
                  <div className="text-4xl font-black text-blue-600">
                    {Number(result.score).toFixed(2).replace(/\\.00$/, '')} <span className="text-2xl text-gray-400 font-medium">/ {result.maxScore}</span>
                  </div>
                </div>
                
                {(result.mcqMax > 0 || result.essayMax > 0) && (result.mcqMax !== result.maxScore && result.essayMax !== result.maxScore) ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Điểm trắc nghiệm (Hệ thống chấm)</span>
                      <span className="font-bold text-gray-700 text-base">{Number(result.mcqScore).toFixed(2).replace(/\\.00$/, '')} / {result.mcqMax}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Điểm tự luận (AI chấm)</span>
                      <span className="font-bold text-gray-700 text-base">{Number(result.essayScore).toFixed(2).replace(/\\.00$/, '')} / {result.essayMax}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    Hệ thống đã chấm điểm bài làm của bạn.
                  </div>
                )}
              </div>`;
content = content.replace(regexUI, replaceUI);

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("Patched DoAssignment.tsx");


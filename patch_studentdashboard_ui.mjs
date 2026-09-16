import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

// 1. Fetch score and submit time
const subLogicRegex = /const submittedAssignIds = new Set\(\);\n\s*subSnap\.docs\.forEach\(doc => \{\n\s*submittedAssignIds\.add\(doc\.data\(\)\.assignmentId\);\n\s*\}\);/;
const subLogicReplace = `const submittedAssignMap = new Map();
    subSnap.docs.forEach(doc => {
      submittedAssignMap.set(doc.data().assignmentId, doc.data());
    });`;
content = content.replace(subLogicRegex, subLogicReplace);

const pushRegex = /validAssignments\.push\(\{ id: d\.id, \.\.\.assignData, isSubmitted: submittedAssignIds\.has\(d\.id\) \}\);/;
const pushReplace = `const subData = submittedAssignMap.get(d.id);
        validAssignments.push({ 
          id: d.id, 
          ...assignData, 
          isSubmitted: !!subData,
          score: subData?.score,
          maxScore: subData?.maxScore,
          submittedAt: subData?.submittedAt
        });`;
content = content.replace(pushRegex, pushReplace);


// 2. Change UI
const uiRegex = /<span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">\s*<Clock size=\{12\} \/> \{new Date\(a\.dueDate\)\.toLocaleDateString\('vi-VN'\)\}\s*<\/span>\s*<\/div>\s*<h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">\{a\.testTitle\}<\/h3>\s*<p className="text-sm text-gray-500 flex items-center gap-1">\s*<AlertCircle size=\{14\} \/> Thời gian: \{a\.testDuration\} phút\s*<\/p>\s*<\/div>\s*<div className="p-4 bg-gray-50">\s*\{a\.isSubmitted \? \(\s*<div className="block w-full text-center bg-gray-200 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed">\s*Đã làm bài\s*<\/div>\s*\) : \(/;

const uiReplace = `<span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          <Clock size={12} /> {a.isSubmitted && a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('vi-VN') : new Date(a.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">{a.testTitle}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <AlertCircle size={14} /> Thời gian: {a.testDuration} phút
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar size={14} /> Giao bài: {new Date(a.assignedDate || a.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 flex items-center gap-3">
                      {a.isSubmitted ? (
                        <>
                          <div className="flex-1 text-center bg-gray-200 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed">
                            Đã làm bài
                          </div>
                          {a.score !== undefined && (
                            <div className="px-3 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg whitespace-nowrap">
                              {Number(a.score).toFixed(2)} / {a.maxScore}
                            </div>
                          )}
                        </>
                      ) : (`;
content = content.replace(uiRegex, uiReplace);

// 3. Fix Calendar text header
content = content.replace(/Hạn nộp: \{dateKey\}/, "{a.isSubmitted ? 'Đã nộp bài: ' : 'Hạn nộp: '} {dateKey}"); // Actually need to group by different thing if we want header to change, but let's just make it simple

const headerRegex = /<h3 className="text-lg font-bold text-indigo-800 border-b border-indigo-100 pb-2 flex items-center gap-2">\s*<Calendar size=\{20\} \/>\s*Hạn nộp: \{dateKey\}\s*<\/h3>/;
const headerReplace = `<h3 className="text-lg font-bold text-indigo-800 border-b border-indigo-100 pb-2 flex items-center gap-2">
                <Calendar size={20} />
                {dateKey}
              </h3>`;
content = content.replace(headerRegex, headerReplace);

const groupByRegex = /const dateStr = new Date\(a\.dueDate\)\.toLocaleDateString\('vi-VN', \{\n\s*weekday: 'long',\n\s*year: 'numeric',\n\s*month: 'long',\n\s*day: 'numeric'\n\s*\}\);/;
const groupByReplace = `const dateStr = (a.isSubmitted && a.submittedAt ? 'Nộp bài: ' : 'Hạn nộp: ') + new Date(a.isSubmitted && a.submittedAt ? a.submittedAt : a.dueDate).toLocaleDateString('vi-VN', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });`;
content = content.replace(groupByRegex, groupByReplace);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched UI");

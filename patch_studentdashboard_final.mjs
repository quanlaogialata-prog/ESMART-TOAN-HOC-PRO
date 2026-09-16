import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

// 1. Add timeSpent to push
content = content.replace(/submittedAt: subData\?\.submittedAt/g, "submittedAt: subData?.submittedAt,\n          timeSpent: subData?.timeSpent");

// 2. Add formatTime function inside the component if not exists, or just do it inline.
const formatDateTime = "(dateStr) => { const d = new Date(dateStr); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}` }";

const formatDuration = "(seconds) => { if (!seconds) return '0 phút'; const m = Math.floor(seconds / 60); const s = seconds % 60; return m > 0 ? `${m} phút ${s} giây` : `${s} giây`; }";

// Replace the card content.
const cardContentRegex = /<div className="p-5 border-b border-gray-100 flex-1">[\s\S]*?Làm bài ngay\s*<\/Link>\s*\)\}\s*<\/div>/;

const newCardContent = `{a.isSubmitted ? (
                    <>
                      <div className="p-5 border-b border-gray-100 flex-1">
                        <div className="flex justify-between items-start mb-3">
                           <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-green-100 text-green-700">
                             Đã nộp bài
                           </span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-4 line-clamp-2">{a.testTitle}</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" /> <span className="font-medium">Giao bài:</span> {${formatDateTime}(a.assignedDate || a.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" /> <span className="font-medium">Nộp bài:</span> {${formatDateTime}(a.submittedAt)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <AlertCircle size={14} className="text-gray-400" /> <span className="font-medium">Thời gian làm:</span> {${formatDuration}(a.timeSpent)}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 flex items-center gap-3">
                         <div className="flex-1 text-center bg-gray-200 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed">
                            Đã làm bài
                         </div>
                         {a.score !== undefined && (
                            <div className="px-3 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg whitespace-nowrap">
                              {Number(a.score).toFixed(2)} / {a.maxScore}
                            </div>
                         )}
                      </div>
                    </>
                  ) : (
                    <>
                    <div className="p-5 border-b border-gray-100 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <span className={\`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider \${
                          a.testType === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }\`}>
                          {a.testType === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          <Clock size={12} /> {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-2">{a.testTitle}</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <AlertCircle size={14} className="text-gray-400" /> <span className="font-medium">Thời lượng:</span> {a.testDuration} phút
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" /> <span className="font-medium">Giao bài:</span> {new Date(a.assignedDate || a.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex items-center gap-3">
                        <Link to={\`/assignment/\${a.id}\`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                          Làm bài ngay
                        </Link>
                    </div>
                    </>
                  )}`;
                  
content = content.replace(cardContentRegex, newCardContent);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched Card content for Student Dashboard");

import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

const regex = /<div className="p-5 border-b border-gray-100 flex-1">\s*<div className="flex justify-between items-start mb-3">\s*<span className={`text-\[10px\] font-bold px-2 py-1 rounded uppercase tracking-wider \${\s*a\.testType === 'mcq' \? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'\s*}\`}>\s*\{a\.testType === 'mcq' \? 'Trắc nghiệm' : 'Tự luận'\}\s*<\/span>\s*<span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">\s*<Clock size=\{12\} \/> \{new Date\(a\.dueDate\)\.toLocaleDateString\('vi-VN'\)\}\s*<\/span>\s*<\/div>\s*<h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-2">\{a\.testTitle\}<\/h3>\s*<div className="space-y-2">\s*<p className="text-sm text-gray-600 flex items-center gap-2">\s*<AlertCircle size=\{14\} className="text-gray-400" \/> <span className="font-medium">Thời lượng:<\/span> \{a\.testDuration\} phút\s*<\/p>\s*<p className="text-sm text-gray-600 flex items-center gap-2">\s*<Calendar size=\{14\} className="text-gray-400" \/> <span className="font-medium">Giao bài:<\/span> \{new Date\(a\.assignedDate \|\| a\.createdAt\)\.toLocaleDateString\('vi-VN'\)\}\s*<\/p>\s*<\/div>\s*<\/div>\s*<div className="p-4 bg-gray-50 flex items-center gap-3">\s*<Link to=\{\`\/assignment\/\$\{a\.id\}\`\} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">\s*Làm bài ngay\s*<\/Link>\s*<\/div>/g;

const newStr = `<div className="p-5 border-b border-gray-100 flex-1">
                      <div className="flex justify-end items-start mb-3">
                        <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                          <Clock size={12} /> Hạn nộp: {((dateStr) => { const d = new Date(dateStr); return \`\${d.getHours().toString().padStart(2, '0')}:\${d.getMinutes().toString().padStart(2, '0')} \${d.toLocaleDateString('vi-VN')}\` })(a.dueDate)}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-2">{a.testTitle}</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <AlertCircle size={14} className="text-gray-400" /> <span className="font-medium">Thời lượng:</span> {a.testDuration} phút
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" /> <span className="font-medium">Giao bài:</span> {((dateStr) => { const d = new Date(dateStr); return \`\${d.getHours().toString().padStart(2, '0')}:\${d.getMinutes().toString().padStart(2, '0')} \${d.toLocaleDateString('vi-VN')}\` })(a.assignedDate || a.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex items-center gap-3">
                        {new Date() > new Date(a.dueDate) ? (
                            <div className="block w-full text-center bg-gray-300 text-gray-600 font-medium py-2 rounded-lg cursor-not-allowed">
                              Quá hạn thời gian làm bài
                            </div>
                        ) : (
                            <Link to={\`/assignment/\${a.id}\`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                              Làm bài ngay
                            </Link>
                        )}
                    </div>`;

content = content.replace(regex, newStr);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched not submitted UI");

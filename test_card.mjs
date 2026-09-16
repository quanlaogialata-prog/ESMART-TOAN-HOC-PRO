import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

// The easiest way is to find the two blocks and replace them.
// Block 1 (default tests): 
const block1Start = `{displayedTests.filter(t => !t.isCustom).map(t => (`;
const block1End = `              </div>\n            </div>\n          )}\n          {displayedTests.filter(t => t.isCustom).length > 0 && (`;

// Block 2 (custom tests):
const block2Start = `{displayedTests.filter(t => t.isCustom).map(t => (`;
const block2End = `              </div>\n            </div>\n          )}\n        </div>\n      ) : (`;

const newRenderTestCard = `
  const renderTestCard = (t: any) => {
    return (
      <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        <div className="mb-3">
          <span className={\`text-xs font-bold px-2 py-1 rounded uppercase \${
            t.type === 'mcq' 
              ? (t.isCustom ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700') 
              : (t.isCustom ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700')
          }\`}>
            {t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
          </span>
        </div>
        
        <div className="mb-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Người ra đề</div>
          <div className="font-medium text-gray-800">{t.createdBy || 'Giáo viên'}</div>
        </div>
        
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tên đề kiểm tra</div>
          <div className="font-bold text-gray-800 text-lg leading-tight">{t.title}</div>
        </div>

        <p className="text-sm text-gray-500 flex items-center gap-1 mt-auto pt-2">
          <Clock size={14} /> {t.durationMinutes} phút
        </p>

        {(role === 'admin' || role === 'teacher') && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handlePreview(t)}
                className="text-center text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                title="Xem đề"
              >
                <Eye size={16} /> Xem
              </button>

              <button 
                onClick={() => handleEditTest(t)}
                className="text-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                title="Sửa thông tin đề"
              >
                <Pencil size={16} /> Sửa TT
              </button>

              {t.fileUrl || t.answerFileUrl ? (
                <a 
                  href={t.fileUrl || t.answerFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-center text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                  title="Tài liệu đính kèm"
                >
                  <FileText size={16} /> Đính kèm
                </a>
              ) : (
                <span 
                  className="text-center text-xs font-medium text-gray-400 bg-gray-50 py-2 rounded-lg flex flex-col items-center justify-center gap-1 cursor-not-allowed"
                  title="Không có tài liệu đính kèm"
                >
                  <FileText size={16} /> Đính kèm
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                   className="text-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                   title="Sửa câu hỏi"
                 >
                   <Pencil size={14} /> Sửa câu hỏi
                 </button>
              )}
              {t.type === 'essay' && (
                 <button 
                    onClick={() => {
                     setMakeOnlineTest(t);
                     setMakeOnlineFile(null);
                     setShowMakeOnlineModal(true);
                   }}
                   className="text-center text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                   title="Tạo đề thi online từ file tải lên"
                 >
                   Tạo thi online
                 </button>
              )}
              {deletingTestId === t.id ? (
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleDeleteTest(t.id)}
                    className="flex-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                  >
                    Xóa
                  </button>
                  <button 
                    onClick={() => setDeletingTestId(null)}
                    className="flex-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingTestId(t.id)}
                  className="text-center text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  title="Xóa đề này"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                setAssigningTest(t);
                setShowAssignModal(true);
              }}
              className={\`w-full text-center text-sm font-medium py-2.5 rounded-lg transition-colors mt-2 \${t.isCustom ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-blue-700 bg-blue-100 hover:bg-blue-200'}\`}
            >
              Giao bài
            </button>
          </div>
        )}
        {renderTestAssignments(t.id)}
      </div>
    );
  };
`;

// Insert the new function right before "const filteredLessons = lessons.filter(l => l.topicId === selectedTopicId);"
const insertTarget = "const filteredLessons = lessons.filter(l => l.topicId === selectedTopicId);";
content = content.replace(insertTarget, newRenderTestCard + "\n  " + insertTarget);

// Regex approach to extract and replace the big mapped components
// Let's use string split/substring to be safe.
const block1StartIndex = content.indexOf("{displayedTests.filter(t => !t.isCustom).map(t => (");
if (block1StartIndex === -1) {
  console.log("Could not find block1");
  process.exit(1);
}
const block1EndIndexStr = "</div>\n            </div>\n          )}\n          {displayedTests.filter(t => t.isCustom).length > 0 && (";
const block1EndIndex = content.indexOf(block1EndIndexStr, block1StartIndex);

const part1 = content.substring(0, block1StartIndex);
const part2 = "{displayedTests.filter(t => !t.isCustom).map(t => renderTestCard(t))}\n              " + block1EndIndexStr;

const restAfter1 = content.substring(block1EndIndex + block1EndIndexStr.length);

const block2StartIndex = restAfter1.indexOf("{displayedTests.filter(t => t.isCustom).map(t => (");
const block2EndIndexStr = "</div>\n            </div>\n          )}\n        </div>\n      ) : (";
const block2EndIndex = restAfter1.indexOf(block2EndIndexStr, block2StartIndex);

const part3 = restAfter1.substring(0, block2StartIndex);
const part4 = "{displayedTests.filter(t => t.isCustom).map(t => renderTestCard(t))}\n              " + block2EndIndexStr;
const part5 = restAfter1.substring(block2EndIndex + block2EndIndexStr.length);

content = part1 + part2 + part3 + part4 + part5;

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Refactored into renderTestCard");

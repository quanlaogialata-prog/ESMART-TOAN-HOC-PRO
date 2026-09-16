import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const oldCard = `
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
`;

const newCard = `
            <div className="grid grid-cols-3 gap-2 mt-2">
              {t.questionsData && getParsedQuestions(t.questionsData).length > 0 ? (
                 <button 
                    onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                   className="text-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                   title="Sửa câu hỏi"
                 >
                   <Pencil size={16} /> Sửa câu hỏi
                 </button>
              ) : t.type === 'essay' ? (
                 <button 
                    onClick={() => {
                     setMakeOnlineTest(t);
                     setMakeOnlineFile(null);
                     setShowMakeOnlineModal(true);
                   }}
                   className="text-center text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                   title="Tạo đề thi online từ file tải lên"
                 >
                   Tạo thi online
                 </button>
              ) : (
                <div className="text-center text-xs font-medium text-gray-400 bg-gray-50 py-2 rounded-lg flex flex-col items-center justify-center gap-1 cursor-not-allowed">
                  <Pencil size={16} /> Sửa câu hỏi
                </div>
              )}
              
              <button 
                onClick={() => {
                  setAssigningTest(t);
                  setShowAssignModal(true);
                }}
                className={\`w-full text-center text-xs font-medium py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 \${t.isCustom ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-blue-700 bg-blue-100 hover:bg-blue-200'}\`}
              >
                 <Calendar size={16} /> Giao bài
              </button>

              {deletingTestId === t.id ? (
                <div className="flex flex-col gap-1 w-full text-xs">
                  <button 
                    onClick={() => handleDeleteTest(t.id)}
                    className="w-full h-full bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold leading-tight"
                  >
                    Xác nhận
                  </button>
                  <button 
                    onClick={() => setDeletingTestId(null)}
                    className="w-full h-full bg-gray-100 text-gray-700 rounded hover:bg-gray-200 leading-tight"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingTestId(t.id)}
                  className="text-center text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 py-2 rounded-lg transition-colors flex flex-col items-center justify-center gap-1"
                  title="Xóa đề này"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              )}
            </div>
`;

code = code.replace(oldCard, newCard);

// Remove the old Giao bai button since we moved it into the grid
code = code.replace(`
            <button 
              onClick={() => {
                setAssigningTest(t);
                setShowAssignModal(true);
              }}
              className={\`w-full text-center text-sm font-medium py-2.5 rounded-lg transition-colors mt-2 \${t.isCustom ? 'text-green-700 bg-green-100 hover:bg-green-200' : 'text-blue-700 bg-blue-100 hover:bg-blue-200'}\`}
            >
              Giao bài
            </button>`, "");

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched layout");

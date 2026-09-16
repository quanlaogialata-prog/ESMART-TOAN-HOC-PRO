import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// The user asked:
// "sửa lại giao diện này như sau . có Người ra đề . tên đề kiểm tra còn các nút xem sửa câu hỏi, xóa, giao bài và lịch sử giao bài thi giữ nguyên như trước, nút xóa và tài liệu đính kèm chuyển cạnh các nút xem sửa giao bài"

// So they WANT:
// 1. "Người ra đề" (done)
// 2. "Tên đề kiểm tra" (done)
// 3. Keep "Xem", "Sửa câu hỏi", "Giao bài", "Lịch sử" like before (horizontal flex layout)
// 4. Move "Xóa" and "Tài liệu đính kèm" to sit next to "Xem", "Sửa câu hỏi", "Giao bài".

const originalRenderTestCard = `
  const renderTestCard = (t: any) => {
    return (
      <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        <div className="mb-4">
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
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <button 
              onClick={() => handlePreview(t)}
              className="flex-1 text-center text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Xem đề"
            >
              <Eye size={16} /> Xem
            </button>
            
            {t.fileUrl || t.answerFileUrl ? (
              <a 
                href={t.fileUrl || t.answerFileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 text-center text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Tài liệu đính kèm"
              >
                <FileText size={16} /> File
              </a>
            ) : null}

            <button 
              onClick={() => handleEditTest(t)}
              className="flex-1 text-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Sửa thông tin"
            >
              <Pencil size={16} /> Sửa TT
            </button>

            {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
               <button 
                  onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                 className="flex-1 text-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                 title="Sửa câu hỏi"
               >
                 <Pencil size={16} /> Câu hỏi
               </button>
            )}

            {t.type === 'essay' && (
               <button 
                  onClick={() => {
                   setMakeOnlineTest(t);
                   setMakeOnlineFile(null);
                   setShowMakeOnlineModal(true);
                 }}
                 className="flex-1 text-center text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                 title="Tạo đề thi online từ file tải lên"
               >
                 Tạo thi online
               </button>
            )}

            {deletingTestId === t.id ? (
              <div className="flex-1 flex gap-1">
                <button 
                  onClick={() => handleDeleteTest(t.id)}
                  className="flex-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold px-1"
                >
                  Xóa
                </button>
                <button 
                  onClick={() => setDeletingTestId(null)}
                  className="flex-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 px-1"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setDeletingTestId(t.id)}
                className="flex-1 text-center text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Xóa đề này"
              >
                <Trash2 size={16} /> Xóa
              </button>
            )}

            <button 
              onClick={() => {
                setAssigningTest(t);
                setShowAssignModal(true);
              }}
              className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 py-2 rounded-lg transition-colors mt-2"
            >
              Giao bài
            </button>
          </div>
        )}
        {renderTestAssignments(t.id)}
      </div>
    );
  };`;

// We need to carefully replace the renderTestCard function
const startIndex = code.indexOf("const renderTestCard = (t: any) => {");
const endIndex = code.indexOf("const filteredLessons = lessons.filter(l => l.topicId === selectedTopicId);");
if (startIndex !== -1 && endIndex !== -1) {
    const stringToReplace = code.substring(startIndex, endIndex);
    code = code.replace(stringToReplace, originalRenderTestCard + "\n\n  ");
}

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Reverted layout 2");

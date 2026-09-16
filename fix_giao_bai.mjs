import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

// I notice in the previous output, "Giao bài" was left in the FIRST block of buttons, but we also needed to keep all the original horizontal buttons together. 
// "Xem", "Sửa câu hỏi", "Giao bài", "Lịch sử giao bài thi" giữ nguyên như trước
// "Xóa", "Tài liệu đính kèm" chuyển cạnh các nút xem sửa giao bài

// Let's create the final perfect card layout exactly matching the user's latest request.

const newRenderTestCard = `
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
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
            {/* Hàng 1: Các nút cũ giữ nguyên (Xem, Sửa câu hỏi, Giao bài) */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handlePreview(t)}
                className="flex-1 text-center text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Xem đề"
              >
                <Eye size={16} /> Xem
              </button>

              {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                   className="flex-1 text-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                   title="Sửa câu hỏi"
                 >
                   <Pencil size={16} /> Sửa
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
                   Thi online
                 </button>
              )}

              <button 
                onClick={() => {
                  setAssigningTest(t);
                  setShowAssignModal(true);
                }}
                className="flex-[2] text-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Giao bài
              </button>
            </div>

            {/* Hàng 2: File và Xóa (chuyển xuống cạnh) */}
            <div className="flex flex-wrap gap-2">
              {t.fileUrl || t.answerFileUrl ? (
                <a 
                  href={t.fileUrl || t.answerFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 text-center text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  title="Tài liệu đính kèm"
                >
                  <FileText size={16} /> Đính kèm
                </a>
              ) : null}

              <button 
                onClick={() => handleEditTest(t)}
                className="flex-1 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Sửa thông tin đề"
              >
                <Pencil size={16} /> Thông tin
              </button>

              {deletingTestId === t.id ? (
                <div className="flex-1 flex gap-1">
                  <button 
                    onClick={() => handleDeleteTest(t.id)}
                    className="flex-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold"
                  >
                    Xác nhận
                  </button>
                  <button 
                    onClick={() => setDeletingTestId(null)}
                    className="flex-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
            </div>
          </div>
        )}
        {renderTestAssignments(t.id)}
      </div>
    );
  };
`;

const startIndex = content.indexOf("const renderTestCard = (t: any) => {");
const endIndex = content.indexOf("const filteredLessons = lessons.filter(l => l.topicId === selectedTopicId);");
if (startIndex !== -1 && endIndex !== -1) {
    const stringToReplace = content.substring(startIndex, endIndex);
    content = content.replace(stringToReplace, newRenderTestCard + "\n  ");
}

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Updated layout to match request precisely");

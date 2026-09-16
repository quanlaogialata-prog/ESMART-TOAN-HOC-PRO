import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const oldRenderTestCard = `
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
          </div>
        )}
        {renderTestAssignments(t.id)}
      </div>
    );
  };`;

const originalRenderTestCard = `
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
        
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Người ra đề</div>
            <div className="font-medium text-gray-800">{t.createdBy || 'Giáo viên'}</div>
          </div>
          <div className="flex gap-2">
            {t.fileUrl || t.answerFileUrl ? (
              <a 
                href={t.fileUrl || t.answerFileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-gray-400 hover:text-teal-600 transition-colors"
                title="Tài liệu đính kèm"
              >
                <FileText size={18} />
              </a>
            ) : null}
            {deletingTestId === t.id ? (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleDeleteTest(t.id)}
                  className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold hover:bg-red-200"
                >
                  Xóa
                </button>
                <button 
                  onClick={() => setDeletingTestId(null)}
                  className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setDeletingTestId(t.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Xóa đề này"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
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
            {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
               <button 
                  onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                 className="flex-1 text-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                 title="Sửa câu hỏi & đính kèm ảnh"
               >
                 <Pencil size={16} /> Sửa câu hỏi
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
            <button 
              onClick={() => {
                setAssigningTest(t);
                setShowAssignModal(true);
              }}
              className="flex-[2] text-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 py-2 rounded-lg transition-colors"
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
console.log("Reverted layout");

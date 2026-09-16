import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

// Fix editingQuestionsTest Modal
const oldEditQuestions = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Pencil size={24} className="text-blue-500" />
                Chỉnh sửa hình ảnh câu hỏi: {editingQuestionsTest.title}
              </h2>
              <button onClick={() => setEditingQuestionsTest(null)} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>`;

const newEditQuestions = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" onClick={() => setEditingQuestionsTest(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button onClick={() => setEditingQuestionsTest(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 flex-1 truncate">
                <Pencil size={20} className="text-blue-500" />
                Chỉnh sửa câu hỏi: {editingQuestionsTest.title}
              </h2>
            </div>`;

content = content.replace(oldEditQuestions, newEditQuestions);

// Fix previewTest Modal
const oldPreview = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{previewTest.title}</h2>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>`;

const newPreview = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">{previewTest.title}</h2>
            </div>`;

content = content.replace(oldPreview, newPreview);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

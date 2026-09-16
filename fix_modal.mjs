import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

// 1. Import ArrowLeft
if (!content.includes('ArrowLeft')) {
  content = content.replace('X, Trash2, Eye, Pencil } from \'lucide-react\';', 'X, Trash2, Eye, Pencil, ArrowLeft } from \'lucide-react\';');
}

// 2. Fix showCreateModal layout
const oldHeader = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTestId ? 'Chỉnh sửa đề kiểm tra' : (creatingType === 'mcq' ? 'Tạo đề tự động' : 'Tải đề lên')}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTest} className="p-6 space-y-4">`;

const newHeader = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">
                {editingTestId ? 'Chỉnh sửa đề kiểm tra' : (creatingType === 'mcq' ? 'Tạo đề tự động' : 'Tải đề lên')}
              </h2>
            </div>
            <form onSubmit={handleCreateTest} className="p-6 space-y-4 overflow-y-auto">`;

content = content.replace(oldHeader, newHeader);

// Let's do the same for Make Online Modal, just in case
const oldMakeOnline = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Tạo đề thi online</h2>
              <button onClick={() => setShowMakeOnlineModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMakeOnlineSubmit} className="p-6 space-y-4">`;

const newMakeOnline = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowMakeOnlineModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button type="button" onClick={() => setShowMakeOnlineModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">Tạo đề thi online</h2>
            </div>
            <form onSubmit={handleMakeOnlineSubmit} className="p-6 space-y-4 overflow-y-auto">`;

content = content.replace(oldMakeOnline, newMakeOnline);

// And for Assign Test Modal
const oldAssign = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Giao bài tập</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssignTest} className="p-6 space-y-4">`;

const newAssign = `<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button type="button" onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">Giao bài tập</h2>
            </div>
            <form onSubmit={handleAssignTest} className="p-6 space-y-4 overflow-y-auto">`;

content = content.replace(oldAssign, newAssign);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Updated modals");

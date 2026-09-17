import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldHeaderButtons = `<div className="flex items-center gap-3">
        <button 
          onClick={handleSyncPasswords}
          disabled={syncingPasswords}
          className="bg-yellow-500 text-white border border-yellow-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          <Key size={16} /> {syncingPasswords ? 'Đang đồng bộ...' : 'Đồng bộ Mật khẩu'}
        </button>
        <button 
          onClick={() => setShowDeleteDataModal(true)}
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} /> Xóa dữ liệu bài học
        </button>
        <div className="relative group">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-700">
            <Database size={16} /> Tạo dữ liệu bài học
          </button>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button onClick={seedSystemData} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-50 transition-colors">
              Tạo bài học từ hệ thống
            </button>
            <label className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer transition-colors">
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) {
                  importCustomLessonData();
                  e.target.value = '';
                }
              }} />
              Nhập bài học
            </label>
          </div>
        </div>
        </div>`;

content = content.replace(oldHeaderButtons, `        </div>`); // the closing div from earlier? Wait, the outer div was `<div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">`... Let's be careful.

const oldTabsHeader = `<div className="flex gap-2">
            {activeTab === 'student' && (`;

const newTabsHeader = `<div className="flex gap-2">
            {(activeTab === 'student' || activeTab === 'teacher') && (
              <button 
                onClick={handleSyncPasswords}
                disabled={syncingPasswords}
                className="bg-yellow-500 text-white border border-yellow-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <Key size={16} /> {syncingPasswords ? 'Đang đồng bộ...' : 'Đồng bộ Mật khẩu'}
              </button>
            )}
            {activeTab === 'student' && (`;

content = content.replace(oldTabsHeader, newTabsHeader);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

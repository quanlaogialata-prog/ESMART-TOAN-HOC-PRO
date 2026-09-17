import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const importModalStr = `
      {/* Import Students Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Nhập học sinh theo danh sách</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp</label>
                  <select 
                    value={importGrade} onChange={e => { setImportGrade(e.target.value); setImportClassName(""); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp</label>
                  <select 
                    value={importClassName} onChange={e => setImportClassName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {schoolClasses.filter(c => String(c.grade) === String(importGrade)).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh sách (Mỗi dòng một học sinh, định dạng: <b>Họ và tên, Số điện thoại (tùy chọn)</b>)
                </label>
                <textarea 
                  value={importText} onChange={e => setImportText(e.target.value)}
                  rows={8}
                  placeholder="Nguyễn Văn A, 0901234567&#10;Trần Thị B&#10;Lê Văn C, 0987654321"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                />
              </div>
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Email sẽ được tự động tạo theo dạng: <b>hoten@toanhoc.pro</b></li>
                  <li>Mật khẩu mặc định là: <b>tên123456</b> (VD: Nguyễn Văn Tuấn {'->'} tuan123456)</li>
                </ul>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleImportStudents}
                  disabled={creatingUser}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creatingUser ? 'Đang nhập...' : 'Bắt đầu Nhập'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('{/* Add User Modal */}', importModalStr + '\n      {/* Add User Modal */}');
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

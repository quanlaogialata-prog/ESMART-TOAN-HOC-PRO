import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// We will remove the broken end of the modal (lines 846 to the end before </div>)
// And insert the complete Add User Modal

const brokenPartRegex = /                        \/>\n                        <span className="text-sm">Vào Bài học<\/span>[\s\S]*?      \)\}/;

content = content.replace(brokenPartRegex, "");

const completeAddModal = `
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Thêm {newRole === 'teacher' ? 'Giáo viên' : 'Học sinh'} Mới</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input 
                  type="text" required
                  value={newFullName} onChange={e => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" required
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              {newRole === 'student' && (
                <>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp</label>
                      <select 
                        value={newGrade} onChange={e => setNewGrade(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp</label>
                      <input 
                        type="text" 
                        value={newClassName} onChange={e => setNewClassName(e.target.value)}
                        placeholder="VD: 9A1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quyền truy cập</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={newPerms.lessons}
                          onChange={e => setNewPerms({...newPerms, lessons: e.target.checked})}
                        />
                        <span className="text-sm">Vào Bài học</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={newPerms.tests}
                          onChange={e => setNewPerms({...newPerms, tests: e.target.checked})}
                        />
                        <span className="text-sm">Làm Kiểm tra</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-gray-500 italic mt-2">
                Mật khẩu mặc định: Tên (chữ thường, không dấu) + 123456 (VD: tuan123456)
              </p>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creatingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}`;

content = content.replace("    </div>\n  );\n}", completeAddModal + "\n    </div>\n  );\n}");

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

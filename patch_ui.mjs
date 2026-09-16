import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const modalUI = `
      {editingUserPass && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Đổi mật khẩu: {editingUserPass.displayName}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input 
                  type="text"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => { setEditingUserPass(null); setNewPass(''); setSysError(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleUpdatePassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('editingUserPass &&')) {
  code = code.replace(
    "{showAddModal && (",
    modalUI + "\n      {showAddModal && ("
  );
}

const originalActions1 = `<button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'lessons')}
                              className={\`text-xs px-2 py-1 rounded border \${u.permissions?.lessons !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}\`}
                            >
                              Bài học: {u.permissions?.lessons !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'tests')}
                              className={\`text-xs px-2 py-1 rounded border \${u.permissions?.tests !== false ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-red-50 border-red-200 text-red-700'}\`}
                            >
                              Kiểm tra: {u.permissions?.tests !== false ? 'Bật' : 'Tắt'}
                            </button>`;
                            
const newActions1 = originalActions1 + `
                            <button onClick={() => { setEditingUserPass(u); setNewPass(''); setSysError(''); }} className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">Đổi MK</button>
                            <button onClick={() => handleDeleteUser(u)} className="text-xs px-2 py-1 rounded border bg-red-50 border-red-200 text-red-700">Xóa</button>
`;

const originalActions2 = `<button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'lessons')}
                              className={\`text-xs px-2 py-1 rounded border \${u.permissions?.lessons !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}\`}
                            >
                              Bài học: {u.permissions?.lessons !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button 
                              onClick={() => togglePermission(u.id, u.permissions || {lessons:true, tests:true}, 'tests')}
                              className={\`text-xs px-2 py-1 rounded border \${u.permissions?.tests !== false ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-red-50 border-red-200 text-red-700'}\`}
                            >
                              Kiểm tra: {u.permissions?.tests !== false ? 'Bật' : 'Tắt'}
                            </button>
                            <button 
                              onClick={() => setAssigningTeacher(u)}
                              className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700"
                            >
                              Giao Lớp
                            </button>`;

const newActions2 = originalActions2 + `
                            <button onClick={() => { setEditingUserPass(u); setNewPass(''); setSysError(''); }} className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">Đổi MK</button>
                            <button onClick={() => handleDeleteUser(u)} className="text-xs px-2 py-1 rounded border bg-red-50 border-red-200 text-red-700">Xóa</button>
`;

code = code.replace(originalActions1, newActions1);
code = code.replace(originalActions2, newActions2);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched UI");

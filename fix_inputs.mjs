import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldInputs = `              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên truy cập (viết liền không dấu)</label>
                <input 
                  type="text" 
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: hsnguyenvana"
                />
                <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ dùng làm tài khoản đăng nhập</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Key size={16} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>`;

const newInputs = `              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Nguyễn Văn A"
                />
                <p className="text-xs text-gray-500 mt-1">Email và mật khẩu sẽ được tạo tự động</p>
              </div>`;

content = content.replace(oldInputs, newInputs);

// Also need to update the table headings and columns.
const oldThead = `<th className="px-6 py-4 font-medium">Tên hiển thị</th>
                <th className="px-6 py-4 font-medium">Tài khoản (Email)</th>
                <th className="px-6 py-4 font-medium">Mật khẩu</th>`;
const newThead = `<th className="px-6 py-4 font-medium">Họ và Tên</th>
                <th className="px-6 py-4 font-medium">Tên hiển thị</th>
                <th className="px-6 py-4 font-medium">Tài khoản (Email)</th>
                <th className="px-6 py-4 font-medium">Mật khẩu</th>`;
                
content = content.replace(oldThead, newThead);

const oldTbody = `<td className="px-6 py-4 font-medium text-gray-800">{u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {u.rawPassword ? u.rawPassword : 'Đã mã hóa (ẩn)'}
                  </td>`;
                  
const newTbody = `<td className="px-6 py-4 font-medium text-gray-800">{u.fullName || u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {u.rawPassword ? u.rawPassword : 'Đã mã hóa (ẩn)'}
                  </td>`;

content = content.replace(oldTbody, newTbody);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

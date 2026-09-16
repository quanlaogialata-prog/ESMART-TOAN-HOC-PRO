import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldThead = `<th className="px-6 py-4 font-medium">Họ và Tên</th>
                <th className="px-6 py-4 font-medium">Tên hiển thị</th>
                <th className="px-6 py-4 font-medium">Tài khoản (Email)</th>
                <th className="px-6 py-4 font-medium">Mật khẩu</th>
                {activeTab === 'student' && <th className="px-6 py-4 font-medium">Khối</th>}
                {activeTab === 'student' && <th className="px-6 py-4 font-medium">Lớp</th>}
                <th className="px-6 py-4 font-medium">Phân quyền</th>`;

const newThead = `<th className="px-6 py-4 font-medium">Họ và Tên</th>
                <th className="px-6 py-4 font-medium">Tên hiển thị</th>
                {activeTab === 'student' && <th className="px-6 py-4 font-medium">Khối</th>}
                {activeTab === 'student' && <th className="px-6 py-4 font-medium">Lớp</th>}
                <th className="px-6 py-4 font-medium">Hành động</th>`;

content = content.replace(oldThead, newThead);

const oldTds = `<td className="px-6 py-4 font-medium text-gray-800">{u.fullName || u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {u.rawPassword ? u.rawPassword : 'Đã mã hóa (ẩn)'}
                  </td>`;

const newTds = `<td className="px-6 py-4 font-medium text-gray-800">{u.fullName || u.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{u.displayName}</td>`;

content = content.replace(oldTds, newTds);

content = content.replace(
  /<div className="flex gap-2 flex-wrap max-w-\[250px\]">/g,
  `<div className="flex gap-2 items-center flex-wrap">`
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

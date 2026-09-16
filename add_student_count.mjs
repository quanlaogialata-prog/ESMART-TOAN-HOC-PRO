import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldClasses = `<th className="px-6 py-4 font-medium">Khối</th>
                  <th className="px-6 py-4 font-medium">Tên Lớp</th>
                  <th className="px-6 py-4 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schoolClasses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td>
                  </tr>
                )}
                {schoolClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-800">Khối {cls.grade}</td>
                    <td className="px-6 py-4 text-gray-600">{cls.name}</td>
                    <td className="px-6 py-4 text-gray-600">`;

const newClasses = `<th className="px-6 py-4 font-medium">Khối</th>
                  <th className="px-6 py-4 font-medium">Tên Lớp</th>
                  <th className="px-6 py-4 font-medium">Sĩ số</th>
                  <th className="px-6 py-4 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schoolClasses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td>
                  </tr>
                )}
                {schoolClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-800">Khối {cls.grade}</td>
                    <td className="px-6 py-4 text-gray-600">{cls.name}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium text-blue-600">
                      {users.filter(u => u.role === 'student' && String(u.grade) === String(cls.grade) && u.className === cls.name).length} học sinh
                    </td>
                    <td className="px-6 py-4 text-gray-600">`;

content = content.replace(oldClasses, newClasses);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

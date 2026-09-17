import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldSyntax = `      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bảng điều khiển Quản trị</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản người dùng và hệ thống</p>
        </div>
        
                </div>
      </div>`;

const newSyntax = `      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bảng điều khiển Quản trị</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản người dùng và hệ thống</p>
        </div>
      </div>`;

content = content.replace(oldSyntax, newSyntax);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

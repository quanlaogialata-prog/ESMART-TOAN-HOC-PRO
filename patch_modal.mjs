import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// 1. Update handleCreateUser email logic
const emailLogicOld = /const email = `\$\{finalSafeName\}@toanhoc\.pro`;/;
const emailLogicNew = `const generatedEmail = \`\$\{finalSafeName\}@toanhoc.pro\`;\n      const email = (newRole === 'teacher' && newEmail.trim()) ? newEmail.trim() : generatedEmail;`;
content = content.replace(emailLogicOld, emailLogicNew);

// 2. Update Add User Modal to conditionally render email and use select for class
const modalOld = /              <div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Email<\/label>\s*<input \s*type="email" required\s*value=\{newEmail\} onChange=\{e => setNewEmail\(e\.target\.value\)\}\s*className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\s*\/>\s*<\/div>\s*\{newRole === 'student' && \(\s*<>\s*<div className="flex gap-4">\s*<div className="w-1\/2">\s*<label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp<\/label>\s*<select \s*value=\{newGrade\} onChange=\{e => setNewGrade\(e\.target\.value\)\}\s*className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\s*>\s*\{\[6, 7, 8, 9, 10, 11, 12\]\.map\(g => <option key=\{g\} value=\{g\}>Khối \{g\}<\/option>\)\}\s*<\/select>\s*<\/div>\s*<div className="w-1\/2">\s*<label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp<\/label>\s*<input \s*type="text" \s*value=\{newClassName\} onChange=\{e => setNewClassName\(e\.target\.value\)\}\s*placeholder="VD: 9A1"\s*className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\s*\/>\s*<\/div>/;

const modalNew = `              {newRole === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" required
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
              
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
                      <select 
                        value={newClassName} onChange={e => setNewClassName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Chọn lớp --</option>
                        {schoolClasses.filter(c => String(c.grade) === String(newGrade)).map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>`;

content = content.replace(modalOld, modalNew);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

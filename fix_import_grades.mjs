import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldImportGrades = `<option value="9">Khối 9</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <select 
                    value={importClassName}`;

const newImportGrades = `<option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <select 
                    value={importClassName}`;

content = content.replace(oldImportGrades, newImportGrades);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

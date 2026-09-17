import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// 1. Add scroll to modal container (max-h-[90vh] overflow-y-auto)
content = content.replace(
  '<div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">',
  '<div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">'
);

// 2. Reduce textarea rows from 8 to 5
content = content.replace(
  'value={importText} onChange={e => setImportText(e.target.value)}\n                  rows={8}',
  'value={importText} onChange={e => setImportText(e.target.value)}\n                  rows={5}'
);

// 3. Make the "Hủy" button darker
content = content.replace(
  'className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"\n                >\n                  Hủy\n                </button>\n                <button \n                  onClick={handleImportStudents}',
  'className="px-4 py-2 text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"\n                >\n                  Hủy\n                </button>\n                <button \n                  onClick={handleImportStudents}'
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);

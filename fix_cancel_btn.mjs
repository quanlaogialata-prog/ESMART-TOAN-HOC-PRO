import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

const oldModalContent = `              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSaving}
                  className={\`px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors \${isSaving ? 'opacity-50 cursor-not-allowed' : ''}\`}
                >
                  Hủy
                </button>`;

const newModalContent = `              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSaving}
                  className={\`px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors shadow-sm \${isSaving ? 'opacity-50 cursor-not-allowed' : ''}\`}
                >
                  Đóng
                </button>`;

content = content.replace(oldModalContent, newModalContent);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

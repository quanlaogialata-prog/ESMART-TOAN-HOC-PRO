import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// First remove the standalone gradebook button block
content = content.replace(/\{\(role === 'teacher' \|\| role === 'admin'\) && \(\s*<button\s*onClick=\{\(\) => setActiveTab\('gradebook'\)\}.*?<\/button>\s*\)\}\s*/s, '');

// Now insert the gradebook button inside the tabs list, right after 'grading' (Chấm bài)
const gradebookBtn = `            <button 
              onClick={() => setActiveTab('gradebook')}
              className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${activeTab === 'gradebook' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Sổ kết quả
            </button>`;

content = content.replace(
  /(<button[^>]*onClick=\{\(\) => setActiveTab\('grading'\)\}[^>]*>[\s\S]*?<\/button>)/,
  `$1\n${gradebookBtn}`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);

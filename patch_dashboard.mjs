import fs from 'fs';
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  "import ManageSubmissions from './teacher/ManageSubmissions';",
  "import ManageSubmissions from './teacher/ManageSubmissions';\nimport Gradebook from './teacher/Gradebook';"
);

code = code.replace(
  "type Tab = 'curriculum' | 'tests' | 'grading' | 'admin' | 'student';",
  "type Tab = 'curriculum' | 'tests' | 'grading' | 'gradebook' | 'admin' | 'student';"
);

const btnStr = `<button 
              onClick={() => setActiveTab('grading')}
              className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${activeTab === 'grading' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Chấm bài
            </button>`;

const newBtnStr = btnStr + `
            <button 
              onClick={() => setActiveTab('gradebook')}
              className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${activeTab === 'gradebook' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Sổ kết quả
            </button>`;

code = code.replace(btnStr, newBtnStr);

const viewStr = `{(role === 'teacher' || role === 'admin') && activeTab === 'grading' && <ManageSubmissions />}`;
const newViewStr = viewStr + `\n        {(role === 'teacher' || role === 'admin') && activeTab === 'gradebook' && <Gradebook />}`;

code = code.replace(viewStr, newViewStr);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log("Patched Dashboard");

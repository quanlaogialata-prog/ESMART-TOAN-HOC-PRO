import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The tests button
const findStr = `            <button 
               onClick={() => setActiveTab('tests')}
               className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${activeTab === 'tests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Kho đề & Giao bài
            </button>`;

const newTabs = `            <button 
               onClick={() => setActiveTab('tests')}
               className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${activeTab === 'tests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Kho đề & Giao bài
            </button>
            <button 
               onClick={() => setActiveTab('grading')}
               className={\`px-4 py-1.5 text-sm font-medium rounded-md transition-colors \${activeTab === 'grading' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              Chấm bài
            </button>`;

content = content.replace(findStr, newTabs);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log('done');

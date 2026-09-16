import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Add import
if (!content.includes("import Gradebook")) {
  content = content.replace(
    "import ManageSubmissions from './teacher/ManageSubmissions';",
    "import ManageSubmissions from './teacher/ManageSubmissions';\nimport Gradebook from './teacher/Gradebook';"
  );
}

// Update Type
if (!content.includes("'gradebook'")) {
  content = content.replace(
    "type Tab = 'curriculum' | 'tests' | 'grading' | 'admin' | 'student';",
    "type Tab = 'curriculum' | 'tests' | 'grading' | 'gradebook' | 'admin' | 'student';"
  );
}

// Add Button
const buttonBlock = `        {(role === 'teacher' || role === 'admin') && (
          <button
            onClick={() => setActiveTab('gradebook')}
            className={\`px-4 py-2 font-medium text-sm transition-colors relative \${
              activeTab === 'gradebook' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }\`}
          >
            Sổ kết quả
            {activeTab === 'gradebook' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        )}`;
if (!content.includes("Sổ kết quả")) {
  content = content.replace(
    "{(role === 'teacher' || role === 'admin') && (",
    buttonBlock + "\n        {(role === 'teacher' || role === 'admin') && ("
  );
}

// Add View Component
const viewBlock = `{(role === 'teacher' || role === 'admin') && activeTab === 'gradebook' && <Gradebook />}`;
if (!content.includes("<Gradebook />")) {
  content = content.replace(
    "{role === 'student' && <StudentDashboard />}",
    viewBlock + "\n        {role === 'student' && <StudentDashboard />}"
  );
}

fs.writeFileSync('src/pages/Dashboard.tsx', content);

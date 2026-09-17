import fs from 'fs';

// Fix Gradebook.tsx
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');
gradebook = gradebook.replace(
  'className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"',
  'className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto"'
);
gradebook = gradebook.replace(
  '<table className="w-full text-left border-collapse">',
  '<table className="w-full min-w-[600px] text-left border-collapse">'
);
gradebook = gradebook.replace(
  '<div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">',
  '<div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-xl overflow-y-auto flex flex-col">'
);
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);


// Fix ManageSubmissions.tsx
let manageSubmissions = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');
manageSubmissions = manageSubmissions.replace(
  'className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"',
  'className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto"'
);
manageSubmissions = manageSubmissions.replace(
  '<table className="w-full text-left border-collapse">',
  '<table className="w-full min-w-[700px] text-left border-collapse">'
);
fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', manageSubmissions);

console.log("Fixed layouts again");

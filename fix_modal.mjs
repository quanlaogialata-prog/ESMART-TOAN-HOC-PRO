import fs from 'fs';
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');
gradebook = gradebook.replace(
  'className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"',
  'className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"'
);
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);
console.log("Fixed modal");

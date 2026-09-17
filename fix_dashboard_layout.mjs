import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(
  '<main className="flex-1 p-6 overflow-auto">',
  '<main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto min-w-0">'
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Fixed dashboard layout");

import fs from 'fs';

let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace(
  /<div className="flex flex-col h-screen items-center justify-center bg-gray-50 gap-4">/,
  `<div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-4 gap-4">`
);

fs.writeFileSync('src/pages/Login.tsx', content);

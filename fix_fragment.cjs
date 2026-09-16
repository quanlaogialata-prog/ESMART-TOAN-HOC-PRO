const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf-8');

content = content.replace(
  /{sysMsg && <div className="max-w-6xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">\{sysMsg\}<\/div>}\s*{sysError && <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">\{sysError\}<\/div>}\s*<div className="max-w-6xl mx-auto flex gap-6 h-\[calc\(100vh-120px\)\]">/,
  `<>
   {sysMsg && <div className="max-w-6xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{sysMsg}</div>}
   {sysError && <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{sysError}</div>}
   <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-120px)]">`
);

// close the fragment at the end
content = content.replace(
  /<\/div>\s*<\/div>\s*\)\s*;\s*\}/,
  `</div></div></>);}`
);

fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);

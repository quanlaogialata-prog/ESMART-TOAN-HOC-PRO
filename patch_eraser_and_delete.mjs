import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Increase eraser size
content = content.replace(
  'ctx.lineWidth = 30;',
  'ctx.lineWidth = 60;' // Doubled the size
);

// Remove the red delete button
const deleteBtnPattern = /\{isActive && !isEditing && \(\s*<button\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); deleteElement\(el\.id\); \}\}\s*className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-40 hover:bg-red-600"\s*>\s*✕\s*<\/button>\s*\)\}/;

content = content.replace(deleteBtnPattern, '');

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

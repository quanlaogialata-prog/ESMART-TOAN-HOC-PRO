import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

const target = `                  onPointerDown={(e) => {
                    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea' || (e.target as HTMLElement).tagName.toLowerCase() === 'math-field') return;
                    e.stopPropagation(); 
                    if (tool === 'cursor') {`;

const replacement = `                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea' || (e.target as HTMLElement).tagName.toLowerCase() === 'math-field') return;
                    if (tool === 'cursor') {`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

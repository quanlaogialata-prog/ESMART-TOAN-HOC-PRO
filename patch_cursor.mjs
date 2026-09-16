import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

content = content.replace(
  '<textarea\n                        autoFocus',
  '<textarea\n                        autoFocus\n                        onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}'
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched cursor');

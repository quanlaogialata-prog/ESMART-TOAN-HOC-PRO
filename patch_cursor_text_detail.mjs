import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

content = content.replace(
  '<textarea\n                        autoFocus\n                        onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}',
  '<textarea\n                        autoFocus\n                        onFocus={(e) => {\n                          const val = e.target.value;\n                          e.target.value = \'\';\n                          e.target.value = val;\n                        }}'
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched cursor text detail');

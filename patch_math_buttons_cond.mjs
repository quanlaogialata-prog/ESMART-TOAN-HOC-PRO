import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

content = content.replace(
  '{(tool === \'math\' || editingElementId) && (',
  '{(tool === \'math\' || elements.find(e => e.id === editingElementId)?.type === \'math\') && ('
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched condition');

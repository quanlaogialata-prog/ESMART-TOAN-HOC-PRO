import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

content = content.replace(
  '    if (tool === \'cursor\') {\n      setActiveElementId(null);\n      return;\n    }',
  '    if (tool === \'cursor\') {\n      setActiveElementId(null);\n      setEditingElementId(null);\n      return;\n    }'
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched clear edit');

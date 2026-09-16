import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

content = content.replace(
  '<math-field\n                          onInput',
  '<math-field\n                          ref={(el: any) => { if (el && !el.hasAttribute(\'data-focused\')) { el.setAttribute(\'data-focused\', \'true\'); el.focus(); setTimeout(() => el.executeCommand?.(\'moveToMathFieldEnd\'), 50); } }}\n                          onInput'
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched math cursor');

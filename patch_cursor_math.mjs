import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

content = content.replace(
  '<math-field\n                          ref={(el: any) => { if (el && !el.hasAttribute(\'data-focused\')) { el.setAttribute(\'data-focused\', \'true\'); el.focus(); setTimeout(() => el.executeCommand?.(\'moveToMathFieldEnd\'), 50); } }}\n                          onInput',
  '<math-field\n                          ref={(el: any) => { \n                            if (el && !el.hasAttribute(\'data-focused\')) { \n                              el.setAttribute(\'data-focused\', \'true\'); \n                              el.focus(); \n                              setTimeout(() => { try { el.executeCommand(\'moveToMathFieldEnd\'); } catch(e){} }, 50); \n                            } \n                          }}\n                          onInput'
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched cursor math detail');

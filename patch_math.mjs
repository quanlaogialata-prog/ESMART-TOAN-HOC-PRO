import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Hide virtual keyboard toggle
content = content.replace(
  '<math-field',
  '<math-field\n                          math-virtual-keyboard-policy="manual"'
);

// Add cot and move int out
const oldButtons = `              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\sin\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Sin">sin</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\cos\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Cos">cos</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\tan\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Tan">tan</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\lim_{x \\\\to \\\\infty}'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Giới hạn">lim</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\int_{}^{}'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Tích phân">∫</button>`;

const newButtons = `              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\int_{}^{}'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Tích phân">∫</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\sin\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Sin">sin</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\cos\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Cos">cos</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\tan\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Tan">tan</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\cot\\\\left(\\\\right)'); mf.executeCommand('moveToPreviousChar'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Cot">cot</button>
              <button onClick={() => { const mf = document.querySelector('math-field') as any; if (mf) { mf.insert('\\\\lim_{x \\\\to \\\\infty}'); mf.focus(); } }} className="px-2 py-1 hover:bg-gray-100 rounded font-bold whitespace-nowrap" title="Giới hạn">lim</button>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

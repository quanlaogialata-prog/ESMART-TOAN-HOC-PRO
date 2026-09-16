import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

const mathButtonsCode = `
          <div className="flex gap-2 items-center bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
            {[1, 2, 4].map(w => (
              <button key={w} onClick={() => setStrokeWidth(w)} className={\`w-8 h-8 flex items-center justify-center rounded-lg \${strokeWidth === w ? 'bg-gray-100' : 'hover:bg-gray-50'}\`}>
                <div className="bg-gray-800 rounded-full" style={{ width: w + 2, height: w + 2 }}></div>
              </button>
            ))}
          </div>
          
          {(tool === 'math' || editingElementId) && (
             <div className="flex gap-1 items-center bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 text-sm font-serif">
                <button 
                  onClick={() => {
                    const mf = document.querySelector('math-field') as any;
                    if (mf) { mf.insert('\\\\sqrt{}'); mf.focus(); }
                  }} 
                  className="px-2.5 py-1 hover:bg-gray-100 rounded font-bold" title="Căn bậc hai">
                  √x
                </button>
                <button 
                  onClick={() => {
                    const mf = document.querySelector('math-field') as any;
                    if (mf) { mf.insert('^{}'); mf.focus(); }
                  }} 
                  className="px-2.5 py-1 hover:bg-gray-100 rounded font-bold" title="Lũy thừa">
                  x²
                </button>
                <button 
                  onClick={() => {
                    const mf = document.querySelector('math-field') as any;
                    if (mf) { mf.insert('\\\\left| \\\\right|'); mf.executeCommand('moveToPreviousChar'); mf.focus(); }
                  }} 
                  className="px-2.5 py-1 hover:bg-gray-100 rounded font-bold" title="Giá trị tuyệt đối">
                  |x|
                </button>
             </div>
          )}
`;

content = content.replace(
  /<div className="flex gap-2 items-center bg-white p\.1\.5 rounded-xl shadow-sm border border-gray-100">[\s\S]*?<\/div>/,
  mathButtonsCode.trim()
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched math buttons');

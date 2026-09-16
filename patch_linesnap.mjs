import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Add lockLine state
content = content.replace(
  `const [isSaving, setIsSaving] = useState(false);`,
  `const [isSaving, setIsSaving] = useState(false);\n  const [lockLine, setLockLine] = useState(true);\n  const lineConstraintRef = useRef<{minY: number, maxY: number} | null>(null);`
);

// Add lockLine button to toolbar
const bgPatternDiv = `<div className="flex gap-4">
             <button onClick={() => setBgPattern('blank')} className={\`hover:text-gray-700 \${bgPattern==='blank'?'text-blue-500':''}\`}>Trắng</button>
             <button onClick={() => setBgPattern('lines')} className={\`hover:text-gray-700 \${bgPattern==='lines'?'text-blue-500':''}\`}>Dòng kẻ</button>
             <button onClick={() => setBgPattern('grid')} className={\`hover:text-gray-700 \${bgPattern==='grid'?'text-blue-500':''}\`}>Ô ly</button>
           </div>`;

const newBgPatternDiv = `<div className="flex gap-4 items-center">
             <button onClick={() => setBgPattern('blank')} className={\`hover:text-gray-700 \${bgPattern==='blank'?'text-blue-500':''}\`}>Trắng</button>
             <button onClick={() => setBgPattern('lines')} className={\`hover:text-gray-700 \${bgPattern==='lines'?'text-blue-500':''}\`}>Dòng kẻ</button>
             <button onClick={() => setBgPattern('grid')} className={\`hover:text-gray-700 \${bgPattern==='grid'?'text-blue-500':''}\`}>Ô ly</button>
             <div className="w-px h-3 bg-gray-300 mx-1"></div>
             <label className="flex items-center gap-1 cursor-pointer hover:text-gray-700" title="Ép nét viết, chữ, công thức thẳng theo dòng kẻ">
               <input type="checkbox" checked={lockLine} onChange={(e) => setLockLine(e.target.checked)} className="rounded text-blue-500 focus:ring-0" />
               <span className={lockLine ? 'text-blue-500' : ''}>Khóa dòng</span>
             </label>
           </div>`;
content = content.replace(bgPatternDiv, newBgPatternDiv);

// Modify startDrawing
const startDrawingBlock = `    if (tool === 'text' || tool === 'math') {
      const newId = Date.now().toString();
      const newElement: FloatingElement = { id: newId, type: tool, x, y, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setActiveElementId(null);
    
    const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
    setStartPos({ x, y });`;

const newStartDrawingBlock = `    if (tool === 'text' || tool === 'math') {
      const newId = Date.now().toString();
      let elemY = y;
      if (lockLine && (bgPattern === 'lines' || bgPattern === 'grid')) {
         elemY = Math.floor(y / 40) * 40; // Snap to row
      }
      const newElement: FloatingElement = { id: newId, type: tool, x, y: elemY, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setActiveElementId(null);
    
    if (lockLine && (bgPattern === 'lines' || bgPattern === 'grid') && ['pen', 'highlighter', 'eraser'].includes(tool)) {
       const row = Math.floor(y / 40);
       lineConstraintRef.current = { minY: row * 40, maxY: (row + 1) * 40 };
    } else {
       lineConstraintRef.current = null;
    }
    
    const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
    setStartPos({ x, y });`;
content = content.replace(startDrawingBlock, newStartDrawingBlock);

// Modify draw
const drawBlock = `    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pointerType === 'pen' ? Math.max(e.pressure, 0.1) : 0.5;`;

const newDrawBlock = `    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    if (lineConstraintRef.current) {
       y = Math.max(lineConstraintRef.current.minY, Math.min(lineConstraintRef.current.maxY, y));
    }
    
    const pressure = e.pointerType === 'pen' ? Math.max(e.pressure, 0.1) : 0.5;`;
content = content.replace(drawBlock, newDrawBlock);

// Text styling in elements map
const oldTextarea = `<textarea
                        autoFocus
                        value={el.value}
                        onChange={(e) => updateElement(el.id, e.target.value)}
                        onBlur={() => el.value.trim() === '' ? deleteElement(el.id) : setActiveElementId(null)}
                        className="bg-transparent text-black border-none outline-none resize-none p-1 font-sans"
                        style={{ fontSize: '1.25rem', color, minHeight: '32px', minWidth: '150px' }}
                        placeholder="Nhập văn bản..."
                      />`;
const newTextarea = `<textarea
                        autoFocus
                        value={el.value}
                        onChange={(e) => updateElement(el.id, e.target.value)}
                        onBlur={() => el.value.trim() === '' ? deleteElement(el.id) : setActiveElementId(null)}
                        className="bg-transparent text-black border-none outline-none resize-none font-sans overflow-hidden"
                        style={{ 
                          fontSize: '20px', 
                          lineHeight: '40px', // Matches line spacing perfectly
                          padding: '0 8px',
                          color, 
                          minHeight: '40px', 
                          minWidth: '200px',
                          height: Math.max(40, el.value.split('\\n').length * 40) + 'px'
                        }}
                        placeholder="Nhập văn bản..."
                      />`;
content = content.replace(oldTextarea, newTextarea);

const oldTextDiv = `<div className="p-1 font-sans whitespace-pre-wrap pointer-events-none" style={{ fontSize: '1.25rem', color }}>
                        {el.value}
                      </div>`;
const newTextDiv = `<div className="font-sans whitespace-pre-wrap pointer-events-none" style={{ fontSize: '20px', lineHeight: '40px', padding: '0 8px', color }}>
                        {el.value}
                      </div>`;
content = content.replace(oldTextDiv, newTextDiv);

const oldMathField = `<math-field
                          onInput={(e: any) => updateElement(el.id, e.target.value)}
                          style={{ fontSize: '1.5rem', width: '100%' }}
                        >`;
const newMathField = `<math-field
                          onInput={(e: any) => updateElement(el.id, e.target.value)}
                          style={{ fontSize: '24px', width: '100%', minHeight: '40px', display: 'flex', alignItems: 'center', padding: '0 8px' }}
                        >`;
content = content.replace(oldMathField, newMathField);

const oldMathDiv = `<div 
                        className="p-1 pointer-events-none"
                        style={{ fontSize: '1.5rem', color }}
                        dangerouslySetInnerHTML={{ 
                          __html: katex.renderToString(el.value || ' ', { throwOnError: false }) 
                        }} 
                      />`;
const newMathDiv = `<div 
                        className="pointer-events-none flex items-center"
                        style={{ fontSize: '24px', color, minHeight: '40px', padding: '0 8px' }}
                        dangerouslySetInnerHTML={{ 
                          __html: katex.renderToString(el.value || ' ', { throwOnError: false }) 
                        }} 
                      />`;
content = content.replace(oldMathDiv, newMathDiv);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched linesnap');

import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Update stroke width
content = content.replace('const [strokeWidth, setStrokeWidth] = useState<number>(4);', 'const [strokeWidth, setStrokeWidth] = useState<number>(2);');
content = content.replace('{[2, 4, 8].map(w => (', '{[1, 2, 4].map(w => (');

// Add dragging state
content = content.replace(
  'const [isSaving, setIsSaving] = useState(false);',
  'const [isSaving, setIsSaving] = useState(false);\n  const [draggingId, setDraggingId] = useState<string | null>(null);\n  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);'
);

// Replace floating elements render block
const parts = content.split('{/* Render Floating Elements */}');
const parts2 = parts[1].split(/<canvas\s+ref=\{draftCanvasRef\}/);

const newMap = `
            {elements.map(el => {
              const isActive = activeElementId === el.id;
              const isGrabbed = draggingId === el.id;
              
              return (
                <div 
                  key={el.id} 
                  className={\`absolute z-30 inline-block \${isActive ? 'ring-2 ring-blue-400 ring-offset-2 rounded' : 'hover:ring-1 hover:ring-blue-200'}\`}
                  style={{ 
                    left: el.x, 
                    top: el.y, 
                    minWidth: '50px',
                    cursor: tool === 'eraser' ? 'crosshair' : (isGrabbed ? 'grabbing' : (tool === 'cursor' ? 'grab' : 'default'))
                  }}
                  onPointerDown={(e) => {
                    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea' || (e.target as HTMLElement).tagName.toLowerCase() === 'math-field') return;
                    e.stopPropagation(); 
                    if (tool === 'cursor') {
                      setActiveElementId(el.id);
                      const rect = wrapperRef.current?.getBoundingClientRect();
                      if (rect) {
                        const clientX = e.clientX - rect.left;
                        const clientY = e.clientY - rect.top;
                        setDraggingId(el.id);
                        setDragOffset({ x: clientX - el.x, y: clientY - el.y });
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }
                    } else if (tool === 'eraser') {
                      deleteElement(el.id);
                    }
                  }}
                  onPointerMove={(e) => {
                    if (isGrabbed && dragOffset && tool === 'cursor') {
                      e.stopPropagation();
                      const rect = wrapperRef.current?.getBoundingClientRect();
                      if (rect) {
                        const clientX = e.clientX - rect.left;
                        const clientY = e.clientY - rect.top;
                        const newX = clientX - dragOffset.x;
                        const newY = clientY - dragOffset.y;
                        setElements(prev => prev.map(p => p.id === el.id ? { ...p, x: newX, y: newY } : p));
                      }
                    }
                  }}
                  onPointerUp={(e) => {
                    if (isGrabbed) {
                      e.stopPropagation();
                      setDraggingId(null);
                      setDragOffset(null);
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                  }}
                >
                  {el.type === 'text' && (
                    isActive && tool === 'cursor' ? (
                      <textarea
                        autoFocus
                        value={el.value}
                        onChange={(e) => updateElement(el.id, e.target.value)}
                        onBlur={() => el.value.trim() === '' ? deleteElement(el.id) : setActiveElementId(null)}
                        className="bg-white/90 text-black border border-blue-400 border-dashed rounded outline-none resize-none font-sans overflow-hidden shadow-sm"
                        style={{ 
                          fontSize: '20px', 
                          lineHeight: '40px',
                          padding: '0 8px',
                          color, 
                          minHeight: '40px', 
                          minWidth: '200px',
                          height: Math.max(40, el.value.split('\\n').length * 40) + 'px'
                        }}
                        placeholder="Nhập văn bản..."
                      />
                    ) : (
                      <div className="font-sans whitespace-pre-wrap pointer-events-none" style={{ fontSize: '20px', lineHeight: '40px', padding: '0 8px', color }}>
                        {el.value || ' '}
                      </div>
                    )
                  )}

                  {el.type === 'math' && (
                    isActive && tool === 'cursor' ? (
                      <div className="bg-white/90 border border-blue-400 border-dashed rounded shadow-lg min-w-[250px] p-2" onPointerDown={e => e.stopPropagation()}>
                        <math-field
                          onInput={(e: any) => updateElement(el.id, e.target.value)}
                          style={{ fontSize: '24px', width: '100%', minHeight: '40px', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'white' }}
                        >
                          {el.value}
                        </math-field>
                        <button onClick={() => el.value.trim() === '' ? deleteElement(el.id) : setActiveElementId(null)} className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded w-full font-bold hover:bg-blue-700">Lưu công thức</button>
                      </div>
                    ) : (
                      <div 
                        className="pointer-events-none flex items-center"
                        style={{ fontSize: '24px', color, minHeight: '40px', padding: '0 8px' }}
                        dangerouslySetInnerHTML={{ 
                          __html: katex.renderToString(el.value || ' ', { throwOnError: false }) 
                        }} 
                      />
                    )
                  )}
                  
                  {isActive && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} 
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-40 hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            
            <canvas ref={draftCanvasRef}`;

content = parts[0] + '{/* Render Floating Elements */}' + newMap + parts2[1];

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

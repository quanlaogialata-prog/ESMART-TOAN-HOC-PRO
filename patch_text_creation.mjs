import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Remove from startDrawing
content = content.replace(
`    if (tool === 'text' || tool === 'math') {
      const newId = Date.now().toString();
      const newElement: FloatingElement = { id: newId, type: tool, x, y, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
      return;
    }`,
`    if (tool === 'text' || tool === 'math') {
      return;
    }`
);

// Add to handleCanvasClick
const insertIndex = content.indexOf('const clearCanvas = () => {');
const clickHandler = `
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text' || tool === 'math') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newId = Date.now().toString();
      const newElement: FloatingElement = { id: newId, type: tool, x, y, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
    }
  };

`;

content = content.slice(0, insertIndex) + clickHandler + content.slice(insertIndex);

// Attach to draftCanvasRef
content = content.replace(
`              onPointerMove={draw}
              onPointerCancel={stopDrawing}
              className="absolute inset-0 z-20 touch-none"`,
`              onPointerMove={draw}
              onPointerCancel={stopDrawing}
              onClick={handleCanvasClick}
              className="absolute inset-0 z-20 touch-none"`
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Remove handleCanvasClick
const startClick = content.indexOf('const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {');
if (startClick !== -1) {
  const endClick = content.indexOf('};', startClick) + 2;
  content = content.slice(0, startClick) + content.slice(endClick);
}

// Remove onClick from canvas
content = content.replace('onClick={handleCanvasClick}\n', '');

// Add text/math logic back to startDrawing
content = content.replace(
`    if (tool === 'text' || tool === 'math') {
      return;
    }`,
`    if (tool === 'text' || tool === 'math') {
      const newId = Date.now().toString();
      const newElement: FloatingElement = { id: newId, type: tool, x, y, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
      return;
    }`
);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

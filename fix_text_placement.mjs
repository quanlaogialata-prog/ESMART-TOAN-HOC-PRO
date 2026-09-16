import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// In startDrawing, just return for text/math
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

// In stopDrawing, handle text/math creation
const stopDrawingMatch = `const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.SyntheticEvent) => {
    if (isDrawing && 'pointerId' in e) {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture((e as React.PointerEvent).pointerId);
    }
    setIsDrawing(false);`;

const stopDrawingReplacement = `const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.SyntheticEvent) => {
    if (isDrawing && 'pointerId' in e) {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture((e as React.PointerEvent).pointerId);
    }
    setIsDrawing(false);
    
    if ((tool === 'text' || tool === 'math') && 'clientX' in e) {
      const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
      const x = (e as React.PointerEvent).clientX - rect.left;
      const y = (e as React.PointerEvent).clientY - rect.top;
      
      const newId = Date.now().toString();
      const newElement: FloatingElement = { id: newId, type: tool, x, y, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
      return;
    }`;

content = content.replace(stopDrawingMatch, stopDrawingReplacement);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

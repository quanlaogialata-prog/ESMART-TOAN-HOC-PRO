import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

const drawBgFunc = `  const drawBackground = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    
    context.lineWidth = 1;
    context.strokeStyle = '#e2e8f0'; // gray-200
    const lineSpacing = 40;
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    
    // reset to drawing style
    context.strokeStyle = '#000010';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  };`;

// Replace the useEffect block
const oldUseEffect = `  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = Math.max(300, container.clientHeight);
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 3;
        context.strokeStyle = '#000000';
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        setCtx(context);
      }
    }
  }, []);`;

const newUseEffect = `${drawBgFunc}

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = Math.max(300, rect.height) * dpr;
      
      canvas.style.width = \`\${rect.width}px\`;
      canvas.style.height = \`\${Math.max(300, rect.height)}px\`;

      const context = canvas.getContext('2d');
      if (context) {
        context.scale(dpr, dpr);
        drawBackground(context, rect.width, Math.max(300, rect.height));
        setCtx(context);
      }
    }
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

// Fix clearCanvas
const oldClear = `  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.beginPath();
    }
  };`;

const newClear = `  const clearCanvas = () => {
    if (ctx && canvasRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      drawBackground(ctx, rect.width, Math.max(300, rect.height));
      ctx.beginPath();
    }
  };`;
  
content = content.replace(oldClear, newClear);

// Fix draw for scaling and thickness
const oldDrawPart1 = `    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust stroke width based on pen pressure if available
    const pressure = e.pointerType === 'pen' ? Math.max(e.pressure, 0.2) : 1;
    ctx.lineWidth = 3 * pressure;`;
    
const newDrawPart1 = `    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust stroke width based on pen pressure if available (slightly thicker for better visibility)
    const pressure = e.pointerType === 'pen' ? Math.max(e.pressure, 0.2) : 1;
    ctx.lineWidth = 2 + (3 * pressure);
    // ensure strokeStyle is drawing color (just in case)
    ctx.strokeStyle = '#0f172a'; // slate-900 for high contrast`;

content = content.replace(oldDrawPart1, newDrawPart1);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

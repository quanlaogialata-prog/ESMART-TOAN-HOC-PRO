import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

const oldDraw = `    // Adjust stroke width based on pen pressure if available (slightly thicker for better visibility)
    const pressure = e.pointerType === 'pen' ? Math.max(e.pressure, 0.2) : 1;
    ctx.lineWidth = 2 + (3 * pressure);
    // ensure strokeStyle is drawing color (just in case)
    ctx.strokeStyle = '#0f172a'; // slate-900 for high contrast`;

const newDraw = `    // Use consistent line width for precise math writing (removes jitter from pressure sensitivity)
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000'; // Pure black for highest contrast`;

content = content.replace(oldDraw, newDraw);

const oldCursor = `cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M12 19l7-7 3 3-7 7-3-3z\\'></path><path d=\\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\\'></path><path d=\\'M2 2l7.586 7.586\\'></path></svg>") 2 22, crosshair'`;
const newCursor = `cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 16 16\\'><circle cx=\\'8\\' cy=\\'8\\' r=\\'3.5\\' fill=\\'black\\' stroke=\\'white\\' stroke-width=\\'1.5\\'/></svg>") 8 8, crosshair'`;

content = content.replace(oldCursor, newCursor);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');

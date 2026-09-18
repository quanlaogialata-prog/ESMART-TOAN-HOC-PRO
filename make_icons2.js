const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.font = \`\${Math.floor(size/2)}px sans-serif\`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TH', size/2, size/2);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
}

makeIcon(192, 'public/pwa-192x192.png');
makeIcon(512, 'public/pwa-512x512.png');
makeIcon(180, 'public/apple-touch-icon.png');

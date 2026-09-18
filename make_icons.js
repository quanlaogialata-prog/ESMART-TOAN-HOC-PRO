const { Jimp } = require('jimp');

async function createIcons() {
  const icon192 = new Jimp({ width: 192, height: 192, color: 0x4f46e5ff });
  await icon192.write('public/pwa-192x192.png');
  
  const icon512 = new Jimp({ width: 512, height: 512, color: 0x4f46e5ff });
  await icon512.write('public/pwa-512x512.png');
  
  const appleIcon = new Jimp({ width: 180, height: 180, color: 0x4f46e5ff });
  await appleIcon.write('public/apple-touch-icon.png');
  console.log("Icons created!");
}

createIcons();

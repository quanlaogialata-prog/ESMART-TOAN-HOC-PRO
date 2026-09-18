import fs from 'fs';

let content = fs.readFileSync('src/main.tsx', 'utf8');

const importStatement = `import { registerSW } from 'virtual:pwa-register';\n`;
const registerCode = `
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically force the update and reload if there is a new version
    updateSW(true);
  },
  onOfflineReady() {}
});
`;

if (!content.includes('virtual:pwa-register')) {
  content = importStatement + content;
  content = content.replace('createRoot', registerCode + 'createRoot');
  fs.writeFileSync('src/main.tsx', content);
}

import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/model: "gemini-3\.6-pro"/, 'model: "gemini-3.6-flash"');
fs.writeFileSync('server.ts', content);

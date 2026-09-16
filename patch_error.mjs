import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(/res\.status\(500\)\.json\(\{ error: "Failed to split document" \}\);/, 'res.status(500).json({ error: "Failed to split document", details: String(error) });');
fs.writeFileSync('server.ts', content);

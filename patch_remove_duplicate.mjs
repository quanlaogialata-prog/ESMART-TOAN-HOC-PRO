import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// The original split endpoint we accidentally duplicated starts around line 439 
// "if (!fileDataUrl)" and goes until the end Vite middleware.
// Let's just regex out the old split-document we injected!

const oldSplitRegex = /      \}[\s]*if \(!fileDataUrl\) \{[\s]*return res\.status\(400\)\.json\(\{ error: "No file data provided\." \}\);[\s\S]*?res\.status\(500\)\.json\(\{ error: "Failed to split document" \}\);\s*\}/;

content = content.replace(oldSplitRegex, '');
fs.writeFileSync('server.ts', content);
console.log("Removed duplicate split");

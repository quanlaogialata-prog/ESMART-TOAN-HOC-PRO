import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// The issue might be that gemini-2.5-flash is not available in the SDK version being used, 
// or there's a strict payload size limit (413 payload too large) if the file is too big.
// But the error says "Failed to extract questions", meaning it hit the catch block. Let's log it.

const regex = /res\.status\(500\)\.json\(\{ error: "Failed to extract questions" \}\);/;
content = content.replace(regex, `console.error("Extract API Error:", error);\n      res.status(500).json({ error: "Failed to extract questions", details: String(error) });`);

fs.writeFileSync('server.ts', content);
console.log("Patched server for debugging");

import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Find the start of app.post("/api/generate-explanations" and the next app.post (if any) or end
const startIndex = content.indexOf('app.post("/api/generate-explanations"');
if (startIndex !== -1) {
  // we can just regex the whole block
  const blockRegex = /app\.post\("\/api\/generate-explanations"[\s\S]*?\}\);\n/g;
  content = content.replace(blockRegex, '');
  fs.writeFileSync('server.ts', content);
  console.log("Removed generate-explanations from server.ts");
}

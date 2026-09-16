import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;
      if (apiKeyHeader) {
         console.log("Using custom API key from client:", apiKeyHeader.substring(0, 10) + "...");
      } else {
         console.log("No custom API key from client, using default.");
      }`;

content = content.replace(/const apiKey = req\.headers\['x-gemini-api-key'\] \|\| process\.env\.GEMINI_API_KEY_CUSTOM \|\| process\.env\.GEMINI_API_KEY;/g, replacement);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts with logging");

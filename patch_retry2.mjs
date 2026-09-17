import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /async function generateContentWithRetry[\s\S]*?\}\n\}/;

const robustRetry = `async function generateContentWithRetry(ai, params, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e) {
      const status = e.status || (e.response && e.response.status);
      
      // Do not retry on 400 Bad Request
      if (status === 400) throw e;
      
      if (i === retries - 1) {
        throw e;
      }
      
      const delay = (i + 1) * 3500; // 3.5s, 7s, 10.5s, 14s
      console.warn(\`API error \${status} (\${e.message}), retrying in \${delay}ms... (Attempt \${i + 1}/\${retries})\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}`;

content = content.replace(regex, robustRetry);
fs.writeFileSync('server.ts', content);

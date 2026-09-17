import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const oldRetry = `async function generateContentWithRetry(ai, params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e) {
      const status = e.status || (e.response && e.response.status) || 500;
      if (i === retries - 1 || (status !== 503 && status !== 429)) {
        throw e;
      }
      console.warn(\`API error \${status}, retrying in \${(i + 1) * 2000}ms... (Attempt \${i + 1}/\${retries})\`);
      await new Promise(r => setTimeout(r, (i + 1) * 2000));
    }
  }
}`;

const newRetry = `async function generateContentWithRetry(ai, params, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e) {
      const errStr = String(e) + " " + JSON.stringify(e);
      const isOverloaded = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('429') || errStr.includes('Quota');
      
      if (i === retries - 1 || !isOverloaded) {
        throw e;
      }
      
      const delay = (i + 1) * 3000;
      console.warn(\`API overloaded (503/429), retrying in \${delay}ms... (Attempt \${i + 1}/\${retries})\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}`;

content = content.replace(oldRetry, newRetry);
fs.writeFileSync('server.ts', content);

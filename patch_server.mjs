import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const retryHelper = `
async function generateContentWithRetry(ai, params, retries = 3) {
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
}
`;

// Insert after imports
content = content.replace(
  'const app = express();',
  retryHelper + '\n  const app = express();'
);

// Update api/extract-questions (around line 273)
content = content.replace(
  /let response;\n      try \{\n        response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);\n      \} catch \(e\) \{\n        response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);\n      \}/,
  `const response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });`
);

// Update api/extract-answers (around line 56)
content = content.replace(
  /let response;\n      try \{\n        response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);\n      \} catch \(e\) \{\n        response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);\n      \}/,
  `const response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });`
);

// Update generate-test 
content = content.replace(
  /response = await ai\.models\.generateContent\(\{\n          model: "gemini-3.6-flash",\n          contents: \[\{ role: "user", parts: \[\{ inlineData: \{ mimeType: mimeType \|\| "application\/pdf", data: base64Data \} \}, \{ text: prompt \}\] \}\]\n        \}\);/g,
  `response = await generateContentWithRetry(ai, {\n          model: "gemini-3.6-flash",\n          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]\n        });`
);

content = content.replace(
  /response = await ai\.models\.generateContent\(\{ model: "gemini-3.6-flash", contents: prompt \}\);/g,
  `response = await generateContentWithRetry(ai, { model: "gemini-3.6-flash", contents: prompt });`
);

// Update grade-essay
content = content.replace(
  /const response = await ai\.models\.generateContent\(\{\n        model: "gemini-3.6-flash",\n        contents: \[\{ role: "user", parts: parts \}\]\n      \}\);/,
  `const response = await generateContentWithRetry(ai, {\n        model: "gemini-3.6-flash",\n        contents: [{ role: "user", parts: parts }]\n      });`
);

fs.writeFileSync('server.ts', content);
console.log('Patched server.ts with retry logic');

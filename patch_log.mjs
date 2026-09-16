import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
const search = `const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;`;
const replace = `const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;
fs.appendFileSync('header_test.log', 'Header: ' + apiKeyHeader + '\\n');`;
content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
fs.writeFileSync('server.ts', content);

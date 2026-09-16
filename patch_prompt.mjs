import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const oldPrompt = '"You are an expert tutor. I will provide an array of questions. Provide a step-by-step explanation (lời giải chi tiết) for each question in Vietnamese. Keep the explanations concise but clear. Use LaTeX format $...$ for math.\\nOutput ONLY a JSON array of objects, where each object has \\"id\\" (the question id) and \\"explanation\\" (the string explanation).\\nDo NOT include markdown formatting like ```json.";';

const newPrompt = '"You are an expert tutor. I will provide an array of questions. Provide a step-by-step explanation (lời giải chi tiết) for each question in Vietnamese. Keep the explanations concise but clear.\\nCRITICAL REQUIREMENT: Any math formulas, equations, or LaTeX commands MUST be wrapped in LaTeX delimiters: use $...$ for inline math and $$...$$ for block math. ALWAYS wrap matrices (e.g. \\\\begin{bmatrix}...\\\\end{bmatrix}) and logical symbols (e.g. \\\\Leftrightarrow) in $ or $$. NEVER output raw LaTeX without $ or $$.\\nOutput ONLY a JSON array of objects, where each object has \\"id\\" (the question id) and \\"explanation\\" (the string explanation).\\nDo NOT include markdown formatting like ```json.";';

content = content.replace(oldPrompt, newPrompt);

fs.writeFileSync('server.ts', content);
console.log('patched prompt');

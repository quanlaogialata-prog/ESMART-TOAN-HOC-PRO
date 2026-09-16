import fs from 'fs';

let content = fs.readFileSync('src/components/MathText.tsx', 'utf8');

// I will just use string replacement
const oldRegexStr = "safeContent = safeContent.replace(/(?<!\\$)\\\\(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)(?!\\$)/g, '$$\\\\$1$$');";

const newRegexStr = "safeContent = safeContent.replace(/(?<!\\$)\\\\(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)(?!\\$)/g, '$$\\\\$1$$');\n\n  // Convert /= to \\neq\n  safeContent = safeContent.replace(/\\/=/g, '\\\\neq');";

content = content.replace(oldRegexStr, newRegexStr);

fs.writeFileSync('src/components/MathText.tsx', content);
console.log('patched MathText neq');

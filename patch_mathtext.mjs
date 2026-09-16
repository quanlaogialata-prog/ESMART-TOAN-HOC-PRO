import fs from 'fs';

let content = fs.readFileSync('src/components/MathText.tsx', 'utf8');

const oldRegex = /safeContent = safeContent\.replace\(\/\\\$\\\$\(\[\\\\s\\\\S\]\*\?\)\\\$\\\$\/g, \(match, inner\) => \{\n    const fixedInner = inner\.replace\(\/ \\\\ \/g, ' \\\\\\\\ '\);\n    return `\\$\\$\\{fixedInner\\}\\$\\$`;\n  \}\);/;

// We can just use string replacement
content = content.replace("const fixedInner = inner.replace(/ \\\\ /g, ' \\\\\\\\ ');", "let fixedInner = inner.replace(/\\n/g, ' '); fixedInner = fixedInner.replace(/ \\\\ /g, ' \\\\\\\\ ');");

fs.writeFileSync('src/components/MathText.tsx', content);
console.log('patched MathText');

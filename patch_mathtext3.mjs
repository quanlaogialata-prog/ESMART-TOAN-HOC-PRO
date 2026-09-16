import fs from 'fs';

let content = fs.readFileSync('src/components/MathText.tsx', 'utf8');

const oldRegexStr = "safeContent = safeContent.replace(/\\$*\\\\begin\\{([a-zA-Z*]+)\\}([\\s\\S]*?)\\\\end\\{\\1\\}\\$*/g, (match, p1, p2) => {\n    return `$$\\\\begin{${p1}}${p2}\\\\end{${p1}}$$`;\n  });";

const newRegexStr = "safeContent = safeContent.replace(/\\$*(\\\\left\\s*(?:\\\\.|.)\\s*\\$*\\s*)?\\\\begin\\{([a-zA-Z*]+)\\}([\\s\\S]*?)\\\\end\\{\\2\\}(\\s*\\$*\\s*\\\\right\\s*(?:\\\\.|.))?\\$*/g, (match, left, env, inner, right) => {\n    let l = left ? left.replace(/\\$/g, '') : '';\n    let r = right ? right.replace(/\\$/g, '') : '';\n    return `$$${l}\\\\begin{${env}}${inner}\\\\end{${env}}${r}$$`;\n  });";

content = content.replace(oldRegexStr, newRegexStr);

fs.writeFileSync('src/components/MathText.tsx', content);
console.log('patched MathText 3');

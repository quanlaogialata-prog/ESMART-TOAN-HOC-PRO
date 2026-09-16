import fs from 'fs';

let content = fs.readFileSync('src/components/MathText.tsx', 'utf8');

// I will just use string split and join to bypass String.prototype.replace special patterns
const oldRegexStr = "safeContent = safeContent.replace(/\\$*(\\\\left\\s*(?:\\\\.|.)\\s*\\$*\\s*)?\\\\begin\\{([a-zA-Z*]+)\\}([\\s\\S]*?)\\\\end\\{\\2\\}(\\s*\\$*\\s*\\\\right\\s*(?:\\\\.|.))?\\$*/g, (match, left, env, inner, right) => {\n    let l = left ? left.replace(/\\$/g, '') : '';\n    let r = right ? right.replace(/\\$/g, '') : '';\n    return `$${l}\\\\begin{${env}}${inner}\\\\end{${env}}${r}$`;\n  });";

const newRegexStr = "safeContent = safeContent.replace(/\\$*(\\\\left\\s*(?:\\\\.|.)\\s*\\$*\\s*)?\\\\begin\\{([a-zA-Z*]+)\\}([\\s\\S]*?)\\\\end\\{\\2\\}(\\s*\\$*\\s*\\\\right\\s*(?:\\\\.|.))?\\$*/g, (match, left, env, inner, right) => {\n    let l = left ? left.replace(/\\$/g, '') : '';\n    let r = right ? right.replace(/\\$/g, '') : '';\n    return `$$\\$\\{l\\}\\\\begin{\\$\\{env\\}}\\$\\{inner\\}\\\\end{\\$\\{env\\}}\\$\\{r\\}$$`;\n  });".replace(/\\\$\\\{/g, '${');

let parts = content.split(oldRegexStr);
if (parts.length === 2) {
  content = parts.join(newRegexStr);
  fs.writeFileSync('src/components/MathText.tsx', content);
  console.log('patched MathText 4');
} else {
  console.log('failed to split');
}

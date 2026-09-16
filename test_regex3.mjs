let str3 = "\\left[ $$\\begin{array}{l} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{array}$$ \\right.";
let regex = /\$*(?:\\left\s*.\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}(?:\s*\\right\s*.)?\$*/g;

console.log(str3.replace(regex, (match) => {
  let inner = match.replace(/^\$+|\$+$/g, '');
  return `$$${inner}$$`;
}));

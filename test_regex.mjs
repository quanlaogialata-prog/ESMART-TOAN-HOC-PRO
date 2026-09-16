let str = "\\left[ \\begin{array}{l} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{array} \\right.";
let str2 = "Ta có: (2x - 1)(x + 3) = 0 \\Leftrightarrow \\left[ \\begin{array}{l} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{array} \\right. \\Leftrightarrow \\left[ \\begin{array}{l} x = \\frac{1}{2} \\\\ x = -3 \\end{array} \\right. Vậy nghiệm của phương trình là x = \\frac{1}{2}; x = -3. Chọn B.";

let regex = /\$*(?:\\left.\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}(?:\s*\\right.)?\$*/g;

console.log(str2.replace(regex, (match) => {
  // We want to capture the whole thing and wrap it in $$
  // Wait, if match already has $$, we strip them and rewrap.
  let inner = match.replace(/^\$+|\$+$/g, '');
  return `$$${inner}$$`;
}));

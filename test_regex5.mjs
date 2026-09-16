let str4 = "Ta có (2x - 1)(x + 3) = 0 \\Leftrightarrow \\left[ $$\\begin{array}{l} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{array}$$ \\right. \\Leftrightarrow \\left[ $$\\begin{array}{l} x = \\frac{1}{2} \\\\ x = -3 \\end{array}$$ \\right. Vậy nghiệm của phương trình là x = \\frac{1}{2}; x = -3. Chọn B.";

let regex = /\$*(?:\\left\s*.\s*\$*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}(?:\s*\$*\s*\\right\s*.)?\$*/g;

console.log(str4.replace(regex, (match) => {
  console.log("MATCHED:", match);
  let inner = match.replace(/\$/g, '');
  return `$$${inner}$$`;
}));

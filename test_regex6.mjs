let str4 = "Ta có (2x - 1)(x + 3) = 0 \\Leftrightarrow \\left[ $$\\begin{array}{l} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{array}$$ \\right. \\Leftrightarrow \\left[ $$\\begin{array}{l} x = \\frac{1}{2} \\\\ x = -3 \\end{array}$$ \\right. Vậy nghiệm của phương trình là x = \\frac{1}{2}; x = -3. Chọn B.";

let regex = /\$*(\\left\s*.\s*\$*\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(\s*\$*\s*\\right\s*.)?\$*/g;

console.log(str4.replace(regex, (match, left, env, inner, right) => {
  let l = left ? left.replace(/\$/g, '') : '';
  let r = right ? right.replace(/\$/g, '') : '';
  return `$$${l}\\begin{${env}}${inner}\\end{${env}}${r}$$`;
}));

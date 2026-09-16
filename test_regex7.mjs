let str = "\\left\\{ \\begin{array}{l} x=1 \\end{array} \\right.";
let regex = /\$*(\\left\s*.\s*\$*\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(\s*\$*\s*\\right\s*.)?\$*/g;

console.log(str.replace(regex, (match, left, env, inner, right) => {
  let l = left ? left.replace(/\$/g, '') : '';
  let r = right ? right.replace(/\$/g, '') : '';
  return `$$${l}\\begin{${env}}${inner}\\end{${env}}${r}$$`;
}));

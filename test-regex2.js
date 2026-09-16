const str = "A. \\begin{cases} 3x - 2y = 5 \\ \\sqrt{x} - 2\\sqrt{y} = 1 \\end{cases}";

// Wrap begin/end in $$
let out = str.replace(/(?<!\$)\\(begin\{[a-zA-Z*]+\})([\s\S]*?)\\(end\{[a-zA-Z*]+\})(?!\$)/g, (match, p1, p2, p3) => {
  // Fix single backslash for newlines
  let inner = p2.replace(/ \\ /g, ' \\\\ ');
  return `$$\\${p1}${inner}\\${p3}$$`;
});
console.log(out);

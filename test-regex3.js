const str1 = "A. \\begin{cases} 3x - 2y = 5 \\ \\sqrt{x} - 2\\sqrt{y} = 1 \\end{cases}";
const str2 = "B. $$\\begin{cases} 3x - 2y = 5 \\ \\sqrt{x} - 2\\sqrt{y} = 1 \\end{cases}$$";
const str3 = "C. $x \\ y$ and $$\\begin{cases} x \\ y \\end{cases}$$";

function preprocessMath(text) {
  let result = text || "";
  
  // 1. Wrap unwrapped \begin{...} ... \end{...} in $$
  // Negative lookbehinds/lookaheads to ensure it's not already preceded/followed by $
  result = result.replace(/(?<!\$)\\(begin\{[a-zA-Z*]+\})([\s\S]*?)\\(end\{[a-zA-Z*]+\})(?!\$)/g, (match, p1, p2, p3) => {
    return `$$\\${p1}${p2}\\${p3}$$`;
  });

  // 2. Fix ` \ ` to ` \\ ` inside all $$...$$ blocks
  // This is a bit tricky with regex, we can use a replacer function on all $$...$$ blocks
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
    // Replace ` \ ` with ` \\ `
    const fixedInner = inner.replace(/ \\ /g, ' \\\\ ');
    return `$$${fixedInner}$$`;
  });

  return result;
}

console.log(preprocessMath(str1));
console.log(preprocessMath(str2));
console.log(preprocessMath(str3));

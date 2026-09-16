let content = "a) Vì đồ thị hàm số y = ax + b đi qua A(1; -1) và B(4; 5) nên ta có hệ phương trình: \\left\\{ \\begin{array}{l} a(1)+b=-1 \\\\ a(4)+b=5 \\end{array} \\right. Leftrightarrow \\left\\{ \\begin{array}{l} a+b=-1 \\\\ 4a+b=5 \\end{array} \\right. Leftrightarrow \\left\\{ \\begin{array}{l} 3a=6 \\\\ b=-1-a \\end{array} \\right. \n2x + 2 /= 0\\Leftrightarrowx /= -1\n1\\Rightarrow-4a+3\nTừ (*) và (**) suy ra:";

let safeContent = content || "";

// 1. Normalize all \begin{...} ... \end{...} blocks to be wrapped exactly in $$...$$
safeContent = safeContent.replace(/\$*(\\left\s*(?:\\.|.)\s*\$*\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(\s*\$*\s*\\right\s*(?:\\.|.))?\$*/g, (match, left, env, inner, right) => {
  let l = left ? left.replace(/\$/g, '') : '';
  let r = right ? right.replace(/\$/g, '') : '';
  return `$$${l}\\begin{${env}}${inner}\\end{${env}}${r}$$`;
});

// 2. Process text and math blocks separately
let parts = safeContent.split(/(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?(?<!\$)\$)/);

for (let i = 0; i < parts.length; i++) {
  if (i % 2 === 0) {
    // Plain text block
    parts[i] = parts[i].replace(/\\?(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)/g, ' $\\\\$1 $ ');
    parts[i] = parts[i].replace(/\/\=/g, ' $\\neq$ ');
    parts[i] = parts[i].replace(/\(\*\)/g, '(&#42;)');
    parts[i] = parts[i].replace(/\(\*\*\)/g, '(&#42;&#42;)');
  } else {
    // Math block
    parts[i] = parts[i].replace(/(?<!\\)(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)/g, '\\$1');
    parts[i] = parts[i].replace(/\/\=/g, '\\neq ');
    if (parts[i].startsWith('$$')) {
      let inner = parts[i].slice(2, -2);
      inner = inner.replace(/\n/g, ' '); 
      inner = inner.replace(/ \\ /g, ' \\\\ ');
      parts[i] = `$$${inner}$$`;
    }
  }
}

safeContent = parts.join('');
console.log(safeContent);

import katex from 'katex';
try {
  let html = katex.renderToString("\\begin{bmatrix} 2x - 1 = 0 \\ x + 3 = 0 \\end{bmatrix}", { throwOnError: true });
  console.log("OK:", html);
} catch(e) {
  console.log("Error1:", e.message);
}

try {
  let html = katex.renderToString("\\begin{bmatrix} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{bmatrix}", { throwOnError: true });
  console.log("OK2:", html);
} catch(e) {
  console.log("Error2:", e.message);
}

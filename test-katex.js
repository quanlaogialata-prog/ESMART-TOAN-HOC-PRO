import katex from 'katex';

try {
  console.log(katex.renderToString("\\begin{cases} x \\\\ y \\end{cases}"));
} catch (e) {
  console.log("Error 1", e.message);
}

try {
  console.log(katex.renderToString("\\begin{cases} x \\ y \\end{cases}"));
} catch (e) {
  console.log("Error 2", e.message);
}

import katex from 'katex';
try {
  let html = katex.renderToString("1\\Rightarrow-4a+3", { throwOnError: true });
  console.log("OK glued");
} catch(e) {
  console.log("Error glued:", e.message);
}

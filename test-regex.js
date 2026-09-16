const str = "Câu 4: Trong các cặp số (2; 1); (-2; 1), cặp số nào là nghiệm của hệ phương trình \\begin{cases} x - 2y = 4 \\ x + 2y = 0 \\end{cases}?";

let out = str.replace(/\\begin\{.*?\}.*?\\end\{.*?\}/g, match => {
  return `$$${match}$$`;
});
console.log(out);

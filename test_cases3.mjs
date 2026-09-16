import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { renderToString } from 'react-dom/server';

let content = "a) Đồ thị hàm số y = ax + b đi qua điểm A(1; -1) và B(4; 5) nên ta có hệ phương trình: \\begin{cases} a(1) + b = -1 \\\\ a(4) + b = 5 \\end{cases} \\Leftrightarrow $$\\begin{cases} a + b = -1 \\\\ 4a + b = 5 \\end{cases} Trừ từng vế";

let safeContent = content || "";

safeContent = safeContent.replace(/\$*\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}\$*/g, (match, p1, p2) => {
  return `$$\\begin{${p1}}${p2}\\end{${p1}}$$`;
});

// Also fix some common symbols if unwrapped
safeContent = safeContent.replace(/(?<!\$)\\(Leftrightarrow|Rightarrow|Leftarrow|Rightarrow|rightarrow|leftarrow)(?!\$)/g, '$\\\\$1$');

safeContent = safeContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
  let fixedInner = inner.replace(/\n/g, ' '); 
  fixedInner = fixedInner.replace(/ \\ /g, ' \\\\ ');
  return `$$${fixedInner}$$`;
});
  
console.log("safeContent:", safeContent);
  
const ele = React.createElement(ReactMarkdown, {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex]
}, safeContent);
  
console.log(renderToString(ele));

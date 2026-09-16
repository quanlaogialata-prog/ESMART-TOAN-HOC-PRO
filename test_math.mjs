import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { renderToString } from 'react-dom/server';

let content = "Ta có (2x - 1)(x + 3) = 0 \\Leftrightarrow $$\\begin{bmatrix} 2x - 1 = 0 \\\\ x + 3 = 0 \\end{bmatrix}$$ \\Leftrightarrow \\begin{bmatrix} x = \\frac{1}{2} \\\\ x = -3 \\end{bmatrix}. Vậy nghiệm của phương trình là x = \\frac{1}{2}; x = -3. Chọn B.";

let safeContent = content || "";
  
  // 1. Wrap unwrapped \begin{...} ... \end{...} in $$
  safeContent = safeContent.replace(/(?<!\$)\\(begin\{[a-zA-Z*]+\})([\s\S]*?)\\(end\{[a-zA-Z*]+\})(?!\$)/g, (match, p1, p2, p3) => {
    return `$$\\${p1}${p2}\\${p3}$$`;
  });
  // 2. Fix ` \ ` to ` \\ ` inside all $$...$$ blocks
  safeContent = safeContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
    const fixedInner = inner.replace(/ \\ /g, ' \\\\ ');
    return `$$${fixedInner}$$`;
  });
  
  console.log("safeContent:", safeContent);
  
  const ele = React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }, safeContent);
  
  console.log(renderToString(ele));

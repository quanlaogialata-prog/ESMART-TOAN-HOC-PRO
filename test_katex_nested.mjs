import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { renderToString } from 'react-dom/server';

let safeContent = "$$ 1 $\\Rightarrow$ 2 $$";
let ele = React.createElement(ReactMarkdown, {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex]
}, safeContent);

try {
  console.log(renderToString(ele));
} catch (e) {
  console.log("Error:", e.message);
}

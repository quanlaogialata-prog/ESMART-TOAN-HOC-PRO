import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  content: string;
}

export default function MathText({ content }: MathTextProps) {
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

  return (
    <span className="katex-wrapper">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({node, ...props}) => <span {...props} />
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </span>
  );
}

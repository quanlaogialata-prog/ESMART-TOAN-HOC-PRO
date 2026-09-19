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
  
  // 1. Repair any previously corrupted overrightarrow / overleftarrow artifacts
  // (e.g., \over\rightarrow{AB}, \over \rightarrow{AB}, \over $\rightarrow $ {AB})
  safeContent = safeContent.replace(/\\over\s*\\rightarrow\s*\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\\leftarrow\s*\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\$\s*\\rightarrow\s*\$\s*\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\$\s*\\leftarrow\s*\$\s*\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\\rightarrow/g, "\\overrightarrow");
  safeContent = safeContent.replace(/\\over\s*\\leftarrow/g, "\\overleftarrow");

  // 2. Normalize all \begin{...} ... \end{...} blocks to be wrapped exactly in $$...$$
  safeContent = safeContent.replace(/\$*(\\left\s*(?:\\.|.)\s*\$*\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(\s*\$*\s*\\right\s*(?:\\.|.))?\$*/g, (_match, left, env, inner, right) => {
    let l = left ? left.replace(/\$/g, '') : '';
    let r = right ? right.replace(/\$/g, '') : '';
    return `$$${l}\\begin{${env}}${inner}\\end{${env}}${r}$$`;
  });

  // 3. Process text and math blocks separately
  let parts = safeContent.split(/(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?(?<!\$)\$)/);
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Plain text block
      // A. Wrap unwrapped vector and math commands into $...$ so KaTeX can render them properly
      parts[i] = parts[i].replace(/\\overrightarrow\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
      parts[i] = parts[i].replace(/\\overleftarrow\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
      parts[i] = parts[i].replace(/\\vec\{([^}]+)\}/g, (_m, p1) => `$\\vec{${p1}}$`);
      parts[i] = parts[i].replace(/\\widehat\{([^}]+)\}/g, (_m, p1) => `$\\widehat{${p1}}$`);

      // B. Wrap unwrapped degree symbols (e.g. 90^\circ, 45^\circ)
      parts[i] = parts[i].replace(/\b(\d+(?:\.\d+)?)\s*\^\s*\\circ\b/g, (_m, p1) => `$${p1}^\\circ$`);

      // C. Wrap unwrapped fractions and square roots
      parts[i] = parts[i].replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, p1, p2) => `$\\frac{${p1}}{${p2}}$`);
      parts[i] = parts[i].replace(/\\sqrt\{([^{}]+)\}/g, (_m, p1) => `$\\sqrt{${p1}}$`);

      // D. Wrap standalone math operators if in plain text
      parts[i] = parts[i].replace(/\\cdot/g, " $\\cdot$ ");
      parts[i] = parts[i].replace(/\\parallel/g, " $\\parallel$ ");
      parts[i] = parts[i].replace(/\\perp/g, " $\\perp$ ");

      // E. Standalone arrow words (ONLY if isolated, NOT part of \overrightarrow, \longrightarrow, etc.)
      parts[i] = parts[i].replace(/(?<![a-zA-Z\\])(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)\b/g, (_m, p1) => ` $\\${p1}$ `);
      parts[i] = parts[i].replace(/\/\=/g, ' $\\neq$ ');
      parts[i] = parts[i].replace(/\(\*\)/g, '(&#42;)');
      parts[i] = parts[i].replace(/\(\*\*\)/g, '(&#42;&#42;)');
    } else {
      // Math block ($...$ or $$...$$)
      // Repair any remaining \over\rightarrow corruptions
      parts[i] = parts[i].replace(/\\over\s*\\rightarrow/g, "\\overrightarrow");
      parts[i] = parts[i].replace(/\\over\s*\\leftarrow/g, "\\overleftarrow");

      // Only standalone arrow words NOT preceded by letters or backslash
      parts[i] = parts[i].replace(/(?<![a-zA-Z\\])(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)\b/g, '\\$1');
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

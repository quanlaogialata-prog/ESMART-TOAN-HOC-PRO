import fs from 'fs';

let content = fs.readFileSync('src/components/MathText.tsx', 'utf8');

const newCode = `
export default function MathText({ content }: MathTextProps) {
  let safeContent = content || "";
  
  // 1. Normalize all \\begin{...} ... \\end{...} blocks to be wrapped exactly in $$...$$
  // First, strip existing $ or $$ around them to avoid nested or unbalanced $
  safeContent = safeContent.replace(/\\$*\\\\begin\\{([a-zA-Z*]+)\\}([\\s\\S]*?)\\\\end\\{\\1\\}\\$*/g, (match, p1, p2) => {
    return \`$$\\\\begin{\${p1}}\${p2}\\\\end{\${p1}}$$\`;
  });

  // 2. Wrap standalone math arrows if they are not already in math mode
  safeContent = safeContent.replace(/(?<!\\$)\\\\(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)(?!\\$)/g, '$\\\\$1$');

  // 3. Fix newlines and escaping inside all $$...$$ and $...$ blocks
  // JSON unescaping often turns \\\\ into \\ which breaks LaTeX multiline commands like cases
  safeContent = safeContent.replace(/\\$\\$([\\s\\S]*?)\\$\\$/g, (match, inner) => {
    let fixedInner = inner.replace(/\\n/g, ' '); 
    fixedInner = fixedInner.replace(/ \\\\ /g, ' \\\\\\\\ ');
    return \`$$\${fixedInner}$$\`;
  });
  
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
`;

content = content.replace(/export default function MathText\(\{ content \}: MathTextProps\) \{[\s\S]*?\}\n/g, newCode);

fs.writeFileSync('src/components/MathText.tsx', content);
console.log('patched MathText again');

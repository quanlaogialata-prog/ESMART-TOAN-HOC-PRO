import fs from 'fs';

let text = fs.readFileSync('lesson_E8ndBqOkH5DyQIyVUo06_before.txt', 'utf8');

export function perfectRepair(raw: string): string {
  if (!raw) return '';
  let t = raw;

  // 1. MathType PUA and special characters
  t = t.replace(/[\uF03D]/g, ' = ');
  t = t.replace(/[\uF03E]/g, ' > ');
  t = t.replace(/[\uF03C]/g, ' < ');
  t = t.replace(/[\uF028]/g, '(');
  t = t.replace(/[\uF029]/g, ')');
  t = t.replace(/[\uF02D]/g, '-');
  t = t.replace(/[\uF0B9]/g, ' \\neq ');
  t = t.replace(/[\uF0DB]/g, ' \\Leftrightarrow ');
  t = t.replace(/[\uF0DE]/g, ' \\Rightarrow ');
  t = t.replace(/[\uF0CE]/g, ' \\in ');
  t = t.replace(/[\uF0A5]/g, ' \\infty ');
  t = t.replace(/[\uF0A3]/g, ' \\le ');
  t = t.replace(/[\uF0B3]/g, ' \\ge ');
  t = t.replace(/[\uF02B]/g, ' \\pm ');
  t = t.replace(/[\uF0B4]/g, ' \\times ');

  // 2. Corrupted Vietnamese words
  t = t.replace(/\b([bB]ài|[dD]ạng|[mM]ôn|[tT]ổ)\s+tốn\b/gi, '$1 toán');
  t = t.replace(/\b([bB]ÀI|[dD]ẠNG|[mM]ÔN|[tT]Ổ)\s+TỐN\b/g, '$1 TOÁN');
  t = t.replace(/\bTỐN\b/g, 'TOÁN');
  t = t.replace(/\btốn\b/g, 'toán');
  t = t.replace(/\bbảo\s+tòn\b/gi, 'bảo toàn');
  t = t.replace(/\bBẢO\s+TÒN\b/g, 'BẢO TOÀN');
  t = t.replace(/\bHoa\s+và\s+Tòn\b/g, 'Hoa và Toàn');
  t = t.replace(/\bsố\s+bi\s+của\s+Tòn\b/g, 'số bi của Toàn');
  t = t.replace(/\bviên\s+bi\s+của\s+Tòn\b/g, 'viên bi của Toàn');
  t = t.replace(/\bđớnh\s+kốm\b/gi, 'đính kèm');
  t = t.replace(/\btrọng\s+tõm\b/gi, 'trọng tâm');
  t = t.replace(/\bcụng\s+thức\b/gi, 'công thức');
  t = t.replace(/\bCỏc\s+dạng\b/g, 'Các dạng');
  t = t.replace(/\bcỏc\s+dạng\b/gi, 'các dạng');
  t = t.replace(/\bđiển\s+hỡnh\b/gi, 'điển hình');
  t = t.replace(/\bPhương\s+phỏp\b/g, 'Phương pháp');
  t = t.replace(/\bphương\s+phỏp\b/gi, 'phương pháp');
  t = t.replace(/\bvớ\s+dụ\b/gi, 'ví dụ');
  t = t.replace(/\bTR[ềỀeE]N\b/g, 'TRÒN');
  t = t.replace(/\btr[ềỀ]n\b/g, 'tròn');

  // 3. Fix unclosed / misplaced dollar equations in text BEFORE tokenization:
  // e.g. "a + b = 2$\quad (1)$" -> "$a + b = 2 \quad (1)$"
  t = t.replace(/(?<![\$\w])([a-zA-Z0-9\+\-\s]+=\s*[\+\-]?[0-9a-zA-Z]+)\$(\s*\\quad\s*\(\d+\))/g, '$$$1$2$$');
  t = t.replace(/(?<![\$\w])([a-zA-Z0-9\+\-\s]+=\s*[\+\-]?[0-9a-zA-Z]+)\$/g, '$$$1$$');
  t = t.replace(/Nên\s*\$([A-Z]\([0-9;\s\+\-]+\))\s*\./g, 'Nên $$$1$$.');

  // Pairs like "A(1; 2) $ và $ B(-2; 5)" -> "$A(1; 2)$ và $B(-2; 5)$"
  t = t.replace(/([A-Z]\([0-9;\s\+\-]+\))\s*\$\s*và\s*\$\s*([A-Z]\([0-9;\s\+\-]+\))/g, '$$$1$$ và $$$2$$');
  t = t.replace(/\b([a-zA-Z])\s*\$\s*và\s*\$\s*([a-zA-Z])\b/g, '$$$1$$ và $$$2$$');

  // Fix dollars stuck in equations like "5x + $ay = b$" -> "$5x + ay = b$"
  t = t.replace(/([0-9]+)\.([a-zA-Z])/g, '$1$2');
  t = t.replace(/(?<=[0-9a-zA-Z])\s*([+\-])\s*\$([0-9]*[a-zA-Z])/g, ' $1 $2');
  t = t.replace(/([+\-])\s*\$([0-9]*[a-zA-Z])/g, '$1 $2');
  t = t.replace(/\$([a-zA-Z]\s*=\s*[0-9a-zA-Z\+\-\*\/]+)\$\s*([+\-]\s*[0-9a-zA-Z]+)/g, '$$$1 $2$$');
  t = t.replace(/(?<![\$\w])([0-9]*[a-zA-Z]\s*[+\-]\s*[0-9]*[a-zA-Z]\s*=\s*[\+\-]?[0-9a-zA-Z]+)(?![\$\w])/g, '$$$1$$');

  // Strip $ inside LaTeX command braces
  t = t.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_m, inner) => {
    let cleanInner = inner.replace(/(?<!\\)\$/g, '').trim();
    return '\\begin{cases} ' + cleanInner + ' \\end{cases}';
  });
  t = t.replace(/\\(?:d|t)?frac\{([^{}]+)\}\$?\{([^{}]+)\}\$?\$?/g, (_m, num, den) => {
    return `\\dfrac{${num.replace(/(?<!\\)\$/g, '').trim()}}{${den.replace(/(?<!\\)\$/g, '').trim()}}`;
  });
  t = t.replace(/\{\s*\$([^{}]+?)\$\s*\}/g, '{$1}');
  t = t.replace(/\{\s*\$([^{}]+?)\s*\}/g, '{$1}');
  t = t.replace(/\$\{(\d+)\}\$/g, '{$1}');
  t = t.replace(/\{(\d+)\}\$/g, '{$1}');
  t = t.replace(/\$\{(\d+)\}/g, '{$1}');

  // Lone dollar before single-letter variable: "(với $m là tham số)" -> "(với $m$ là tham số)"
  t = t.replace(/(?<=\s|^|\()\s*\$([a-zA-Z])(?=\s+[a-zA-ZÀ-ỹ])/g, '$$$1$$');

  // Multi-line cases { eq1 \n { eq2
  t = t.replace(
    /(?:^|\n)\s*\{\s*([^\n{}]+)\s*\n\s*\{\s*([^\n{}]+)(?:\s*\n\s*\{\s*([^\n{}]+))?(?:\s*\((?:I|II|III|\d+)\))?/g,
    (_m, eq1, eq2, eq3, label) => {
      let inner = eq1.trim() + ' \\\\ ' + eq2.trim();
      if (eq3) inner += ' \\\\ ' + eq3.trim();
      const tag = label ? ' \\quad ' + label : '';
      return `\n\n$$\\begin{cases} ${inner} \\end{cases}${tag}$$\n\n`;
    }
  );

  // Inline cases { eq1 ; eq2 }
  t = t.replace(
    /(?<![\$\w])\{\s*([a-zA-Z0-9_\+\-\*\/\^=><\s\(\)]+?)\s*;\s*([a-zA-Z0-9_\+\-\*\/\^=><\s\(\)]+?)(?:\s*;\s*([a-zA-Z0-9_\+\-\*\/\^=><\s\(\)]+?))?\s*\}(?![\$\w])/g,
    (_m, eq1, eq2, eq3) => {
      let inner = eq1.trim() + ' \\\\ ' + eq2.trim();
      if (eq3) inner += ' \\\\ ' + eq3.trim();
      return `$\\begin{cases} ${inner} \\end{cases}$`;
    }
  );

  // Separate line headers
  t = t.replace(/([^\n])\s*(\*\*(?:Ví\s*dụ\s*\d+\.?|Bài\s*\d+\.?|Câu\s*\d+:?|Dạng\s*\d+\.?)\*\*|Ví\s*dụ\s*\d+\.|Bài\s*\d+\.|Câu\s*\d+:|Dạng\s*\d+\.)/g, '$1\n\n$2');
  t = t.replace(/([^\n])\s*(\*\*Lời giải\*\*|Lời giải:|\*\*Hướng dẫn giải\*\*|Hướng dẫn giải:)/g, '$1\n\n$2\n\n');
  t = t.replace(/([^\n])\s*([1-9]\))\s*/g, '$1\n\n$2 ');
  t = t.replace(/([^\n])\s*(Vậy\s+(?:\$|\\\$|[a-zA-ZÀ-ỹ]))/g, '$1\n\n$2');
  t = t.replace(/([^\n])\s*(\b[a-d]\))\s*/g, '$1\n\n$2 ');

  // Ratio equations in Ví dụ 3:
  t = t.replace(
    /\$?\\dfrac\{a\}\{a'\}\$?\s*(?:\\neq|≠|\$\\neq\$)\s*\$?\\dfrac\{b\}\{b'\}\$?\s*(?:\\text\{\s*hay\s*\}|hay|\$hay\$)\s*\$?\\dfrac\{2\}\{1\}\$?\s*(?:\\neq|≠|\$\\neq\$)\s*\$?\\dfrac\{-m\}\{1\}\$?\s*(?:\\Leftrightarrow|<=>|\$\\Leftrightarrow\$)\s*(?:\$?m\s*(?:\\neq|≠|\$\\neq\$)\s*[\+\-]?\d+\$?)/gi,
    '$$\\dfrac{a}{a\'} \\neq \\dfrac{b}{b\'} \\text{ hay } \\dfrac{2}{1} \\neq \\dfrac{-m}{1} \\Leftrightarrow m \\neq -2$$'
  );
  t = t.replace(
    /\$?\\dfrac\{a\}\{a'\}\$?\s*=\s*\$?\\dfrac\{b\}\{b'\}\$?\s*=\s*\$?\\dfrac\{c\}\{c'\}\$?\s*(?:\\text\{\s*hay\s*\}|hay|\$hay\$)\s*\$?\\dfrac\{2\}\{1\}\$?\s*=\s*\$?\\dfrac\{-m\}\{1\}\$?\s*=\s*\$?\\dfrac\{m\^2\}\{2\}\$?/gi,
    '$$\\dfrac{a}{a\'} = \\dfrac{b}{b\'} = \\dfrac{c}{c\'} \\text{ hay } \\dfrac{2}{1} = \\dfrac{-m}{1} = \\dfrac{m^2}{2}$$'
  );
  t = t.replace(
    /(?:\\begin\{cases\}|\$\$\\begin\{cases\})\s*\\dfrac\{2\}\{1\}[\s\S]*?\\end\{cases\}\$\$?\s*(?:\\Leftrightarrow|\$\\Leftrightarrow\$)\s*\$*\\begin\{cases\}\s*-m\s*=\s*2[\s\S]*?\\end\{cases\}\$\$?\s*(?:\\Leftrightarrow|\$\\Leftrightarrow\$)\s*\$*\\begin\{cases\}\s*m\s*=\s*-2[\s\S]*?\\end\{cases\}\$\$?\s*(?:\\Leftrightarrow|\$\\Leftrightarrow\$)\s*\$?m\s*=\s*-2\$?/gi,
    '$$\\begin{cases} \\dfrac{2}{1} = \\dfrac{-m}{1} \\\\ \\dfrac{2}{1} = \\dfrac{m^2}{2} \\end{cases} \\Leftrightarrow \\begin{cases} -m = 2 \\\\ m^2 = 4 \\end{cases} \\Leftrightarrow \\begin{cases} m = -2 \\\\ m = \\pm 2 \\end{cases} \\Leftrightarrow m = -2$$'
  );

  // Clean operator collisions
  t = t.replace(/\$\s*\\neq\s*\$/g, ' \\neq ');
  t = t.replace(/\$\s*=\s*\$/g, ' = ');
  t = t.replace(/\$\s*\\pm\s*\$/g, ' \\pm ');
  t = t.replace(/\$\s*\\Leftrightarrow\s*\$/g, ' \\Leftrightarrow ');
  t = t.replace(/\$\s*\\Rightarrow\s*\$/g, ' \\Rightarrow ');
  t = t.replace(/(?:\$*)\b([a-zA-Z])(?:\$*)\s*(?:\\neq|≠)\s*(?:\$*)\s*([\+\-]?[0-9a-zA-Z]+)(?:\$*)/g, '$$$1 \\neq $2$$');
  t = t.replace(/(?:\$*)\b([a-zA-Z])(?:\$*)\s*=\s*(?:\$*)\s*([\+\-]?[0-9a-zA-Z]+)(?:\$*)/g, '$$$1 = $2$$');
  t = t.replace(/(?<![\$\w])([a-zA-Z]\s*(?:\\neq|≠|=|<|>)\s*[\+\-]?[0-9a-zA-Z]+)\$/g, '$$$1$$');
  t = t.replace(/\$\$\s*([a-zA-Z0-9_\+\-\=\s]+?)\s*\$(?!\$)/g, '$$$1$$');
  t = t.replace(/(?<!\$)\$\s*([a-zA-Z0-9_\+\-\=\(\);\s]+?)\s*\$\$/g, '$$$1$$');

  // Wrap all un-delimited cases in $$...$$
  t = t.replace(/(?<!\$\$)(?<!\$)\\begin\{cases\}([\s\S]*?)\\end\{cases\}(?!\$)/g, (_m, inner) => {
    return `\n\n$$\\begin{cases} ${inner.trim()} \\end{cases}$$\n\n`;
  });

  // Clean dollars
  t = t.replace(/\${3,}/g, '$$');
  t = t.replace(/\$\s+\$/g, ' ');
  t = t.replace(/[ \t]{2,}/g, ' ');

  return t.trim();
}

const cleaned = perfectRepair(text);
const idx = cleaned.indexOf('Ví dụ 3');
console.log('=== VÍ DỤ 3 ===\n');
console.log(cleaned.slice(idx, idx + 1000));

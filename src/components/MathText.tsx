import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { healMathSvg, cleanHtmlAndSvgContainers, formatMathExpressions, formatCasesBlock, repairVietnameseDocument } from '../lib/vietnameseFont';

interface MathTextProps {
  content: string;
  isDocument?: boolean;
  className?: string;
}

// Kiểm tra xem chuỗi có chứa từ ngữ hoặc ký tự tiếng Việt không
function hasVietnamese(str: string): boolean {
  return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/i.test(str)
    || /\b(cho|ham|so|va|la|khi|neu|thi|tren|khoang|tap|nghiem|do|thi|phuong|trinh|he|toa|trong|khong|gian|mat|phang|duong|thang|goc|tam|giac|hinh|chop|lang|tru|the|tich|dien|tich|chu|vi|day|so|cap|nhan|cong|dao|ham|nguyen|tich|phan|xac|suat|thong|ke|gia|tri|lon|nhat|nho|bien|thien|dong|nghich|tiem|can|dung|ngang|cuc|dai|tieu|menh|de|khang|dinh|cau|hoi|dung|sai|dap|an|loi|giai)\b/i.test(str);
}

// Kiểm tra xem một chuỗi có phải biểu thức toán thuần túy (cần bọc trong $...$)
function isPureMathString(str: string): boolean {
  let trimmed = str.trim();
  if (!trimmed) return false;
  trimmed = trimmed.replace(/[–—−]/g, '-');
  if (hasVietnamese(trimmed)) return false;

  // Chứa lũy thừa: 3x^2 - 3, x^2, 2^x
  if (/\^/.test(trimmed)) return true;
  // Chứa chỉ số dưới: u_2, u_3 = 7, x_1
  if (/_[0-9a-zA-Z]/.test(trimmed)) return true;
  // Chứa dấu bằng hoặc bất đẳng thức / đạo hàm: u_2 = 3, y = 2x - 1, f'(x) = 0, x > 0
  if (/=|(?<![a-zA-Z])<|>(?![a-zA-Z])|f'\(|y'/.test(trimmed)) return true;
  // Chứa lệnh LaTeX: \frac, \dfrac, \tfrac, \sqrt, \vec, \overrightarrow...
  if (/\\((?:d|t)?frac|sqrt|vec|begin|cases|matrix|aligned|overrightarrow|overleftarrow|infty|alpha|beta|gamma|cdot|pi|pm|approx|neq|le|ge|leq|geq|times|div)/.test(trimmed)) return true;
  // Khoảng/đoạn: (-1; 2), [0; +\infty)
  if (/^[\(\[][\s\S]*;[\s\S]*[\)\]]$/.test(trimmed)) return true;
  // Biểu thức đại số ngắn gồm biến số và toán tử: e.g. "3x - 1", "2x + y", "-x + 4"
  if (/^[+\-]?[0-9a-zA-Z\s+\-*/()]+$/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && /[+\-*/]/.test(trimmed)) {
    return true;
  }

  return false;
}

export default function MathText({ content, isDocument = false, className = '' }: MathTextProps) {
  let safeContent = content || "";

  // 0. Sửa phông chữ tiếng Việt (TCVN3 / .VnTime, VNI Windows) và ký hiệu toán học
  safeContent = repairVietnameseDocument(safeContent);

  // 0.1 Dọn dẹp sạch sẽ các thẻ HTML rác <div align="center">, <center>, </div>
  safeContent = cleanHtmlAndSvgContainers(safeContent);

  // 0.1. Tách và bảo vệ tuyệt đối các khối vector SVG khỏi regex công thức toán
  const svgBlocks: string[] = [];
  safeContent = safeContent.replace(/(<svg\b[\s\S]*?<\/svg>)/gi, (_m, svg) => {
    const healed = healMathSvg(svg);
    svgBlocks.push(healed);
    return `\n\n___MATH_SVG_BLOCK_${svgBlocks.length - 1}___\n\n`;
  });

  // 0.2. Chạy bộ tiền xử lý chuẩn hóa ký hiệu toán & sửa lỗi MathType (\undefined, ngắt dòng cases, etc.)
  safeContent = formatMathExpressions(safeContent);
  
  // 1. Sửa chữa các lỗi artifact ký hiệu vectơ bị gãy
  safeContent = safeContent.replace(/\\over\s*\\rightarrow\s*\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\\leftarrow\s*\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\$\s*\\rightarrow\s*\$\s*\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\$\s*\\leftarrow\s*\$\s*\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
  safeContent = safeContent.replace(/\\over\s*\\rightarrow/g, "\\overrightarrow");
  safeContent = safeContent.replace(/\\over\s*\\leftarrow/g, "\\overleftarrow");

  // 2. Sửa lỗi dấu $ không cân xứng (Unbalanced dollars)
  // Ví dụ chuỗi kết thúc bằng $. hoặc $ nhưng thiếu $ ở đầu: "u_2 = 3$." hoặc "u_3 = 7$"
  if (!safeContent.includes('$$')) {
    const singleDollarCount = (safeContent.match(/(?<!\\)\$/g) || []).length;
    if (singleDollarCount % 2 !== 0) {
      if (/^[^\$]+\$\.?\s*$/.test(safeContent)) {
        // Toàn bộ chuỗi chỉ có 1 dấu $ ở gần cuối: "u_2 = 3$." -> "$u_2 = 3$"
        safeContent = safeContent.replace(/^([^\$]+)\$\.?\s*$/, (_m, p1) => `$${p1.trim()}$`);
      } else if (/^\$[^\$]+$/.test(safeContent)) {
        // Chuỗi chỉ có 1 dấu $ ở đầu: "$u_2 = 3" -> "$u_2 = 3$"
        safeContent = safeContent.replace(/^\$([^\$]+)$/, (_m, p1) => `$${p1.trim()}$`);
      }
    }
  }

  // 3. Nếu toàn bộ chuỗi không có dấu $ nào nhưng là một biểu thức toán học rõ rệt (ví dụ: "3x^2 - 3", "u_2 = 3")
  if (!safeContent.includes('$') && isPureMathString(safeContent)) {
    safeContent = `$${safeContent.trim()}$`;
  }

  // 4. Chuẩn hóa khối ma trận / hệ phương trình \begin{...} ... \end{...}
  // Hấp thụ toàn bộ các dấu $ bao quanh, loại bỏ $ lạc trong ruột và bảo toàn cấu trúc inline cho các lựa chọn trắc nghiệm
  safeContent = safeContent.replace(
    /(?:\$*(\\left\s*(?:\\.|.)\s*))?(\${1,2}\s*)?(\\left\s*(?:\\.|.)\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\4\}(\s*\\right\s*(?:\\.|.))?(\s*\${1,2})?(?:\s*(\\right\s*(?:\\.|.))\$*)?/g,
    (match, left1, openDollar, left2, env, inner, right1, closeDollar, right2) => {
      let l = (left1 || left2 || '').replace(/\$/g, '').trim();
      let r = (right1 || right2 || '').replace(/\$/g, '').trim();
      let fixedInner = formatCasesBlock(inner.replace(/(?<!\\)\$/g, ''));
      
      let body = `\\begin{${env}} ${fixedInner} \\end{${env}}`;
      if (l || r) {
        body = `${l} ${body} ${r}`.trim();
      }

      const isDouble = (openDollar && openDollar.includes('$$')) || (closeDollar && closeDollar.includes('$$')) || match.includes('$$');
      if (isDouble && isDocument) {
        return `\n\n$$${body}$$\n\n`;
      }
      if (isDouble) {
        return `$$${body}$$`;
      }
      return `$${body}$`;
    }
  );

  // 5. Tách và xử lý riêng biệt các khối văn bản thuần và khối công thức toán
  let parts = safeContent.split(/(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?(?<!\$)\$)/);
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Khối văn bản thường (Plain text block)
      // Chuẩn hóa dấu gạch ngang trước ký hiệu toán
      parts[i] = parts[i].replace(/[–—−](?=\s*\\)/g, '-');
      parts[i] = parts[i].replace(/[–—−](?=\s*[0-9])/g, '-');

      // A. Tự động bọc các lệnh vectơ, cung tròn chưa có $
      parts[i] = parts[i].replace(/\\(overgroup|overparen|wideparen|arc)\{([^}]+)\}/g, (_m, _cmd, p1) => `$\\overgroup{${p1}}$`);
      parts[i] = parts[i].replace(/\\overrightarrow\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
      parts[i] = parts[i].replace(/\\overleftarrow\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
      parts[i] = parts[i].replace(/\\vec\{([^}]+)\}/g, (_m, p1) => `$\\vec{${p1}}$`);
      parts[i] = parts[i].replace(/\\widehat\{([^}]+)\}/g, (_m, p1) => `$\\widehat{${p1}}$`);

      // B. Ký hiệu góc và độ: 90^\circ, 45^\circ
      parts[i] = parts[i].replace(/\b(\d+(?:\.\d+)?)\s*\^\s*\\circ\b/g, (_m, p1) => `$${p1}^\\circ$`);

      // C. Phân số và căn bậc hai: \frac, \dfrac, \tfrac, \sqrt (kèm dấu +/- nếu có)
      parts[i] = parts[i].replace(/(?<![\$\\\w])([+\-]?\s*\\(?:d|t)?frac\{[^{}]+\}\{[^{}]+\})/g, (_m, frac) => `$${frac.trim()}$`);
      parts[i] = parts[i].replace(/(?<![\$\\\w])(\\sqrt\{[^{}]+\})/g, (_m, sqrt) => `$${sqrt.trim()}$`);

      // D. Toán tử hình học & dấu nhân: \cdot, \parallel, \perp
      parts[i] = parts[i].replace(/\\cdot/g, " $\\cdot$ ");
      parts[i] = parts[i].replace(/\\parallel/g, " $\\parallel$ ");
      parts[i] = parts[i].replace(/\\perp/g, " $\\perp$ ");

      // E. Ký hiệu mũi tên BBT và các ký hiệu toán phổ biến: \nearrow, \searrow, \infty, \leq, \geq, \le, \ge...
      parts[i] = parts[i].replace(/\\(nearrow|searrow|uparrow|downarrow|infty|pm|mp|leq|geq|le|ge|in|notin|subset|supset|cup|cap|emptyset|approx|equiv|forall|exists|alpha|beta|gamma|theta|pi|Delta|lambda|sigma|omega|Omega|times|div|neq)\b/g, (_m, p1) => `$\\${p1}$`);

      // F. Tự động nhận diện đa thức chứa lũy thừa chưa có $ trong văn bản (ví dụ: 3x^2 - 3, 3x^2 + 3, x^2 - 3, 3x^2)
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([0-9]*[a-zA-Z\)]\s*\^\s*\{?[0-9a-zA-Z\+\-]+\}?(?:\s*[+\-]\s*[0-9a-zA-Z]+)*)(?![a-zA-Z0-9\$\^])/g, '$$$1$$');

      // G. Tự động nhận diện dãy số / chỉ số dưới chứa dấu bằng chưa có $ (ví dụ: u_2 = 3, u_3 = 7, u_n = 2n + 1)
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([a-zA-Z])_([0-9a-zA-Z]+)(\s*=\s*[0-9a-zA-Z\+\-\*\/]+)?(?![a-zA-Z0-9\$_])/g, (_m, p1, p2, p3) => `$${p1}_${p2}${p3 || ''}$`);

      // H. Tự động nhận diện khoảng đoạn toán học (ví dụ: (-1; 2), [0; 3], (-\infty; 1))
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([\(\[][\+\-]?(?:\d+|\\infty)\s*;\s*[\+\-]?(?:\d+|\\infty)[\)\]])/g, '$$$1$$');

      // I. Mũi tên suy ra / tương đương dạng ký hiệu hoặc chữ
      parts[i] = parts[i].replace(/\\?(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|Longleftrightarrow|Longrightarrow)\b/g, (_m, p1) => ` $\\${p1}$ `);
      parts[i] = parts[i].replace(/\/\=/g, ' $\\neq$ ');
      parts[i] = parts[i].replace(/\(\*\)/g, '(&#42;)');
      parts[i] = parts[i].replace(/\(\*\*\)/g, '(&#42;&#42;)');
    } else {
      // Khối công thức toán ($...$ hoặc $$...$$)
      parts[i] = parts[i].replace(/\\over\s*\\rightarrow/g, "\\overrightarrow");
      parts[i] = parts[i].replace(/\\over\s*\\leftarrow/g, "\\overleftarrow");
      parts[i] = parts[i].replace(/(?<![a-zA-Z\\])(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)\b/g, '\\$1');
      parts[i] = parts[i].replace(/\/\=/g, '\\neq ');
      if (parts[i].startsWith('$$') && parts[i].endsWith('$$')) {
        let inner = parts[i].slice(2, -2).replace(/(?<!\\)\$/g, '');
        inner = inner.replace(/\n/g, ' '); 
        inner = inner.replace(/ \\ /g, ' \\\\ ');
        parts[i] = `$$${inner}$$`;
      } else if (parts[i].startsWith('$') && parts[i].endsWith('$')) {
        let inner = parts[i].slice(1, -1).replace(/(?<!\\)\$/g, '');
        parts[i] = `$${inner}$`;
      }
    }
  }
  
  safeContent = parts.join('');

  // 6. Khôi phục các khối SVG vào Markdown code block
  safeContent = safeContent.replace(/___MATH_SVG_BLOCK_(\d+)___/g, (_m, idx) => {
    const svgCode = svgBlocks[Number(idx)] || '';
    return `\n\n\`\`\`svg\n${svgCode}\n\`\`\`\n\n`;
  });

  // Xóa bỏ các thẻ </div> trôi dạt còn sót lại
  safeContent = safeContent.replace(/(?:^|\n)\s*<\/div>\s*(?:\n|$)/gi, '\n');

  if (isDocument) {
    return (
      <div className={`katex-document font-sans text-gray-800 leading-relaxed ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-bold text-blue-900 mt-6 mb-3 pb-2.5 border-b-2 border-blue-100 flex items-center gap-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-bold text-indigo-900 mt-5 mb-2.5 pb-1 border-b border-indigo-100/70" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2 flex items-center gap-1.5" {...props} />,
            h4: ({node, ...props}) => <h4 className="text-sm md:text-base font-semibold text-gray-800 mt-3 mb-1.5" {...props} />,
            p: ({node, ...props}) => <p className="mb-3.5 leading-relaxed text-gray-800 text-[14.5px]" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-gray-800 text-[14.5px]" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-gray-800 text-[14.5px]" {...props} />,
            li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
            blockquote: ({node, children, ...props}) => {
              return (
                <blockquote className="border-l-4 border-blue-500 bg-blue-50/70 p-3.5 md:p-4 my-3.5 rounded-r-xl text-gray-800 text-[14px] leading-relaxed shadow-2xs" {...props}>
                  {children}
                </blockquote>
              );
            },
            strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
            em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
            hr: () => <hr className="my-5 border-gray-200" />,
            code: ({node, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeStr = String(children || '').trim();
              if (match?.[1] === 'svg' || codeStr.startsWith('<svg')) {
                const healedSvg = healMathSvg(codeStr);
                return (
                  <div className="my-5 p-4 md:p-6 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center transition-all">
                    <div 
                      className="w-full max-w-lg mx-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-84 flex items-center justify-center drop-shadow-2xs"
                      dangerouslySetInnerHTML={{ __html: healedSvg }} 
                    />
                    <div className="mt-2.5 text-[12px] font-medium text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>Hình vẽ / Đồ thị minh họa chuẩn</span>
                    </div>
                  </div>
                );
              }
              return <code className="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
            },
            table: ({node, ...props}) => <div className="overflow-x-auto my-4 shadow-2xs rounded-xl border border-gray-200"><table className="min-w-full border-collapse text-sm rounded-lg overflow-hidden" {...props} /></div>,
            th: ({node, ...props}) => <th className="border border-gray-200 bg-slate-100 px-3.5 py-2.5 font-bold text-center text-gray-900" {...props} />,
            td: ({node, ...props}) => <td className="border border-gray-200 px-3.5 py-2.5 text-center text-gray-800 bg-white" {...props} />
          }}
        >
          {safeContent}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <span className={`katex-wrapper ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          p: ({node, ...props}) => <span {...props} />
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </span>
  );
}

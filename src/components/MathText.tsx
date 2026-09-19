import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  content: string;
}

// Kiểm tra xem chuỗi có chứa từ ngữ hoặc ký tự tiếng Việt không
function hasVietnamese(str: string): boolean {
  return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/i.test(str)
    || /\b(cho|ham|so|va|la|khi|neu|thi|tren|khoang|tap|nghiem|do|thi|phuong|trinh|he|toa|trong|khong|gian|mat|phang|duong|thang|goc|tam|giac|hinh|chop|lang|tru|the|tich|dien|tich|chu|vi|day|so|cap|nhan|cong|dao|ham|nguyen|tich|phan|xac|suat|thong|ke|gia|tri|lon|nhat|nho|bien|thien|dong|nghich|tiem|can|dung|ngang|cuc|dai|tieu|menh|de|khang|dinh|cau|hoi|dung|sai|dap|an|loi|giai)\b/i.test(str);
}

// Kiểm tra xem một chuỗi có phải biểu thức toán thuần túy (cần bọc trong $...$)
function isPureMathString(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (hasVietnamese(trimmed)) return false;

  // Chứa lũy thừa: 3x^2 - 3, x^2, 2^x
  if (/\^/.test(trimmed)) return true;
  // Chứa chỉ số dưới: u_2, u_3 = 7, x_1
  if (/_[0-9a-zA-Z]/.test(trimmed)) return true;
  // Chứa dấu bằng hoặc bất đẳng thức / đạo hàm: u_2 = 3, y = 2x - 1, f'(x) = 0, x > 0
  if (/=|(?<![a-zA-Z])<|>(?![a-zA-Z])|f'\(|y'/.test(trimmed)) return true;
  // Chứa lệnh LaTeX: \frac, \sqrt, \vec, \overrightarrow...
  if (/\\(frac|sqrt|vec|overrightarrow|overleftarrow|infty|alpha|beta|gamma|cdot|pi|pm|approx|neq|le|ge|leq|geq|times|div)/.test(trimmed)) return true;
  // Khoảng/đoạn: (-1; 2), [0; +\infty)
  if (/^[\(\[][\s\S]*;[\s\S]*[\)\]]$/.test(trimmed)) return true;
  // Biểu thức đại số ngắn gồm biến số và toán tử: e.g. "3x - 1", "2x + y", "-x + 4"
  if (/^[+\-]?[0-9a-zA-Z\s+\-*/()]+$/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && /[+\-*/]/.test(trimmed)) {
    return true;
  }

  return false;
}

export default function MathText({ content }: MathTextProps) {
  let safeContent = content || "";
  
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

  // 4. Chuẩn hóa khối ma trận / hệ phương trình \begin{...} ... \end{...} về $$...$$
  safeContent = safeContent.replace(/\$*(\\left\s*(?:\\.|.)\s*\$*\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(\s*\$*\s*\\right\s*(?:\\.|.))?\$*/g, (_match, left, env, inner, right) => {
    let l = left ? left.replace(/\$/g, '') : '';
    let r = right ? right.replace(/\$/g, '') : '';
    return `$$${l}\\begin{${env}}${inner}\\end{${env}}${r}$$`;
  });

  // 5. Tách và xử lý riêng biệt các khối văn bản thuần và khối công thức toán
  let parts = safeContent.split(/(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?(?<!\$)\$)/);
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Khối văn bản thường (Plain text block)
      // A. Tự động bọc các lệnh vectơ chưa có $
      parts[i] = parts[i].replace(/\\overrightarrow\{([^}]+)\}/g, (_m, p1) => `$\\overrightarrow{${p1}}$`);
      parts[i] = parts[i].replace(/\\overleftarrow\{([^}]+)\}/g, (_m, p1) => `$\\overleftarrow{${p1}}$`);
      parts[i] = parts[i].replace(/\\vec\{([^}]+)\}/g, (_m, p1) => `$\\vec{${p1}}$`);
      parts[i] = parts[i].replace(/\\widehat\{([^}]+)\}/g, (_m, p1) => `$\\widehat{${p1}}$`);

      // B. Ký hiệu góc và độ: 90^\circ, 45^\circ
      parts[i] = parts[i].replace(/\b(\d+(?:\.\d+)?)\s*\^\s*\\circ\b/g, (_m, p1) => `$${p1}^\\circ$`);

      // C. Phân số và căn bậc hai: \frac, \sqrt
      parts[i] = parts[i].replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, p1, p2) => `$\\frac{${p1}}{${p2}}$`);
      parts[i] = parts[i].replace(/\\sqrt\{([^{}]+)\}/g, (_m, p1) => `$\\sqrt{${p1}}$`);

      // D. Toán tử hình học & dấu nhân: \cdot, \parallel, \perp
      parts[i] = parts[i].replace(/\\cdot/g, " $\\cdot$ ");
      parts[i] = parts[i].replace(/\\parallel/g, " $\\parallel$ ");
      parts[i] = parts[i].replace(/\\perp/g, " $\\perp$ ");

      // E. Ký hiệu mũi tên BBT và các ký hiệu toán phổ biến: \nearrow, \searrow, \infty, \leq, \geq, \le, \ge...
      parts[i] = parts[i].replace(/\\(nearrow|searrow|uparrow|downarrow|infty|pm|mp|leq|geq|le|ge|in|notin|subset|supset|cup|cap|emptyset|approx|equiv|forall|exists|alpha|beta|gamma|theta|pi|Delta|lambda|sigma|omega|Omega|times|div|neq)\b/g, (_m, p1) => `$\\${p1}$`);

      // F. Tự động nhận diện đa thức chứa lũy thừa chưa có $ trong văn bản (ví dụ: 3x^2 - 3, 3x^2 + 3, x^2 - 3, 3x^2)
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([0-9]*[a-zA-Z\)]\s*\^\s*\{?[0-9a-zA-Z\+\-]+\}?(?:\s*[+\-]\s*[0-9a-zA-Z]+)*)(?![a-zA-Z0-9\$\^])/g, '$$$1$$');

      // G. Tự động nhận diện dãy số / chỉ số dưới chứa dấu bằng chưa có $ (ví dụ: u_2 = 3, u_3 = 7, u_n = 2n + 1)
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([a-zA-Z])_([0-9a-zA-Z]+)(?:\s*=\s*[0-9a-zA-Z\+\-\*\/]+)?(?![a-zA-Z0-9\$_])/g, '$$$1_$2$3$$');

      // H. Tự động nhận diện khoảng đoạn toán học (ví dụ: (-1; 2), [0; 3], (-\infty; 1))
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([\(\[][\+\-]?(?:\d+|\\infty)\s*;\s*[\+\-]?(?:\d+|\\infty)[\)\]])/g, '$$$1$$');

      // I. Mũi tên suy ra / tương đương dạng chữ
      parts[i] = parts[i].replace(/(?<![a-zA-Z\\])(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)\b/g, (_m, p1) => ` $\\${p1}$ `);
      parts[i] = parts[i].replace(/\/\=/g, ' $\\neq$ ');
      parts[i] = parts[i].replace(/\(\*\)/g, '(&#42;)');
      parts[i] = parts[i].replace(/\(\*\*\)/g, '(&#42;&#42;)');
    } else {
      // Khối công thức toán ($...$ hoặc $$...$$)
      parts[i] = parts[i].replace(/\\over\s*\\rightarrow/g, "\\overrightarrow");
      parts[i] = parts[i].replace(/\\over\s*\\leftarrow/g, "\\overleftarrow");
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

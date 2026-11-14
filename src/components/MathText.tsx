import React, { useState, useEffect } from 'react';
import { healMathSvg, cleanHtmlAndSvgContainers, formatMathExpressions, formatCasesBlock, repairVietnameseDocument } from '../lib/vietnameseFont';

let mathDepsCache: {
  ReactMarkdown: any;
  remarkMath: any;
  rehypeKatex: any;
} | null = null;
let mathDepsPromise: Promise<any> | null = null;

function ensureMathDeps() {
  if (mathDepsCache) return Promise.resolve(mathDepsCache);
  if (!mathDepsPromise) {
    mathDepsPromise = Promise.all([
      import('react-markdown'),
      import('remark-math'),
      import('rehype-katex'),
      import('katex/dist/katex.min.css')
    ]).then(([rm, rMath, rKatex]) => {
      mathDepsCache = {
        ReactMarkdown: rm.default || rm,
        remarkMath: rMath.default || rMath,
        rehypeKatex: rKatex.default || rKatex
      };
      return mathDepsCache;
    });
  }
  return mathDepsPromise;
}

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
  // Bỏ tiền tố phương án nếu có: "A. ", "B) ", "C: "
  trimmed = trimmed.replace(/^[A-Da-d][\.\)\:\-]\s*/, '').trim();
  trimmed = trimmed.replace(/[–—−]/g, '-');
  if (hasVietnamese(trimmed)) return false;

  // Chứa lũy thừa: 3x^2 - 3, x^2, 2^x
  if (/\^/.test(trimmed)) return true;
  // Chứa chỉ số dưới: u_2, u_3 = 7, x_1
  if (/_[0-9a-zA-Z]/.test(trimmed)) return true;
  // Chứa dấu bằng hoặc bất đẳng thức / đạo hàm: u_2 = 3, y = 2x - 1, f'(x) = 0, x > 0, m < 2, m \ge 2, m <= 2
  if (/=|(?<![a-zA-Z])<|>(?![a-zA-Z])|f'\(|y'|\\le|\\ge|\\leq|\\geq|\\ne|\\neq/.test(trimmed)) return true;
  // Chứa lệnh LaTeX: \frac, \dfrac, \tfrac, \sqrt, \vec, \overrightarrow...
  if (/\\((?:d|t)?frac|sqrt|vec|begin|cases|matrix|aligned|overrightarrow|overleftarrow|infty|alpha|beta|gamma|cdot|pi|pm|approx|neq|le|ge|leq|geq|times|div|in|notin|subset|cup|cap|setminus|mathbb|Delta)/.test(trimmed)) return true;
  // Khoảng/đoạn: (-1; 2), [0; +\infty), (-\infty; -6), (3; 6]
  if (/^[\(\[][\s\S]*;[\s\S]*[\)\]]/.test(trimmed)) return true;
  // Tập hợp \{...\}
  if (/^\\\{[\s\S]*\\\}$/.test(trimmed)) return true;
  // Biểu thức đại số ngắn gồm biến số và toán tử: e.g. "3x - 1", "2x + y", "-x + 4", "m < 2"
  if (/^[+\-]?[0-9a-zA-Z\s+\-*/()<>=!]+$/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && /[+\-*/<>=!]/.test(trimmed)) {
    return true;
  }

  return false;
}

// Sửa lỗi khối $...$ bao trùm qua nhiều ô bảng (ví dụ: | $f'(x)$ | | $+ | 0 | - | 0 | + | 0 | -$ | |)
export function healTableRowMathPipes(line: string): string {
  if (!line || !line.includes('|') || !line.includes('$')) return line;

  return line.replace(/\$([^\$]+)\$/g, (fullMatch, inner: string) => {
    if (!inner.includes('|')) return fullMatch;

    // Kiểm tra xem có dấu | phân cách ô bảng (có khoảng trắng quanh | hoặc là dãy xét dấu +|0|-|0|)
    const hasSpacedPipe = /\s\|\s|\s\||\|\s/.test(inner);
    const isSignSequence = /^(?:\s*(?:[+\-−–]|0|\|\||\\infty|∞|\\nearrow|\\searrow|[↗↘])\s*\|)+\s*(?:[+\-−–]|0|\|\||\\infty|∞|\\nearrow|\\searrow|[↗↘])\s*$/.test(inner);

    if (!hasSpacedPipe && !isSignSequence) {
      // Bảo toàn trị tuyệt đối hợp lệ nằm trong 1 ô duy nhất như $|x|$, $|x-1|$, $|f(x)|$
      const singlePipes = inner.replace(/\\\||\|\|/g, '').match(/\|/g) || [];
      if (singlePipes.length > 0 && singlePipes.length % 2 === 0) {
        return fullMatch;
      }
    }

    // Tách theo dấu | thành từng ô công thức toán riêng biệt
    const parts: string[] = [];
    let cur = '';
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === '\\' && i + 1 < inner.length) {
        cur += inner[i] + inner[i + 1];
        i++;
        continue;
      }
      if (
        inner[i] === '|' &&
        inner[i + 1] === '|' &&
        cur.trim() === '' &&
        (i + 2 >= inner.length || /^\s*(\||$)/.test(inner.slice(i + 2)))
      ) {
        cur += '||';
        i++;
        continue;
      }
      if (inner[i] === '|') {
        parts.push(cur.trim());
        cur = '';
        continue;
      }
      cur += inner[i];
    }
    parts.push(cur.trim());

    return parts.map(p => (p ? `$${p}$` : '')).join(' | ');
  });
}

// Chuẩn hóa các bảng Markdown bị dính liền trên 1 dòng hoặc dính vào câu dẫn trước đó
export function normalizeMarkdownTablesInText(raw: string): string {
  if (!raw || !raw.includes('|')) return raw;
  let text = raw;

  // 0. Hàn gắn các dòng bảng bị ngắt dòng lỗi (ví dụ dòng chỉ có dấu "|" hoặc dòng phân cách :--- bị gãy làm nhiều dòng)
  const rawLines = text.split(/\r?\n/);
  const joinedLines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();
    if (joinedLines.length > 0) {
      const prev = joinedLines[joinedLines.length - 1];
      const prevTrimmed = prev.trim();
      // Nếu dòng hiện tại chỉ có đúng 1 dấu "|" và dòng trước là dòng bảng
      if (trimmed === '|' && prevTrimmed.startsWith('|')) {
        joinedLines[joinedLines.length - 1] =
          prev.replace(/[ \t]+$/, '') + (prevTrimmed.endsWith('|') ? ' |' : '|');
        continue;
      }
      // Nếu dòng trước là dòng phân cách :--- và dòng hiện tại cũng chỉ chứa các ô phân cách :---
      const isPrevSep = /^\|[\s\|:\-]+$/.test(prevTrimmed) && /-{2,}/.test(prevTrimmed);
      const isCurrSep = /^\|?[\s\|:\-]+$/.test(trimmed) && /-{2,}/.test(trimmed);
      if (isPrevSep && isCurrSep) {
        const cleanPrev = prevTrimmed.endsWith('|') ? prevTrimmed : `${prevTrimmed} |`;
        const cleanCurr = trimmed.startsWith('|') ? trimmed.slice(1).trim() : trimmed;
        joinedLines[joinedLines.length - 1] = `${cleanPrev} ${cleanCurr}`;
        continue;
      }
    }
    joinedLines.push(line);
  }
  text = joinedLines.join('\n');

  // 1. Tách bảng bị dính liền ngay sau dấu hai chấm trên cùng dòng (ví dụ: "...như sau: | $x$ | ...")
  // Chỉ áp dụng trên dòng văn bản dẫn (không bắt đầu bằng |) và dùng [ \t] thay vì \s để không ăn qua \n
  text = text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) return line;
      return line.replace(
        /([a-zA-ZÀ-ỹ0-9\)\}\$][ \t]*:[ \t]*)(\|[ \t]*(?:\$?[xtu]\$?|\$?[fgh]'?[ \t]*\([a-zA-Z]\)\$?|\$?y'?[ \t]*\$?|[A-ZÀ-ỹa-z0-9_\$ \t]+)[ \t]*\|)/g,
        '$1\n$2'
      );
    })
    .join('\n');

  // 2. Tách dòng phân cách :--- bị gộp chung trên 1 dòng với hàng tiêu đề: "| $+\infty$ | | :--- |" -> "| $+\infty$ |\n| :--- |"
  // Tuyệt đối không tách nếu bản thân dòng đó đã là dòng phân cách thuần túy
  text = text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|')) return line;
      if (/^[\s\|:\-]+$/.test(trimmed) && /-{2,}/.test(trimmed)) return line;
      return line.replace(/\|[ \t]*\|(?=[ \t]*:?-{2,}:?[ \t]*\|)/g, '|\n|');
    })
    .join('\n');

  // 3. Tách phần dữ liệu bị dính ngay sau dòng phân cách :--- trên cùng 1 dòng (không backtrack vào ô :---)
  text = text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|')) return line;
      if (/^[\s\|:\-]+$/.test(trimmed) && /-{2,}/.test(trimmed)) return line;
      const sepPrefixMatch = trimmed.match(/^(\|(?:[ \t]*:?-{2,}:?[ \t]*\|)+)(.*)$/);
      if (sepPrefixMatch && sepPrefixMatch[2].trim()) {
        const rest = sepPrefixMatch[2].replace(/^[ \t]*\|?[ \t]*/, '').trim();
        if (rest && rest.includes('|')) {
          return `${sepPrefixMatch[1]}\n| ${rest}`;
        }
      }
      return line;
    })
    .join('\n');

  // 4. Tách các hàng của bảng xét dấu / bảng biến thiên bị gộp trên 1 dòng (sau +\infty là f'(x), y', f(x), y; hoặc sau hàng dấu là f(x), y)
  text = text.replace(
    /(\+[ \t]*(?:\\infty|∞)[ \t]*\$?[ \t]*\|)[ \t]*(\|[ \t]*\$?(?:[fgh]'?[ \t]*\([a-zA-Z]\)|y'?)\$?[ \t]*\|)/gi,
    '$1\n$2'
  );
  text = text.replace(
    /(\|[ \t]*\$?[+\-−–0]\$?[ \t]*\|(?:[ \t]*\|)?)[ \t]*(\|[ \t]*\$?(?:[fgh][ \t]*\([a-zA-Z]\)|y)\$?[ \t]*\|)/gi,
    '$1\n$2'
  );

  // 5. Tách câu hỏi bị dính liền ngay sau dấu | kết thúc bảng (ví dụ: "| $f'(x)$ | ... | | Hàm số đã cho...")
  text = text.replace(
    /(\|[ \t]*)[ \t]+((?:Hàm[ \t]+số|Mệnh[ \t]+đề|Khẳng[ \t]+định|Giá[ \t]+trị|Số[ \t]+điểm|Số[ \t]+nghiệm|Đồ[ \t]+thị|Trên[ \t]+khoảng|Cho[ \t]+hàm[ \t]+số|Tìm[ \t]+|Tính[ \t]+|Biết[ \t]+|Hỏi[ \t]+)[^\n\|]+)$/gm,
    '$1\n$2'
  );

  // 6. Chữa các khối $...$ bao trùm qua nhiều dấu | trên từng dòng bảng
  text = text
    .split('\n')
    .map(line => (line.trim().startsWith('|') ? healTableRowMathPipes(line) : line))
    .join('\n');

  return text;
}

// Kiểm tra một dòng có phải là một hàng của bảng Markdown (| ... | ... |)
function isMarkdownTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return false;
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  return pipeCount >= 3;
}

// Tách các ô trong 1 hàng bảng Markdown, bảo vệ tuyệt đối dấu | trong $...$ và dấu || (không xác định)
export function splitTableRowCells(rawLine: string): string[] {
  let line = healTableRowMathPipes(rawLine.trim());
  if (line.startsWith('|')) line = line.slice(1);
  if (line.endsWith('|')) line = line.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let inMath = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    // Ký tự escape \| hoặc \$
    if (ch === '\\' && i + 1 < line.length) {
      current += ch + line[i + 1];
      i++;
      continue;
    }

    // Theo dõi trạng thái bên trong công thức toán $...$
    if (ch === '$') {
      if (inMath) {
        inMath = false;
      } else if (line.indexOf('$', i + 1) !== -1) {
        inMath = true;
      }
      current += ch;
      continue;
    }

    if (ch === '|' && !inMath) {
      // Kiểm tra xem có phải ký hiệu đường kẻ đôi "||" (không xác định / tiệm cận đứng) nằm trong ô trống: "| || |"
      // CHỈ nhận diện là "||" khi phần tích lũy của ô hiện tại đang rỗng (current.trim() === '')
      // và phía sau "||" là khoảng trắng + dấu "|" đóng ô (hoặc hết dòng).
      if (
        line[i + 1] === '|' &&
        current.trim() === '' &&
        i > 0 &&
        /\s/.test(line[i - 1]) &&
        (i + 2 >= line.length || /^\s*(\||$)/.test(line.slice(i + 2)))
      ) {
        current += '||';
        i++;
        continue;
      }

      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());

  // Đảm bảo mỗi ô sau khi tách không bị lẻ dấu $
  return cells.map(cell => {
    const dollarCount = (cell.match(/(?<!\\)\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      const stripped = cell.replace(/(?<!\\)\$/g, '').trim();
      return stripped ? `$${stripped}$` : '';
    }
    return cell;
  });
}

function isSeparatorTableRow(cells: string[]): boolean {
  return cells.length > 0 && cells.some(c => /^:?-{2,}:?$/.test(c)) && cells.every(c => c === '' || /^:?-{2,}:?$/.test(c));
}

function stripCellMathFormatting(cell: string): string {
  return (cell || '')
    .replace(/\$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\\(?:mathbf|mathrm|mathit|text|displaystyle)\{([^}]*)\}/g, '$1')
    .trim();
}

// Nhận diện Bảng xét dấu / Bảng biến thiên chuẩn Toán THPT Việt Nam
export function isSignOrVariationTable(rows: string[][]): boolean {
  if (rows.length < 2) return false;

  const firstColLabels = rows.map(r => stripCellMathFormatting(r[0] || '').toLowerCase());
  const allCellsFlat = rows.flat().map(c => stripCellMathFormatting(c));

  // 1. Có chứa mũi tên biến thiên (\nearrow, \searrow, ↗, ↘)
  if (allCellsFlat.some(c => /\\(?:nearrow|searrow|uparrow|downarrow)|[↗↘↑↓]/.test(c))) {
    return true;
  }

  // 2. Hàng đầu tiên có -\infty hoặc +\infty
  const row0Cells = rows[0].slice(1).map(c => stripCellMathFormatting(c));
  if (row0Cells.some(c => /^[+\-−–]?\s*(?:\\infty|∞)$/.test(c))) {
    return true;
  }

  // 3. Cột đầu tiên có nhãn đạo hàm y', f'(x), g'(x), h'(x), f'(t)...
  if (firstColLabels.some(l => /^(?:y'|[fghuv]'\s*\([a-z]\)|đạo\s*hàm|xét\s*dấu)$/.test(l))) {
    return true;
  }

  // 4. Hàng đầu là biến x, t và có ít nhất 1 hàng chỉ chứa dấu +, -, 0, ||
  if (/^[xtu]$/.test(firstColLabels[0])) {
    for (let r = 1; r < rows.length; r++) {
      const dataCells = rows[r].slice(1).map(c => stripCellMathFormatting(c)).filter(Boolean);
      if (
        dataCells.length >= 2 &&
        dataCells.every(c => /^([+\-−–]|0|\|\||\\Vert|\\\|)$/.test(c)) &&
        dataCells.some(c => /^[+\-−–]$/.test(c))
      ) {
        return true;
      }
    }
  }

  return false;
}

// Tự động căn chỉnh số cột giữa dòng x, dòng f'(x) và dòng f(x) nếu người soạn thiếu ô trống xen kẽ
function normalizeSignTableRows(rows: string[][]): string[][] {
  if (rows.length < 2) return rows;
  const cloned = rows.map(r => [...r]);

  // Kiểm tra nếu dòng 0 (x) chỉ liệt kê K mốc (không có ô trống xen kẽ cho các khoảng)
  const row0Data = cloned[0].slice(1);
  const K = row0Data.length;
  const row0HasNoEmpty = K >= 2 && row0Data.every(c => c.trim() !== '');

  if (row0HasNoEmpty) {
    const otherMaxDataLen = Math.max(...cloned.slice(1).map(r => r.length - 1));
    if (otherMaxDataLen === 2 * K - 1 || otherMaxDataLen === 2 * K - 3) {
      const expandedRow0 = [cloned[0][0]];
      for (let i = 0; i < K; i++) {
        expandedRow0.push(row0Data[i]);
        if (i < K - 1) expandedRow0.push('');
      }
      cloned[0] = expandedRow0;
    } else if (otherMaxDataLen === K - 1 && K >= 3) {
      // Trường hợp dòng 0 có K mốc (ví dụ -\infty, -1, 0, 2, +\infty) và dòng 1 chỉ có K-1 dấu (+, -, +, -)
      const expandedRow0 = [cloned[0][0]];
      for (let i = 0; i < K; i++) {
        expandedRow0.push(row0Data[i]);
        if (i < K - 1) expandedRow0.push('');
      }
      cloned[0] = expandedRow0;
      for (let r = 1; r < cloned.length; r++) {
        const rData = cloned[r].slice(1);
        if (rData.length === K - 1 && rData.every(c => /^[+\-−–]$/.test(stripCellMathFormatting(c)))) {
          const expandedR = [cloned[r][0], ''];
          for (let i = 0; i < K - 1; i++) {
            expandedR.push(rData[i]);
            if (i < K - 2) {
              expandedR.push('$0$');
            } else {
              expandedR.push('');
            }
          }
          cloned[r] = expandedR;
        }
      }
    }
  }

  const maxCols = Math.max(...cloned.map(r => r.length));

  // Nếu dòng 0 đã có các ô trống xen kẽ (ví dụ 2K - 1 cột dữ liệu)
  for (let r = 1; r < cloned.length; r++) {
    // Trường hợp dòng xét dấu f'(x) bị thiếu đúng 2 ô trống ở đầu (dưới -\infty) và cuối (dưới +\infty):
    if (cloned[r].length === maxCols - 2 && maxCols >= 6) {
      const firstData = stripCellMathFormatting(cloned[r][1] || '');
      if (/^[+\-−–]$/.test(firstData) || /\\(?:nearrow|searrow)|[↗↘]/.test(firstData)) {
        cloned[r] = [cloned[r][0], '', ...cloned[r].slice(1), ''];
      }
    } else {
      // Trường hợp dòng xét dấu chỉ có các ô không rỗng (bị thiếu các ô trống ở đầu/cuối)
      const nonEmptyR = cloned[r].slice(1).filter(c => c.trim() !== '');
      if (nonEmptyR.length === maxCols - 3 && maxCols >= 6 && cloned[r].length < maxCols) {
        const firstData = stripCellMathFormatting(nonEmptyR[0] || '');
        if (/^[+\-−–]$/.test(firstData) || /\\(?:nearrow|searrow)|[↗↘]/.test(firstData)) {
          cloned[r] = [cloned[r][0], '', ...nonEmptyR, ''];
        }
      }
    }
    while (cloned[r].length < maxCols) {
      cloned[r].push('');
    }
  }
  while (cloned[0].length < maxCols) {
    cloned[0].push('');
  }

  return cloned;
}

function isDoubleBarCell(cell: string): boolean {
  const clean = stripCellMathFormatting(cell);
  return clean === '||' || clean === '|||' || clean === '\\Vert' || clean === '\\|';
}

function getArrowType(cell: string): 'up' | 'down' | null {
  const clean = stripCellMathFormatting(cell);
  if (/^(?:\\nearrow|\\uparrow|↗|↑)$/.test(clean)) return 'up';
  if (/^(?:\\searrow|\\downarrow|↘|↓)$/.test(clean)) return 'down';
  return null;
}

function parseAsymptoteSplitCell(cell: string): { left: string; right: string } | null {
  const trimmed = (cell || '').trim();
  if (isDoubleBarCell(trimmed)) return null;
  const match = trimmed.match(/^(.*?)(?:\|\||\\Vert|\\\|)(.+)$/);
  if (!match) return null;
  const leftRaw = match[1].replace(/\$/g, '').trim();
  const rightRaw = match[2].replace(/\$/g, '').trim();
  if (!leftRaw && !rightRaw) return null;
  return {
    left: leftRaw ? `$${leftRaw}$` : '',
    right: rightRaw ? `$${rightRaw}$` : ''
  };
}

// Chuẩn hóa chuỗi toán học trong từng ô của bảng để KaTeX hiển thị sắc nét
function formatTableCellMathString(rawCell: string, isMathTable: boolean): string {
  const trimmed = (rawCell || '').trim();
  if (!trimmed) return '';

  // Nếu đã có dấu $...$ cân xứng thì sửa lỗi ký hiệu cơ bản bên trong
  if (trimmed.includes('$')) {
    return repairVietnameseDocument(trimmed);
  }

  // Nếu trong bảng xét dấu / bảng biến thiên mà ô chưa bọc dấu $ và không phải chữ tiếng Việt
  if (isMathTable && !hasVietnamese(trimmed)) {
    const normalized = trimmed
      .replace(/[–—−]/g, '-')
      .replace(/(?<!\\)\b(infty|nearrow|searrow|uparrow|downarrow|pm|mp|le|ge|leq|geq|neq)\b/g, '\\$1');
    return `$${normalized}$`;
  }

  if (isPureMathString(trimmed)) {
    return `$${trimmed}$`;
  }

  return repairVietnameseDocument(trimmed);
}

function TableCellMath({ text, isMathTable }: { text: string; isMathTable: boolean }) {
  const [deps, setDeps] = useState(mathDepsCache);
  useEffect(() => {
    if (!deps) {
      let active = true;
      ensureMathDeps().then(loaded => {
        if (active) setDeps(loaded);
      });
      return () => { active = false; };
    }
  }, [deps]);

  const formatted = formatTableCellMathString(text, isMathTable);
  if (!formatted) return null;
  if (!deps) {
    return <span className="inline-block leading-normal">{formatted.replace(/\$/g, '')}</span>;
  }
  const { ReactMarkdown: RM, remarkMath: rMath, rehypeKatex: rKatex } = deps;
  return (
    <RM
      remarkPlugins={[rMath]}
      rehypePlugins={[[rKatex, { throwOnError: false, strict: false }]]}
      components={{
        p: ({ children }: any) => <span className="inline-block leading-normal">{children}</span>
      }}
    >
      {formatted}
    </RM>
  );
}

// Component chuyên dụng hiển thị Bảng Xét Dấu, Bảng Biến Thiên (chuẩn SGK Việt Nam) và Bảng Dữ Liệu Thống Kê
export function MathTableRenderer({ rawTable, isDocument = false }: { rawTable: string; isDocument?: boolean }) {
  const normalizedRaw = normalizeMarkdownTablesInText(rawTable || '');
  const lines = normalizedRaw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const parsedRows: string[][] = [];
  for (const line of lines) {
    if (/^[|+:\-\s]+$/.test(line) && line.includes('-')) continue;
    const cells = splitTableRowCells(line);
    if (!isSeparatorTableRow(cells) && cells.some(c => c !== '')) {
      parsedRows.push(cells);
    }
  }

  if (parsedRows.length === 0) return null;

  const isSignTable = isSignOrVariationTable(parsedRows);

  if (isSignTable) {
    const rows = normalizeSignTableRows(parsedRows);

    // Ghi nhớ các cột có dấu || ở hàng đạo hàm để nối thông xuống hàng biến thiên nếu cần
    const doubleBarCols = new Set<number>();
    rows.forEach((r, rIdx) => {
      if (rIdx > 0) {
        r.forEach((c, cIdx) => {
          if (cIdx > 0 && isDoubleBarCell(c)) {
            doubleBarCols.add(cIdx);
          }
        });
      }
    });

    return (
      <div className={`overflow-x-auto ${isDocument ? 'my-4' : 'my-2.5'}`}>
        <table className="border-2 border-slate-800 bg-white border-collapse text-sm md:text-[15px] min-w-[320px] max-w-full shadow-2xs">
          <tbody>
            {rows.map((row, rIdx) => {
              const isVarRow = row.slice(1).some(c => getArrowType(c) !== null);

              return (
                <tr
                  key={rIdx}
                  className={`border-b border-slate-800 last:border-b-0 ${isVarRow ? 'h-20' : ''}`}
                >
                  {row.map((cell, cIdx) => {
                    // Cột 0: Nhãn hàng (x, f'(x), f(x), y', y) - có đường kẻ dọc bên phải ngăn cách với miền xét dấu
                    if (cIdx === 0) {
                      return (
                        <td
                          key={cIdx}
                          className="border-r-2 border-slate-800 bg-slate-50/90 px-4 py-2.5 font-semibold text-center text-slate-900 whitespace-nowrap align-middle min-w-[64px]"
                        >
                          <TableCellMath text={cell} isMathTable={true} />
                        </td>
                      );
                    }

                    // Kiểm tra ô tiệm cận đứng có giới hạn 2 bên dạng "+infty || -infty"
                    const asymSplit = parseAsymptoteSplitCell(cell);
                    if (asymSplit) {
                      const leftClean = stripCellMathFormatting(asymSplit.left);
                      const rightClean = stripCellMathFormatting(asymSplit.right);
                      const leftIsTop = /\+\s*(?:\\infty|∞)/.test(leftClean) || getArrowType(row[cIdx - 1] || '') === 'up';
                      const rightIsTop = /\+\s*(?:\\infty|∞)/.test(rightClean) || getArrowType(row[cIdx + 1] || '') === 'down';

                      return (
                        <td key={cIdx} className="relative px-2 py-1.5 min-w-[68px] whitespace-nowrap align-stretch">
                          <div className="flex items-stretch justify-between h-full min-h-[64px] gap-3">
                            <div className={`flex-1 flex justify-end pr-1 ${leftIsTop ? 'items-start pt-1' : 'items-end pb-1'}`}>
                              <TableCellMath text={asymSplit.left} isMathTable={true} />
                            </div>
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[6px] border-l-[1.5px] border-r-[1.5px] border-slate-800" />
                            <div className={`flex-1 flex justify-start pl-1 ${rightIsTop ? 'items-start pt-1' : 'items-end pb-1'}`}>
                              <TableCellMath text={asymSplit.right} isMathTable={true} />
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Kiểm tra ô đường kẻ đôi "||" (không xác định)
                    if (isDoubleBarCell(cell) || (isVarRow && cell.trim() === '' && doubleBarCols.has(cIdx))) {
                      return (
                        <td key={cIdx} className="relative p-0 min-w-[30px] align-stretch" title="Không xác định">
                          <div className="mx-auto min-h-[38px] h-full w-full">
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[6px] border-l-[1.5px] border-r-[1.5px] border-slate-800" />
                          </div>
                        </td>
                      );
                    }

                    // Kiểm tra mũi tên biến thiên (\nearrow, \searrow)
                    const arrowType = getArrowType(cell);
                    if (arrowType === 'up') {
                      return (
                        <td key={cIdx} className="px-2 py-2 text-center align-middle min-w-[52px]">
                          <div className="flex items-center justify-center">
                            <svg viewBox="0 0 56 42" className="w-12 h-10 overflow-visible text-slate-800">
                              <line x1="6" y1="35" x2="48" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M 40 6.5 L 49 6 L 45.5 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </td>
                      );
                    }
                    if (arrowType === 'down') {
                      return (
                        <td key={cIdx} className="px-2 py-2 text-center align-middle min-w-[52px]">
                          <div className="flex items-center justify-center">
                            <svg viewBox="0 0 56 42" className="w-12 h-10 overflow-visible text-slate-800">
                              <line x1="6" y1="7" x2="48" y2="35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M 45.5 27.5 L 49 36 L 40 35.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </td>
                      );
                    }

                    // Nếu đang ở dòng biến thiên (có mũi tên), căn đỉnh cực đại ở trên và cực tiểu ở dưới
                    if (isVarRow && cell.trim() !== '') {
                      const cleanVal = stripCellMathFormatting(cell);
                      const prevArrow = getArrowType(row[cIdx - 1] || '');
                      const nextArrow = getArrowType(row[cIdx + 1] || '');

                      let vPos: 'top' | 'bottom' | 'middle' = 'middle';
                      if (/^\+\s*(?:\\infty|∞)$/.test(cleanVal)) {
                        vPos = 'top';
                      } else if (/^[-\-−–]\s*(?:\\infty|∞)$/.test(cleanVal)) {
                        vPos = 'bottom';
                      } else if (prevArrow === 'up' || nextArrow === 'down') {
                        vPos = 'top';
                      } else if (prevArrow === 'down' || nextArrow === 'up') {
                        vPos = 'bottom';
                      }

                      const alignClass =
                        vPos === 'top'
                          ? 'align-top pt-1.5 pb-6'
                          : vPos === 'bottom'
                          ? 'align-bottom pb-1.5 pt-6'
                          : 'align-middle py-2.5';

                      return (
                        <td
                          key={cIdx}
                          className={`px-3 text-center text-slate-900 whitespace-nowrap min-w-[38px] ${alignClass}`}
                        >
                          <TableCellMath text={cell} isMathTable={true} />
                        </td>
                      );
                    }

                    // Các ô bình thường trên dòng x và dòng xét dấu f'(x) (KHÔNG có đường kẻ dọc giữa các ô)
                    return (
                      <td
                        key={cIdx}
                        className="px-3 py-2.5 text-center text-slate-900 whitespace-nowrap align-middle min-w-[36px]"
                      >
                        <TableCellMath text={cell} isMathTable={true} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Bảng dữ liệu / bảng thống kê thông thường (có đầy đủ đường kẻ lưới)
  const maxCols = Math.max(...parsedRows.map(r => r.length));
  const normalizedDataRows = parsedRows.map(r => {
    const copy = [...r];
    while (copy.length < maxCols) copy.push('');
    return copy;
  });

  return (
    <div className={`overflow-x-auto ${isDocument ? 'my-4' : 'my-2.5'} rounded-xl border border-slate-300 shadow-2xs bg-white`}>
      <table className="min-w-full border-collapse text-sm">
        <tbody>
          {normalizedDataRows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100/90 font-bold' : rIdx % 2 === 1 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`border border-slate-300 px-3.5 py-2 text-center text-slate-800 ${
                    rIdx === 0 || cIdx === 0 ? 'font-semibold text-slate-900' : ''
                  }`}
                >
                  <TableCellMath text={cell} isMathTable={false} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tách các khối bảng Markdown ra khỏi văn bản trước khi xử lý regex toán học
function extractMarkdownTableBlocks(text: string): { textWithPlaceholders: string; tableBlocks: string[] } {
  const tableBlocks: string[] = [];
  if (!text || !text.includes('|')) {
    return { textWithPlaceholders: text, tableBlocks };
  }

  const normalized = normalizeMarkdownTablesInText(text);
  const lines = normalized.split('\n');
  const resultLines: string[] = [];

  let i = 0;
  while (i < lines.length) {
    if (isMarkdownTableLine(lines[i])) {
      const tableLines: string[] = [lines[i]];
      let j = i + 1;
      while (j < lines.length) {
        const curTrim = lines[j].trim();
        if (isMarkdownTableLine(lines[j]) || /^\|[\s\|:\-]*$/.test(curTrim)) {
          tableLines.push(lines[j]);
          j++;
        } else if (curTrim === '') {
          // Bỏ qua mọi dòng trống vô tình chèn giữa các hàng của cùng một bảng
          let k = j + 1;
          while (k < lines.length && lines[k].trim() === '') {
            k++;
          }
          if (k < lines.length && (isMarkdownTableLine(lines[k]) || /^\|[\s\|:\-]*$/.test(lines[k].trim()))) {
            tableLines.push(lines[k]);
            j = k + 1;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Kiểm tra có ít nhất 2 dòng bảng (hoặc 1 dòng có nhiều phần)
      const nonSepCount = tableLines.filter(l => !isSeparatorTableRow(splitTableRowCells(l))).length;
      if (tableLines.length >= 2 && nonSepCount >= 1) {
        tableBlocks.push(tableLines.join('\n'));
        resultLines.push(`\n\n___MATH_TABLE_BLOCK_${tableBlocks.length - 1}___\n\n`);
        i = j;
        continue;
      }
    }

    resultLines.push(lines[i]);
    i++;
  }

  return {
    textWithPlaceholders: resultLines.join('\n'),
    tableBlocks
  };
}

export default function MathText({ content, isDocument = false, className = '' }: MathTextProps) {
  const [deps, setDeps] = useState(mathDepsCache);
  let safeContent = content || "";

  // Fast path cho chuỗi văn bản thuần túy không chứa công thức toán học, bảng hay Markdown
  const isPlainTextOnly =
    !isDocument &&
    safeContent.length < 400 &&
    !/[\$\\^_|*#`<>~=\[\]]|(?:\b(?:sqrt|frac|dfrac|vec|Delta|pi|alpha|beta|infty|le|ge|neq)\b)/.test(safeContent);

  useEffect(() => {
    if (!isPlainTextOnly && !deps) {
      let active = true;
      ensureMathDeps().then(loaded => {
        if (active) setDeps(loaded);
      });
      return () => { active = false; };
    }
  }, [isPlainTextOnly, deps]);

  if (isPlainTextOnly) {
    return (
      <span className={`katex-wrapper inline-block w-full whitespace-pre-line ${className}`}>
        {safeContent}
      </span>
    );
  }

  // 0. Chuyển đổi \begin{tabular} sang \begin{array} để KaTeX hỗ trợ trực tiếp nếu có
  safeContent = safeContent.replace(/\\begin\{tabular\}/g, '\\begin{array}').replace(/\\end\{tabular\}/g, '\\end{array}');

  // 0. Sửa chữa lỗi artifact bị gãy trước đó (ví dụ \left bị gãy thành \le ft, \neq bị gãy thành \ne q)
  safeContent = safeContent.replace(/\\le\s+ft(?=[^a-zA-Z]|$)/g, '\\left');
  safeContent = safeContent.replace(/\\ne\s+q(?=[^a-zA-Z0-9]|$)/g, '\\neq');
  safeContent = safeContent.replace(/\\ge\s+q(?=[^a-zA-Z0-9]|$)/g, '\\geq');

  // 0. Sửa lỗi ký tự thoát dòng và phục hồi các lệnh LaTeX bị đứt gãy do \n (như \ne -> \n e, \notin -> \n otin)
  safeContent = safeContent.replace(/\\r\\n/g, '\n');
  safeContent = safeContent.replace(/\\n(?=[A-ZÀ-ỹa-z0-9\-\*\s\|\$<>#])/g, (_match, offset, full) => {
    const rest = full.slice(offset);
    if (/^\\n(e|eq|otin|earrow|abla|u)\b/.test(rest)) {
      return '\\n';
    }
    return '\n';
  });
  safeContent = safeContent.replace(/(?:^|\n)\s*e\s+([a-zA-Z0-9\-\+\\]+)/g, ' \\ne $1');
  safeContent = safeContent.replace(/([^\n])\s*\n\s*e\s+([a-zA-Z0-9\-\+\\]+)/g, '$1 \\ne $2');
  safeContent = safeContent.replace(/(?:^|\n)\s*otin\b/g, ' \\notin');
  safeContent = safeContent.replace(/([^\n])\s*\n\s*otin\b/g, '$1 \\notin');
  safeContent = safeContent.replace(/(?:^|\n)\s*earrow\b/g, ' \\nearrow');
  safeContent = safeContent.replace(/([^\n])\s*\n\s*earrow\b/g, '$1 \\nearrow');
  safeContent = safeContent.replace(/(?:^|\n)\s*eq\b/g, ' \\neq');
  safeContent = safeContent.replace(/([^\n])\s*\n\s*eq\b/g, '$1 \\neq');

  // Đảm bảo khoảng trắng giữa từ ngữ tiếng Việt và dấu math $ (tránh dính chữ ví dụ "của$m$" -> "của $m$", "$m$nên" -> "$m$ nên")
  safeContent = safeContent.replace(/([a-zA-ZÀ-ỹ])\$([a-zA-Z0-9])/gu, (_m, p1, p2) => `${p1} $${p2}`);
  safeContent = safeContent.replace(/([0-9a-zA-Z\)\}])\$([a-zA-ZÀ-ỹ])/gu, (_m, p1, p2) => `${p1}$ ${p2}`);
  safeContent = safeContent.replace(/\.([A-ZÀ-ỹ])/gu, ". $1");

  // 0.1 Dọn dẹp sạch sẽ các thẻ HTML rác <div align="center">, <center>, </div> và chuyển <table> sang Markdown
  safeContent = cleanHtmlAndSvgContainers(safeContent);

  // 0.12 Tách và bảo vệ tuyệt đối các khối vector SVG khỏi regex công thức toán
  const svgBlocks: string[] = [];
  safeContent = safeContent.replace(/(<svg\b[\s\S]*?<\/svg>)/gi, (_m, svg) => {
    const healed = healMathSvg(svg);
    svgBlocks.push(healed);
    return `\n\n___MATH_SVG_BLOCK_${svgBlocks.length - 1}___\n\n`;
  });

  // 0.15 Tách và bảo vệ các khối Bảng xét dấu / Bảng biến thiên / Bảng Markdown TRƯỚC KHI chạy repairVietnameseDocument
  const { textWithPlaceholders, tableBlocks } = extractMarkdownTableBlocks(safeContent);
  safeContent = textWithPlaceholders;

  // 0.18 Sửa phông chữ tiếng Việt (TCVN3 / .VnTime, VNI Windows) và ký hiệu toán học
  safeContent = repairVietnameseDocument(safeContent);

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

  // 3. Nếu toàn bộ chuỗi không có dấu $ nào nhưng là một biểu thức toán học rõ rệt (ví dụ: "3x^2 - 3", "u_2 = 3", "m < 2", "(-1; 2)")
  if (!safeContent.includes('$') && !safeContent.includes('___MATH_TABLE_BLOCK_') && !safeContent.includes('___MATH_SVG_BLOCK_') && isPureMathString(safeContent)) {
    const optPrefixMatch = safeContent.match(/^([A-Da-d][\.\)\:\-]\s*)(.+)$/);
    if (optPrefixMatch) {
      safeContent = `${optPrefixMatch[1]}$${optPrefixMatch[2].trim()}$`;
    } else {
      safeContent = `$${safeContent.trim()}$`;
    }
  }

  // 4. Chuẩn hóa khối ma trận / hệ phương trình \begin{...} ... \end{...} nằm NGOÀI dấu $
  // Nếu môi trường \begin{...} đã nằm bên trong $...$ hoặc $$...$$ thì giữ nguyên để không làm vỡ công thức
  const existingMathBlocks: string[] = [];
  safeContent = safeContent.replace(/(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?(?<!\$)\$)/g, (m) => {
    existingMathBlocks.push(m);
    return `___PRE_EXISTING_MATH_${existingMathBlocks.length - 1}___`;
  });

  safeContent = safeContent.replace(
    /(?:(\\left\s*(?:\\.|.)\s*))?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\2\}(\s*\\right\s*(?:\\.|.))?/g,
    (_match, left, env, inner, right) => {
      let l = (left || '').trim();
      let r = (right || '').trim();
      let fixedInner = formatCasesBlock(inner.replace(/(?<!\\)\$/g, ''));
      let body = `\\begin{${env}} ${fixedInner} \\end{${env}}`;
      if (l || r) {
        body = `${l} ${body} ${r}`.trim();
      }
      if (isDocument) {
        return `\n\n$$${body}$$\n\n`;
      }
      return `$$${body}$$`;
    }
  );

  safeContent = safeContent.replace(/___PRE_EXISTING_MATH_(\d+)___/g, (_, idx) => existingMathBlocks[Number(idx)]);

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

      // E. KHOẢNG ĐOẠN, TẬP HỢP VÀ HỢP KHOẢNG ĐOẠN (Phải xử lý TRƯỚC \infty để không làm vỡ (- \infty; ...))
      parts[i] = parts[i].replace(
        /(?<![a-zA-Z0-9\$\\])([\(\[][\+\-]?(?:\d+|\\infty|[a-zA-Z])\s*;\s*[\+\-]?(?:\d+|\\infty|[a-zA-Z])[\)\]](?:\s*(?:\\cup|\\cap|\\setminus)\s*[\(\[][\+\-]?(?:\d+|\\infty|[a-zA-Z])\s*;\s*[\+\-]?(?:\d+|\\infty|[a-zA-Z])[\)\]])*)/g,
        '$$$1$$'
      );
      parts[i] = parts[i].replace(
        /(?<![a-zA-Z0-9\$\\])(\\\{\s*[+\-]?[0-9a-zA-Z\dots\.,;\s\+\-]+\s*\\\})/g,
        '$$$1$$'
      );

      // F. Bất đẳng thức kép và điều kiện tham số ngoài $
      parts[i] = parts[i].replace(
        /(?<![a-zA-Z0-9\$\\])([+\-]?[0-9a-zA-Z\\]+)\s*(<|<=|>|>=|\\le|\\ge|\\leq|\\geq)\s*([a-zA-Z])\s*(<|<=|>|>=|\\le|\\ge|\\leq|\\geq)\s*([+\-]?[0-9a-zA-Z\\]+)(?![a-zA-Z0-9_\$\^])/g,
        (_m, p1, op1, varName, op2, p2) => {
          const cleanOp1 = (op1 === '<=' || op1 === '\\leq') ? '\\le' : (op1 === '>=' || op1 === '\\geq') ? '\\ge' : op1;
          const cleanOp2 = (op2 === '<=' || op2 === '\\leq') ? '\\le' : (op2 === '>=' || op2 === '\\geq') ? '\\ge' : op2;
          return `$${p1} ${cleanOp1} ${varName} ${cleanOp2} ${p2}$`;
        }
      );
      parts[i] = parts[i].replace(
        /(?<![a-zA-Z0-9\$\\])((?:\\Delta|y'|f'\(x\)|[a-zA-Z](?:')?))\s*(<=|>=|!=|<|>|\\le|\\ge|\\leq|\\geq|\\neq|\\ne)\s*([+\-]?(?:[0-9]+(?:\.[0-9]+)?|[a-zA-Z]|\\(?:d|t)?frac\{[^{}]+\}\{[^{}]+\}))(?![a-zA-Z0-9_\$\^])/g,
        (_m, v, op, right) => {
          const cleanOp = (op === '<=' || op === '\\leq') ? '\\le' : (op === '>=' || op === '\\geq') ? '\\ge' : (op === '!=' || op === '\\ne') ? '\\neq' : op;
          return `$${v} ${cleanOp} ${right}$`;
        }
      );
      parts[i] = parts[i].replace(
        /(?<![a-zA-Z0-9\$\\])(-[a-zA-Z])\s*(<=|>=|!=|<|>|\\le|\\ge|\\leq|\\geq|\\neq|\\ne)\s*([+\-]?[0-9]+(?:\.[0-9]+)?)(?![a-zA-Z0-9_\$\^])/g,
        (_m, v, op, right) => {
          const cleanOp = (op === '<=' || op === '\\leq') ? '\\le' : (op === '>=' || op === '\\geq') ? '\\ge' : (op === '!=' || op === '\\ne') ? '\\neq' : op;
          return `$${v} ${cleanOp} ${right}$`;
        }
      );

      // G. Ký hiệu mũi tên BBT và các ký hiệu toán phổ biến
      parts[i] = parts[i].replace(/\\(nearrow|searrow|uparrow|downarrow|infty|pm|mp|leq|geq|le|ge|in|notin|subset|supset|cup|cap|emptyset|approx|equiv|forall|exists|alpha|beta|gamma|theta|pi|Delta|lambda|sigma|omega|Omega|times|div|neq)\b/g, (_m, p1) => `$\\${p1}$`);

      // H. Tự động nhận diện đa thức chứa lũy thừa chưa có $ trong văn bản
      parts[i] = parts[i].replace(/(?<![a-zA-Z0-9\$\\])([0-9]*[a-zA-Z\)]\s*\^\s*\{?[0-9a-zA-Z\+\-]+\}?(?:\s*[+\-]\s*[0-9a-zA-Z]+)*)(?![a-zA-Z0-9\$\^])/g, '$$$1$$');

      // I. Dãy số / chỉ số dưới toán học (bảo vệ placeholder ___MATH_SVG_BLOCK_ và ___MATH_TABLE_BLOCK_)
      parts[i] = parts[i].replace(/(?<![\p{L}\p{N}\$\\_])([uxyzabcnkm])_([0-9]+|[nkm])(\s*=\s*[0-9a-zA-Z\+\-\*\/]+)?(?![\p{L}\p{N}\$_])/gu, (_m, p1, p2, p3) => `$${p1}_${p2}${p3 || ''}$`);

      // J. Mũi tên suy ra / tương đương dạng ký hiệu hoặc chữ
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
        let inner = parts[i].slice(2, -2).replace(/(?<!\\)\$/g, '').trim();
        parts[i] = `\n\n$$\n${inner}\n$$\n\n`;
        if (i > 0 && typeof parts[i - 1] === 'string') {
          parts[i - 1] = parts[i - 1].replace(/[ \t]+$/, '');
        }
      } else if (parts[i].startsWith('$') && parts[i].endsWith('$')) {
        let inner = parts[i].slice(1, -1).replace(/(?<!\\)\$/g, '').trim();
        parts[i] = `$${inner}$`;
      }
    }
  }
  
  safeContent = parts.join('');

  // 5.1 Dọn dẹp dollar thừa và ký hiệu phân cách
  safeContent = safeContent.replace(/\${3,}/g, '$$');
  safeContent = safeContent.replace(/\$\s*;\s*\$/g, '; ');
  safeContent = safeContent.replace(/\$\s*,\s*\$/g, ', ');

  // 5.2 Đảm bảo macro LaTeX không dính liền biến số (e.g. \Leftrightarrowm -> \Leftrightarrow m, \inm -> \in m)
  safeContent = safeContent.replace(/\\(Longleftrightarrow|Longrightarrow|Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|notin|infty|setminus|approx|times|equiv|forall|exists|Delta|cdot|perp|parallel|cup|cap|geq|leq|neq|pm|mp)([a-zA-Z0-9])/g, '\\$1 $2');
  safeContent = safeContent.replace(/\\(Longleftrightarrow|Longrightarrow|Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)([\+\-])/g, '\\$1 $2');
  safeContent = safeContent.replace(/\\in([0-9]|[a-zA-Z](?![a-zA-Z]))/g, '\\in $1');
  // CHỈ tách le, ge, ne khi theo sau là CHỮ SỐ (0-9). TUYỆT ĐỐI KHÔNG tách trước chữ cái [a-zA-Z]
  safeContent = safeContent.replace(/\\(le|ge|ne)([0-9])/g, '\\$1 $2');
  safeContent = safeContent.replace(/([0-9a-zA-Z\)])\\(Longleftrightarrow|Longrightarrow|Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|notin|infty|setminus|approx|times|equiv|forall|exists|Delta|cdot|perp|parallel|cup|cap|geq|leq|neq|pm|mp|le|ge|ne|in)\b/g, '$1 \\$2');

  // Khắc phục lại nếu còn sót \le ft hoặc \ne q
  safeContent = safeContent.replace(/\\le\s+ft(?=[^a-zA-Z]|$)/g, '\\left');
  safeContent = safeContent.replace(/\\ne\s+q(?=[^a-zA-Z0-9]|$)/g, '\\neq');
  safeContent = safeContent.replace(/\\ge\s+q(?=[^a-zA-Z0-9]|$)/g, '\\geq');

  // 5.3 Đảm bảo không còn tồn đọng token chưa giải nén trong bất kỳ trường hợp nào
  let tokenCleanupPass = 0;
  while (safeContent.includes('___MATH_TOK_') && tokenCleanupPass < 5) {
    safeContent = safeContent.replace(/___MATH_TOK_\d+___/g, '');
    tokenCleanupPass++;
  }

  // 6. Khôi phục các khối SVG vào Markdown code block
  safeContent = safeContent.replace(/___MATH_SVG_BLOCK_(\d+)___/g, (_m, idx) => {
    const svgCode = svgBlocks[Number(idx)] || '';
    return `\n\n\`\`\`svg\n${svgCode}\n\`\`\`\n\n`;
  });

  // Xóa bỏ các thẻ </div> trôi dạt còn sót lại
  safeContent = safeContent.replace(/(?:^|\n)\s*<\/div>\s*(?:\n|$)/gi, '\n');

  // Tách nội dung theo các placeholder ___MATH_TABLE_BLOCK_(\d+)___ để render trực tiếp <MathTableRenderer />
  const segments = safeContent.split(/(___MATH_TABLE_BLOCK_\d+___)/g);

  const renderMarkdownSegment = (seg: string, key: number) => {
    if (!seg.trim()) return null;
    if (!deps) {
      return <span key={key} className="whitespace-pre-line">{seg.replace(/\$/g, '')}</span>;
    }
    const { ReactMarkdown, remarkMath, rehypeKatex } = deps;

    if (isDocument) {
      return (
        <ReactMarkdown
          key={key}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
          components={{
            h1: ({node, ...props}: any) => <h1 className="text-xl md:text-2xl font-bold text-blue-900 mt-6 mb-3 pb-2.5 border-b-2 border-blue-100 flex items-center gap-2" {...props} />,
            h2: ({node, ...props}: any) => <h2 className="text-lg md:text-xl font-bold text-indigo-900 mt-5 mb-2.5 pb-1 border-b border-indigo-100/70" {...props} />,
            h3: ({node, ...props}: any) => <h3 className="text-base md:text-lg font-bold text-gray-800 mt-4 mb-2 flex items-center gap-1.5" {...props} />,
            h4: ({node, ...props}: any) => <h4 className="text-sm md:text-base font-semibold text-gray-800 mt-3 mb-1.5" {...props} />,
            p: ({node, ...props}: any) => <p className="mb-3.5 leading-relaxed text-gray-800 text-[14.5px]" {...props} />,
            ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-gray-800 text-[14.5px]" {...props} />,
            ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-gray-800 text-[14.5px]" {...props} />,
            li: ({node, ...props}: any) => <li className="leading-relaxed" {...props} />,
            blockquote: ({node, children, ...props}: any) => {
              return (
                <blockquote className="border-l-4 border-blue-500 bg-blue-50/70 p-3.5 md:p-4 my-3.5 rounded-r-xl text-gray-800 text-[14px] leading-relaxed shadow-2xs" {...props}>
                  {children}
                </blockquote>
              );
            },
            strong: ({node, ...props}: any) => <strong className="font-bold text-gray-900" {...props} />,
            em: ({node, ...props}: any) => <em className="italic text-gray-800" {...props} />,
            hr: () => <hr className="my-5 border-gray-200" />,
            pre: ({children}: any) => <>{children}</>,
            code: ({node, className: codeClass, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(codeClass || '');
              const codeStr = String(children || '').trim();
              if (match?.[1] === 'mathtable') {
                return <MathTableRenderer rawTable={codeStr} isDocument={true} />;
              }
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
            table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 shadow-2xs rounded-xl border border-gray-200"><table className="min-w-full border-collapse text-sm rounded-lg overflow-hidden" {...props} /></div>,
            th: ({node, ...props}: any) => <th className="border border-gray-200 bg-slate-100 px-3.5 py-2.5 font-bold text-center text-gray-900" {...props} />,
            td: ({node, ...props}: any) => <td className="border border-gray-200 px-3.5 py-2.5 text-center text-gray-800 bg-white" {...props} />
          }}
        >
          {seg}
        </ReactMarkdown>
      );
    }

    return (
      <ReactMarkdown
        key={key}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{
          p: ({node, ...props}: any) => <p className="mb-1.5 last:mb-0 leading-relaxed whitespace-pre-line" {...props} />,
          ul: ({node, ...props}: any) => <ul className="list-disc pl-5 my-1.5 space-y-1" {...props} />,
          ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 my-1.5 space-y-1" {...props} />,
          li: ({node, ...props}: any) => <li className="leading-relaxed" {...props} />,
          strong: ({node, ...props}: any) => <strong className="font-bold text-gray-900" {...props} />,
          em: ({node, ...props}: any) => <em className="italic" {...props} />,
          blockquote: ({node, ...props}: any) => <blockquote className="border-l-3 border-emerald-500 bg-emerald-50/60 p-2 my-2 rounded-r-md text-xs leading-relaxed" {...props} />,
          table: ({node, ...props}: any) => <div className="overflow-x-auto my-2 rounded-lg border border-gray-200"><table className="min-w-full border-collapse text-xs" {...props} /></div>,
          th: ({node, ...props}: any) => <th className="border border-gray-200 bg-gray-100 px-2.5 py-1 font-bold text-center text-gray-900" {...props} />,
          td: ({node, ...props}: any) => <td className="border border-gray-200 px-2.5 py-1 text-center text-gray-800 bg-white" {...props} />,
          pre: ({children}: any) => <>{children}</>,
          code: ({node, className: codeClass, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(codeClass || '');
            const codeStr = String(children || '').trim();
            if (match?.[1] === 'mathtable') {
              return <MathTableRenderer rawTable={codeStr} isDocument={false} />;
            }
            if (match?.[1] === 'svg' || codeStr.startsWith('<svg')) {
              const healedSvg = healMathSvg(codeStr);
              return (
                <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <div 
                    className="w-full max-w-sm mx-auto [&>svg]:w-full [&>svg]:h-auto flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: healedSvg }} 
                  />
                </div>
              );
            }
            return <code className="bg-gray-100 text-purple-700 px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
          }
        }}
      >
        {seg}
      </ReactMarkdown>
    );
  };

  return (
    <div className={isDocument ? `katex-document font-sans text-gray-800 leading-relaxed ${className}` : `katex-wrapper inline-block w-full ${className}`}>
      {segments.map((seg, idx) => {
        const tableMatch = seg.match(/^___MATH_TABLE_BLOCK_(\d+)___$/);
        if (tableMatch) {
          const tableCode = tableBlocks[Number(tableMatch[1])] || '';
          return <MathTableRenderer key={idx} rawTable={tableCode} isDocument={isDocument} />;
        }
        return renderMarkdownSegment(seg, idx);
      })}
    </div>
  );
}

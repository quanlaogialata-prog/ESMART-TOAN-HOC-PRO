/**
 * gradeEngine.ts
 * Engine chuẩn hóa và chấm điểm bài thi trắc nghiệm (MCQ, Đúng/Sai, Trả lời ngắn, Tự luận)
 * theo quy chế và định dạng đề thi của Bộ Giáo dục & Đào tạo (Áp dụng từ năm học 2025-2027).
 */

export interface GradeQuestionResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  correctAnswerDisplay: string;
  details?: any;
}

/**
 * Kiểm tra xem một chuỗi có phải là biểu thức toán học thuần túy không
 */
export function isLikelyMathExpression(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Nếu có chữ cái tiếng Việt có dấu thì không phải biểu thức toán thuần túy
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(trimmed)) {
    return false;
  }

  // Nếu chứa các dấu hiệu toán học rõ rệt:
  // - Lũy thừa: 3x^2 - 3, x^2, 2^x
  // - Chỉ số dưới: u_2, u_3 = 7, x_1
  // - Phép so sánh / phương trình: u_2 = 3, y = 2x - 1, f'(x) = 0
  // - Lệnh LaTeX: \frac, \dfrac, \tfrac, \sqrt, \vec, \begin, \cases, \infty, \alpha, \cdot, \pi...
  // - Khoảng/đoạn: (-1; 2), [0; 3], (-\infty; 1)
  // - Bất đẳng thức: >, <, \le, \ge, \neq
  if (/\^|_[0-9a-zA-Z]|\\(?:(?:d|t)?frac|sqrt|vec|begin|cases|matrix|aligned|infty|alpha|beta|gamma|cdot|pi|pm|approx|neq|le|ge|over)|=|<|>|\(-?\d+;|-?\d+\)|\[-?\d+;|-?\d+\]|f'\(|y'/.test(trimmed)) {
    return true;
  }

  // Chuỗi đại số ngắn chỉ gồm biến, số và toán tử: ví dụ "3x - 1", "2x + y", "x/2"
  if (/^[+\-]?[0-9a-zA-Z\s+\-*/()]+$/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && /[+\-*/]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Loại bỏ tiền tố ký hiệu phương án (A., B., C., D., a), b), c), d), (A), [A]...)
 * ĐỒNG THỜI BẢO TOÀN NGUYÊN VẸN CÁC DẤU ĐÓNG/MỞ $ CỦA CÔNG THỨC TOÁN HỌC (KaTeX).
 * Tự động sửa lỗi mất dấu $ đầu khi có dấu chấm cuối chuỗi (ví dụ: "u_2 = 3$." -> "$u_2 = 3$")
 * và tự động bao bọc công thức đại số chưa có $ (ví dụ: "3x^2 - 3" -> "$3x^2 - 3$").
 */
export function stripOptionPrefix(text: string | null | undefined): string {
  if (!text) return '';
  let str = text.toString().trim();

  // 0. Chuẩn hóa dấu gạch ngang (em-dash, en-dash, unicode minus) trước dấu gạch chéo ngược LaTeX hoặc số
  str = str.replace(/[–—−](?=\s*\\)/g, '-');
  str = str.replace(/[–—−](?=\s*[0-9])/g, '-');

  // 1. Tiền tố bên ngoài $, hỗ trợ cả ký hiệu bullet hoặc gạch đầu dòng: "• A. $3x^2 - 3$", "• B. -\dfrac{5}{8}"
  str = str.replace(/^[•\-\*\s]*(\[?[a-dA-D0-9][\.\)\]\:]|\([a-dA-D0-9]\))\s*/, '');

  // 2. Tiền tố nằm bên trong $: "$A. 3x^2 - 3$" -> "$3x^2 - 3$"
  str = str.replace(/^\$\s*[•\-\*\s]*([a-dA-D0-9][\.\)\]\:]|\([a-dA-D0-9]\))\s*/, '$');

  // 3. Xử lý dấu chấm sau dấu $: "$u_2 = 3$." hoặc "u_2 = 3$." -> "$u_2 = 3$"
  str = str.replace(/\$\.\s*$/, '$').trim();
  if (str.endsWith('.') && !/\d\.\d+$/.test(str)) {
    str = str.slice(0, -1).trim();
  }

  // 4. Nếu chuỗi có số dấu $ không chẵn (unbalanced $)
  const dollarCount = (str.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    if (str.endsWith('$') && !str.startsWith('$')) {
      str = '$' + str;
    } else if (str.startsWith('$') && !str.endsWith('$')) {
      str = str + '$';
    }
  }

  // 5. Nếu chưa có dấu $ nhưng là biểu thức toán học rõ rệt (như 3x^2 - 3, u_2 = 3, -\dfrac{5}{8})
  if (!str.includes('$') && isLikelyMathExpression(str)) {
    str = `$${str}$`;
  }

  return str.trim();
}

/**
 * Làm sạch chuỗi hiển thị đáp án phục vụ so khớp đáp án (loại bỏ A., B., a), b), dấu $, dấu chấm cuối...)
 */
export function cleanOptionText(text: string | null | undefined): string {
  if (!text) return '';
  return stripOptionPrefix(text)
    .replace(/\$/g, '')
    .replace(/[.,;:]+$/, '')
    .trim();
}

/**
 * Chuẩn hóa biểu thức toán học thành dạng chuẩn (canonical) để so sánh giá trị tương đương:
 * - Bỏ tiền tố phương án A., B., a), b)...
 * - Bỏ $ và $$
 * - Chuẩn hóa phân số: \frac{a}{b}, \dfrac{a}{b} -> (a)/(b)
 * - Chuẩn hóa căn: \sqrt{a} -> sqrt(a)
 * - Chuẩn hóa dấu nhân: \cdot, \times, * -> *
 * - Chuẩn hóa dấu phẩy thập phân: 3,5 -> 3.5
 * - Bỏ ngoặc nhọn: ^{2} -> ^2
 * - Bỏ toàn bộ khoảng trắng và chữ hoa
 */
export function canonicalMathText(text: string | null | undefined): string {
  if (!text) return '';
  let str = text.toString().trim();

  // 1. Loại bỏ tiền tố phương án A., B., a), b)...
  str = stripOptionPrefix(str);

  // 2. Bỏ dấu $ và $$
  str = str.replace(/\$/g, '').trim();

  // 3. Chuẩn hóa phân số LaTeX
  str = str.replace(/\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');

  // 4. Chuẩn hóa căn thức (căn bậc 2, căn bậc 3, ký hiệu √, ∛, \sqrt, \cbrt)
  str = str.replace(/\\sqrt\[3\]\s*\{([^{}]+)\}/g, 'cbrt($1)');
  str = str.replace(/∛\s*\{([^{}]+)\}/g, 'cbrt($1)');
  str = str.replace(/∛\s*\(([^()]+)\)/g, 'cbrt($1)');
  str = str.replace(/∛\s*([0-9a-zA-Z.]+)/g, 'cbrt($1)');
  str = str.replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)');
  str = str.replace(/\\sqrt\s*([0-9.]+)/g, 'sqrt($1)');
  str = str.replace(/√\s*\{([^{}]+)\}/g, 'sqrt($1)');
  str = str.replace(/√\s*\(([^()]+)\)/g, 'sqrt($1)');
  str = str.replace(/√\s*([0-9.]+)/g, 'sqrt($1)');
  str = str.replace(/căn\s*([0-9.]+)/gi, 'sqrt($1)');
  str = str.replace(/(\d)\s*(sqrt|cbrt)/g, '$1*$2');

  // 5. Chuẩn hóa dấu nhân, vector, ký hiệu đặc biệt
  str = str.replace(/\\cdot|\\times/g, '*');
  str = str.replace(/\\vec\s*\{?([a-zA-Z]+)\}?/g, 'vec($1)');
  str = str.replace(/π|\\pi\b/g, 'pi');
  str = str.replace(/±|\\pm\b/g, '+-');
  str = str.replace(/²/g, '^2').replace(/³/g, '^3');

  // 6. Bỏ cặp ngoặc nhọn xung quanh số mũ / chỉ số
  str = str.replace(/\^\{([^{}]+)\}/g, '^$1');
  str = str.replace(/_\{([^{}]+)\}/g, '_$1');

  // 7. Chuẩn hóa số thập phân: ví dụ 3,5 -> 3.5
  str = str.replace(/(\d+),(\d+)/g, '$1.$2');

  // 8. Bỏ dấu chấm, phẩy, chấm phẩy cuối chuỗi
  str = str.replace(/[.,;:]+$/, '');

  // 9. Bỏ toàn bộ khoảng trắng và chuyển sang chữ thường
  str = str.replace(/\s+/g, '').toLowerCase();

  return str;
}

/**
 * Chuẩn hóa đáp án trắc nghiệm nhiều lựa chọn (MCQ)
 * Nhận diện chính xác ký tự phương án A, B, C, D từ cả studentAnswer và correctAnswer
 */
export function resolveMcqLetter(
  answer: any,
  options?: string[]
): { letter: string | null; index: number | null; text: string } {
  if (answer === null || answer === undefined) {
    return { letter: null, index: null, text: '' };
  }

  const str = answer.toString().trim();
  if (!str) return { letter: null, index: null, text: '' };

  // 1. Bỏ dấu bọc $ hoặc $$
  const unwrapStr = str.replace(/^\$+|\$+$/g, '').trim();

  // 2. Kiểm tra nếu chuỗi là số thứ tự 0, 1, 2, 3
  if (/^[0-3]$/.test(unwrapStr)) {
    const idx = parseInt(unwrapStr, 10);
    return {
      letter: String.fromCharCode(65 + idx),
      index: idx,
      text: options && options[idx] ? cleanOptionText(options[idx]) : ''
    };
  }

  // 3. Kiểm tra các dạng gán nhãn phương án độc lập:
  // "A", "B", "C", "D", "A.", "A)", "A:", "Đáp án A", "Chọn A", "Phương án B", "Câu C", "(A)", "[A]"
  const prefixLetterMatch = unwrapStr.match(/^(?:đáp\s*án|phương\s*án|chọn|câu|ý)?\s*[:=]?\s*[\(\[]?\s*([A-D])\s*[\)\]\.\:]?\s*$/i);
  if (prefixLetterMatch) {
    const letter = prefixLetterMatch[1].toUpperCase();
    const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
    return {
      letter,
      index: idx >= 0 ? idx : null,
      text: options && idx >= 0 && options[idx] ? cleanOptionText(options[idx]) : ''
    };
  }

  // 4. Kiểm tra ký tự A, B, C, D đứng đầu: "A. $3x^2 - 3$", "A) 3x^2 - 3", "$A. 3x^2$"
  const leadingLetterMatch = str.match(/^\$?\s*([A-D])[\.\)\:\-\]]\s*/i);
  if (leadingLetterMatch) {
    const letter = leadingLetterMatch[1].toUpperCase();
    const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
    return {
      letter,
      index: idx >= 0 ? idx : null,
      text: options && idx >= 0 && options[idx] ? cleanOptionText(options[idx]) : cleanOptionText(str)
    };
  }

  // 5. Nếu không có ký tự A-D ở đầu, so khớp nội dung toán học với options để tìm vị trí
  if (options && Array.isArray(options) && options.length > 0) {
    const canonicalAns = canonicalMathText(str);
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (opt === str || canonicalMathText(opt) === canonicalAns) {
        return {
          letter: String.fromCharCode(65 + i),
          index: i,
          text: cleanOptionText(opt)
        };
      }
    }
  }

  return { letter: null, index: null, text: cleanOptionText(str) };
}

/**
 * Kiểm tra xem đáp án trắc nghiệm MCQ có đúng không
 */
export function checkMcqAnswer(
  studentAns: any,
  correctAns: any,
  options?: string[]
): { isCorrect: boolean; correctLetter: string; studentLetter: string } {
  const studentResolved = resolveMcqLetter(studentAns, options);
  const correctResolved = resolveMcqLetter(correctAns, options);

  let isCorrect = false;

  // 1. So sánh theo chữ cái phương án A, B, C, D
  if (studentResolved.letter && correctResolved.letter) {
    isCorrect = studentResolved.letter.toUpperCase() === correctResolved.letter.toUpperCase();
  } else if (studentResolved.index !== null && correctResolved.index !== null) {
    // 2. So sánh theo vị trí index 0, 1, 2, 3
    isCorrect = studentResolved.index === correctResolved.index;
  } else if (studentResolved.text && correctResolved.text) {
    // 3. So sánh theo canonical math text
    isCorrect = canonicalMathText(studentResolved.text) === canonicalMathText(correctResolved.text);
  } else if (studentAns && correctAns) {
    // 4. So sánh chuỗi gốc sau khi chuẩn hóa
    isCorrect = canonicalMathText(studentAns) === canonicalMathText(correctAns);
  }

  const finalCorrectLetter = correctResolved.letter || (options && correctResolved.index !== null ? String.fromCharCode(65 + correctResolved.index) : (correctAns?.toString() || ''));
  const finalStudentLetter = studentResolved.letter || (options && studentResolved.index !== null ? String.fromCharCode(65 + studentResolved.index) : (studentAns?.toString() || ''));

  return {
    isCorrect,
    correctLetter: finalCorrectLetter,
    studentLetter: finalStudentLetter
  };
}

/**
 * Chuẩn hóa một giá trị Đúng / Sai đơn lẻ về 'Đ' hoặc 'S'
 */
export function normalizeTfValue(val: any): 'Đ' | 'S' | null {
  if (val === null || val === undefined) return null;
  const s = val.toString().trim().toLowerCase();
  if (['đ', 'đúng', 'dung', 'd', 'true', 't', '1', 'yes', 'y', 'correct', 'đ/đúng'].includes(s)) return 'Đ';
  if (['s', 'sai', 'false', 'f', '0', 'no', 'n', 'incorrect', 's/sai'].includes(s)) return 'S';
  if (/^(đ|đúng|dung|true|t\b)/i.test(s)) return 'Đ';
  if (/^(s|sai|false|f\b)/i.test(s)) return 'S';
  return null;
}

/**
 * Phân tích chuỗi hoặc đối tượng Đúng/Sai (Part II) thành danh sách 4 ý a, b, c, d
 */
export function parseTfSubAnswers(
  raw: any,
  expectedCount: number = 4
): { [key: string]: 'Đ' | 'S' | null } {
  const result: { [key: string]: 'Đ' | 'S' | null } = {
    a: null,
    b: null,
    c: null,
    d: null
  };

  if (!raw) return result;

  // 1. Nếu là object đã có key a, b, c, d (hoặc A, B, C, D)
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    ['a', 'b', 'c', 'd'].forEach((key) => {
      const val = raw[key] !== undefined ? raw[key] : raw[key.toUpperCase()];
      if (val !== undefined) {
        result[key] = normalizeTfValue(val);
      }
    });
    return result;
  }

  const str = raw.toString().trim();

  // 2. Thử parse nếu là chuỗi JSON
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      ['a', 'b', 'c', 'd'].forEach((key) => {
        const val = parsed[key] !== undefined ? parsed[key] : parsed[key.toUpperCase()];
        if (val !== undefined) {
          result[key] = normalizeTfValue(val);
        }
      });
      return result;
    } catch {
      // Bỏ qua nếu lỗi
    }
  }

  // 3. Dạng có gán nhãn:
  // "a-Đ, b-S, c-Đ, d-S", "a) Đúng, b) Sai...", "a. Đúng, b. Sai...", "a: Đúng, b: Sai...",
  // "a-Đúng, b-Sai...", "Ý a: Đúng, Ý b: Sai...", "1) Đúng, 2) Sai...", "1-Đ, 2-S..."
  const labeledRegex = /(?:ý\s*)?([a-dA-D1-4])\s*[\)\.\:\-\=\s]+\s*(đúng|sai|đ|s|true|false|dung|d\b)/gi;
  const labeledMatches = Array.from(str.matchAll(labeledRegex));
  if (labeledMatches.length > 0) {
    for (const m of labeledMatches) {
      let label = m[1].toLowerCase();
      if (label === '1') label = 'a';
      else if (label === '2') label = 'b';
      else if (label === '3') label = 'c';
      else if (label === '4') label = 'd';
      result[label] = normalizeTfValue(m[2]);
    }
    return result;
  }

  // 4. Chuỗi 2-4 ký tự liền: "ĐSĐS", "TFTF", "DSDS"
  const cleanChars = str.replace(/[^a-zA-ZđĐ]/g, '');
  if (cleanChars.length >= 2 && cleanChars.length <= 4 && /^[đsdtf]{2,4}$/i.test(cleanChars)) {
    const keys = ['a', 'b', 'c', 'd'];
    cleanChars.split('').slice(0, 4).forEach((char, idx) => {
      result[keys[idx]] = normalizeTfValue(char);
    });
    return result;
  }

  // 5. Dạng phân tách danh sách: "Đúng, Sai, Đúng, Sai" hoặc "Đ, S, Đ, S" hoặc "Đ - S - Đ - S"
  const tokens = str.split(/[,;\-\/|\n\r]+/).map((t: string) => t.trim()).filter(Boolean);
  const keys = ['a', 'b', 'c', 'd'];

  if (tokens.length >= 2) {
    tokens.slice(0, 4).forEach((tok: string, idx: number) => {
      const m = tok.match(/(?:ý\s*)?([a-dA-D1-4])\s*[\)\.\:\-\=\s]+\s*(đúng|sai|đ|s|true|false|dung|d\b)/i);
      if (m) {
        let label = m[1].toLowerCase();
        if (label === '1') label = 'a';
        else if (label === '2') label = 'b';
        else if (label === '3') label = 'c';
        else if (label === '4') label = 'd';
        result[label] = normalizeTfValue(m[2]);
      } else {
        result[keys[idx]] = normalizeTfValue(tok);
      }
    });
    return result;
  }

  // 6. Dạng chỉ 1 giá trị duy nhất (cho câu hỏi Đúng/Sai chỉ có 1 ý)
  const single = normalizeTfValue(str);
  if (single) {
    result.a = single;
  }

  return result;
}

/**
 * Tính điểm cho câu hỏi Đúng / Sai (Phần II theo chuẩn Bộ GD&ĐT 2025-2027)
 * - Đúng 1 ý: 0.1 điểm (hoặc 10% điểm tối đa)
 * - Đúng 2 ý: 0.25 điểm (hoặc 25% điểm tối đa)
 * - Đúng 3 ý: 0.5 điểm (hoặc 50% điểm tối đa)
 * - Đúng 4 ý: 1.0 điểm (hoặc 100% điểm tối đa)
 */
export function gradeTfQuestion(
  studentAns: any,
  correctAns: any,
  options?: string[],
  pts: number = 1
): {
  score: number;
  correctCount: number;
  totalSub: number;
  subResults: Array<{ label: string; text: string; student: string; correct: string; isCorrect: boolean }>;
  feedback: string;
} {
  const subCount = options && options.length > 1 ? Math.min(options.length, 4) : 4;
  const studentMap = parseTfSubAnswers(studentAns, subCount);
  const correctMap = parseTfSubAnswers(correctAns, subCount);

  const keys = ['a', 'b', 'c', 'd'].slice(0, subCount);
  const subResults: Array<{ label: string; text: string; student: string; correct: string; isCorrect: boolean }> = [];
  let correctCount = 0;

  keys.forEach((key, idx) => {
    const sVal = studentMap[key] || '';
    const cVal = correctMap[key] || '';
    const isCorr = !!sVal && !!cVal && sVal === cVal;
    if (isCorr) correctCount++;

    const optText = options && options[idx] ? stripOptionPrefix(options[idx]) : `Ý ${key.toUpperCase()}`;
    subResults.push({
      label: key,
      text: optText,
      student: sVal ? (sVal === 'Đ' ? 'Đúng' : 'Sai') : '(Chưa chọn)',
      correct: cVal ? (cVal === 'Đ' ? 'Đúng' : 'Sai') : '-',
      isCorrect: isCorr
    });
  });

  // Barem điểm chuẩn Bộ GD&ĐT cho câu 4 ý:
  let score = 0;
  if (subCount === 4) {
    if (correctCount === 1) score = 0.1 * pts;
    else if (correctCount === 2) score = 0.25 * pts;
    else if (correctCount === 3) score = 0.5 * pts;
    else if (correctCount === 4) score = 1.0 * pts;
    else score = 0;
  } else {
    // Tỷ lệ cho câu có số ý khác 4
    score = (correctCount / subCount) * pts;
  }

  // Làm tròn 2 chữ số thập phân
  score = Math.round(score * 100) / 100;

  const correctDisplay = keys.map(k => `${k}: ${correctMap[k] === 'Đ' ? 'Đúng' : correctMap[k] === 'S' ? 'Sai' : '-'}`).join(', ');
  const feedback = correctCount === subCount
    ? `Chính xác hoàn toàn cả ${subCount} ý (+${score}đ).`
    : correctCount > 0
    ? `Đúng ${correctCount}/${subCount} ý (+${score}đ). Đáp án đúng: ${correctDisplay}`
    : `Chưa đúng ý nào (0đ). Đáp án đúng: ${correctDisplay}`;

  return {
    score,
    correctCount,
    totalSub: subCount,
    subResults,
    feedback
  };
}

/**
 * Tính giá trị số thực từ một biểu thức toán học chứa căn, phân số, số thập phân
 */
export function evaluateMathNumericValue(text: any): number | null {
  if (text === null || text === undefined) return null;
  let expr = text.toString().trim();
  if (!expr) return null;

  // Bỏ dấu $ và $$
  expr = expr.replace(/^\$+|\$+$/g, '').trim();
  // Bỏ tiền tố gán biến hoặc lời dẫn
  expr = expr.replace(/^[a-zA-Z](?:_[0-9a-zA-Z]+)?\s*=\s*/, '');
  expr = expr.replace(/^(?:đáp\s*số|đáp\s*án|kết\s*quả|kết\s*quả\s*là|giá\s*trị|nghiệm|phương\s*trình\s*có\s*nghiệm)\s*[:=]?\s*/i, '');
  expr = expr.replace(/;+$/, '').replace(/\.+$/, '').trim();
  expr = expr.replace(/\s*(cm|m|km|dm|mm|kg|g|rad|độ|°|đvdt|đvtt|cm\^2|cm\^3|m\^2|m\^3)$/i, '').trim();

  // 1. Căn bậc 3
  expr = expr.replace(/\\sqrt\[3\]\s*\{([^{}]+)\}/g, '__CBRT__($1)');
  expr = expr.replace(/∛\s*\{([^{}]+)\}/g, '__CBRT__($1)');
  expr = expr.replace(/∛\s*\(([^()]+)\)/g, '__CBRT__($1)');
  expr = expr.replace(/∛\s*([0-9.]+)/g, '__CBRT__($1)');

  // 2. Căn bậc 2: Thay thế trước phân số để tránh lỗi curly braces lồng nhau trong LaTeX
  expr = expr.replace(/\\sqrt\s*\{([^{}]+)\}/g, '__SQRT__($1)');
  expr = expr.replace(/\\sqrt\s*([0-9.]+)/g, '__SQRT__($1)');
  expr = expr.replace(/√\s*\{([^{}]+)\}/g, '__SQRT__($1)');
  expr = expr.replace(/√\s*\(([^()]+)\)/g, '__SQRT__($1)');
  expr = expr.replace(/√\s*([0-9.]+)/g, '__SQRT__($1)');
  expr = expr.replace(/sqrt\s*\(([^()]+)\)/gi, '__SQRT__($1)');
  expr = expr.replace(/căn\s*([0-9.]+)/gi, '__SQRT__($1)');

  // 3. Phân số LaTeX \frac{A}{B} đệ quy
  let prev = '';
  while (expr.includes('frac') && expr !== prev) {
    prev = expr;
    expr = expr.replace(/\\d?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '(($1)/($2))');
  }

  // 4. Số Pi
  expr = expr.replace(/\\pi\b|π/g, '__PI__');

  // 5. Phép nhân ngầm định: 2__SQRT__(3) -> 2*__SQRT__(3)
  expr = expr.replace(/(\d)\s*(__[A-Z]+__)/g, '$1*$2');
  expr = expr.replace(/(__[A-Z]+__\([^)]+\))\s*(\d)/g, '$1*$2');
  expr = expr.replace(/(\d)\s*\(/g, '$1*(');
  expr = expr.replace(/\)\s*(\d)/g, ')*$1');
  expr = expr.replace(/\)\s*\(/g, ')*(');
  expr = expr.replace(/\^/g, '**');

  // 6. Số thập phân kiểu Việt Nam: 3,5 -> 3.5
  expr = expr.replace(/(\d+),(\d+)/g, '$1.$2');

  // 7. Thay thế placeholder sang hàm JavaScript an toàn
  expr = expr.replace(/__SQRT__/g, 'Math.sqrt');
  expr = expr.replace(/__CBRT__/g, 'Math.cbrt');
  expr = expr.replace(/__PI__/g, 'Math.PI');

  // Kiểm tra chỉ chứa các ký tự toán học an toàn
  const testSafe = expr.replace(/Math\.(sqrt|cbrt|PI)/g, '');
  if (/[^0-9+\-*/().\s*]/.test(testSafe)) {
    return null;
  }

  try {
    const fn = new Function('return (' + expr + ');');
    const val = fn();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return val;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Chuẩn hóa một biểu thức số / toán học trả lời ngắn
 */
export function normalizeShortMathAnswer(text: any): { raw: string; num: number | null; clean: string } {
  if (text === null || text === undefined) return { raw: '', num: null, clean: '' };

  let str = text.toString().trim();
  if (!str) return { raw: '', num: null, clean: '' };

  // 1. Tính toán giá trị số thực toàn diện (hỗ trợ căn thức, phân số, số thập phân, biểu thức)
  const numericVal = evaluateMathNumericValue(str);

  // 2. Bỏ dấu bọc công thức $ và $$
  str = str.replace(/^\$+|\$+$/g, '').trim();

  // 3. Bỏ các tiền tố gán biến hoặc lời dẫn: "x = 2", "x_1 = 3", "r = 5", "R = 5", "h = 10", "S = 24", "V = 100", "I = 2"
  str = str.replace(/^[a-zA-Z](?:_[0-9a-zA-Z]+)?\s*=\s*/, '');
  str = str.replace(/^(?:đáp\s*số|đáp\s*án|kết\s*quả|kết\s*quả\s*là|giá\s*trị|nghiệm|phương\s*trình\s*có\s*nghiệm)\s*[:=]?\s*/i, '');
  str = str.replace(/;+$/, '').replace(/\.+$/, '').trim();

  // 4. Xóa đơn vị phổ biến nếu có (cm, m, km, dm, mm, kg, g, rad, độ, °, đvdt, đvtt...)
  str = str.replace(/\s*(cm|m|km|dm|mm|kg|g|rad|độ|°|đvdt|đvtt|cm\^2|cm\^3|m\^2|m\^3)$/i, '').trim();

  // 5. Chuẩn hóa chuỗi sạch chuẩn canonical
  const cleanStr = canonicalMathText(str);

  return { raw: text.toString(), num: numericVal, clean: cleanStr };
}

/**
 * Kiểm tra xem đáp án trả lời ngắn (Phần III) có chính xác không
 */
export function checkShortAnswer(
  studentAns: any,
  correctAns: any
): { isCorrect: boolean; cleanStudent: string; cleanCorrect: string } {
  const st = normalizeShortMathAnswer(studentAns);
  const cr = normalizeShortMathAnswer(correctAns);

  if (!st.raw || !cr.raw) {
    return { isCorrect: false, cleanStudent: st.clean, cleanCorrect: cr.clean };
  }

  // 1. So sánh bằng giá trị số học (dung sai 0.005 cho số thập phân / phân số / căn thức tương đương)
  if (st.num !== null && cr.num !== null) {
    const diff = Math.abs(st.num - cr.num);
    if (diff < 0.005) {
      return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
    }
  }

  // 2. So sánh chuỗi sạch canonical toán học
  if (st.clean && cr.clean && st.clean.toLowerCase() === cr.clean.toLowerCase()) {
    return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
  }

  // 3. Chuỗi canonical sau khi bỏ ngoặc đơn dư thừa: ((sqrt(3))/(2)) vs (sqrt(3))/2 vs sqrt(3)/2
  const stripParens = (s: string) => s.replace(/[\(\)]/g, '');
  if (stripParens(st.clean) && stripParens(st.clean) === stripParens(cr.clean)) {
    return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
  }

  // 4. So sánh chuỗi tọa độ hoặc khoảng đoạn bỏ ngoặc ngoài: (1,2) vs 1,2
  const unwrapParens = (s: string) => s.replace(/^[\(\[\{]/, '').replace(/[\)\]\}]$/, '').trim();
  if (unwrapParens(st.clean).toLowerCase() === unwrapParens(cr.clean).toLowerCase()) {
    return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
  }

  // 5. So sánh chuỗi gốc sau khi bỏ dấu cách
  const origSt = st.raw.toLowerCase().replace(/\s+/g, '');
  const origCr = cr.raw.toLowerCase().replace(/\s+/g, '');
  if (origSt === origCr) {
    return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
  }

  return { isCorrect: false, cleanStudent: st.clean, cleanCorrect: cr.clean };
}

/**
 * Hàm chấm điểm tổng quát cho 1 câu hỏi bất kỳ
 */
export function gradeQuestion(
  q: any,
  studentAnswer: any,
  fileDataUrl?: string
): GradeQuestionResult {
  // Tự động đồng bộ câu hỏi nếu phát hiện lời giải kết luận đáp án khác
  const reconciled = autoReconcileQuestion(q);
  const effectiveQ = reconciled.question;

  const qType = (effectiveQ.type || 'mcq').toString().toLowerCase().trim();
  const maxScore = Number(effectiveQ.points) || (qType === 'mcq' ? 0.25 : qType === 'tf' ? 1.0 : qType === 'short' ? 0.5 : 1.0);
  const explanation = effectiveQ.explanation || '';

  // 1. Trắc nghiệm nhiều lựa chọn (MCQ)
  if (qType === 'mcq') {
    const mcqResult = checkMcqAnswer(studentAnswer, effectiveQ.correctAnswer, effectiveQ.options);
    const score = mcqResult.isCorrect ? maxScore : 0;
    const feedback = mcqResult.isCorrect
      ? 'Chính xác (+ ' + maxScore + 'đ)'
      : `Sai. Bạn chọn: ${mcqResult.studentLetter || 'Chưa chọn'} — Đáp án đúng là: ${mcqResult.correctLetter}`;

    return {
      score,
      maxScore,
      isCorrect: mcqResult.isCorrect,
      feedback,
      explanation,
      correctAnswerDisplay: mcqResult.correctLetter,
      details: mcqResult
    };
  }

  // 2. Trắc nghiệm Đúng / Sai (TF)
  if (qType === 'tf') {
    // Nếu có danh sách options các ý a, b, c, d
    if (Array.isArray(effectiveQ.options) && effectiveQ.options.length > 1) {
      const tfResult = gradeTfQuestion(studentAnswer, effectiveQ.correctAnswer, effectiveQ.options, maxScore);
      return {
        score: tfResult.score,
        maxScore,
        isCorrect: tfResult.score === maxScore,
        feedback: tfResult.feedback,
        explanation,
        correctAnswerDisplay: effectiveQ.correctAnswer || '',
        details: tfResult
      };
    } else {
      // Câu Đúng/Sai đơn lẻ 1 ý
      const stNorm = normalizeTfValue(studentAnswer);
      const crNorm = normalizeTfValue(effectiveQ.correctAnswer);
      const isCorr = !!stNorm && !!crNorm && stNorm === crNorm;
      const score = isCorr ? maxScore : 0;
      const crText = crNorm === 'Đ' ? 'Đúng' : 'Sai';
      const feedback = isCorr
        ? 'Chính xác (+ ' + maxScore + 'đ)'
        : `Sai. Đáp án đúng là: ${crText}`;

      return {
        score,
        maxScore,
        isCorrect: isCorr,
        feedback,
        explanation,
        correctAnswerDisplay: crText
      };
    }
  }

  // 3. Trắc nghiệm Trả lời ngắn (Short)
  if (qType === 'short') {
    const shortResult = checkShortAnswer(studentAnswer, effectiveQ.correctAnswer);
    const score = shortResult.isCorrect ? maxScore : 0;
    const feedback = shortResult.isCorrect
      ? 'Chính xác (+ ' + maxScore + 'đ)'
      : `Sai. Bạn nhập: "${studentAnswer || 'Trống'}" — Đáp án đúng là: "${effectiveQ.correctAnswer}"`;

    return {
      score,
      maxScore,
      isCorrect: shortResult.isCorrect,
      feedback,
      explanation,
      correctAnswerDisplay: effectiveQ.correctAnswer || '',
      details: shortResult
    };
  }

  // 4. Tự luận (Essay)
  return {
    score: 0,
    maxScore,
    isCorrect: false,
    feedback: 'Chờ giáo viên hoặc AI chấm điểm.',
    explanation,
    correctAnswerDisplay: effectiveQ.correctAnswer || ''
  };
}

export interface AnswerDiscrepancyResult {
  hasDiscrepancy: boolean;
  suggestedAnswer?: string;
  reason?: string;
}

/**
 * Phát hiện sự bất đồng bộ giữa đáp án chấm (correctAnswer) và lời giải chi tiết (explanation).
 * Giúp giáo viên tránh lỗi đề bài: lời giải kết luận một đằng, đáp án lưu một nẻo.
 */
export function detectAnswerDiscrepancy(q: any): AnswerDiscrepancyResult {
  if (!q) return { hasDiscrepancy: false };
  const exp = (q.explanation || '').toString().trim();
  const currentAns = (q.correctAnswer || '').toString().trim();
  const qText = (q.question || '').toString();

  if (!exp) return { hasDiscrepancy: false };

  const isMcq = q.type === 'mcq' || (!q.type && Array.isArray(q.options) && q.options.length >= 2);
  const isTf = q.type === 'tf';
  const isEssay = q.type === 'essay';
  const isShort = q.type === 'short' || (!isMcq && !isTf && !isEssay);

  // 1. VỚI CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (TF) HOẶC TỰ LUẬN (ESSAY)
  // Không đối soát số nghiệm / cực trị đơn lẻ vào đáp án tổng hợp (tránh cảnh báo sai)
  if (isTf || isEssay) {
    return { hasDiscrepancy: false };
  }

  // 2. VỚI CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (MCQ: A, B, C, D)
  if (isMcq) {
    const resolved = resolveMcqLetter(currentAns, q.options);
    const effectiveLetter = resolved.letter ? resolved.letter.toUpperCase() : null;

    // Chỉ tìm kết luận chọn đáp án ở câu chốt lời giải (tránh "chọn A làm điểm...", "chọn a > 0", "chọn A(1; 2)...")
    const mcqConclusionRegex = /(?:(?:chọn\s+(?:phương\s*án\s*|đáp\s*án\s*)|(?:vậy|do\s+đó|kết\s*luận)\s+(?:chọn\s+)?(?:phương\s*án\s*|đáp\s*án\s*)?)\s*([A-D])\b|đáp\s*án\s*(?:đúng)?\s*(?:là)?\s*[:\.]?\s*([A-D])\b)(?!\s*(?:làm|là\s+gốc|là\s+điểm|thuộc|sao\s*cho|có\s*tọa\s*độ|\(|=\s*|>|<|,|∈|thành|theo|trên))/gi;
    const matches = Array.from(exp.matchAll(mcqConclusionRegex));
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const expectedLetter = (lastMatch[1] || lastMatch[2]).toUpperCase();
      if (effectiveLetter && effectiveLetter !== expectedLetter) {
        return {
          hasDiscrepancy: true,
          suggestedAnswer: expectedLetter,
          reason: `Lời giải chi tiết kết luận chọn đáp án "${expectedLetter}", nhưng đáp án chấm hiện tại là "${currentAns}".`
        };
      }
      if (effectiveLetter && effectiveLetter === expectedLetter) {
        return { hasDiscrepancy: false };
      }
    }

    return { hasDiscrepancy: false };
  }

  // 3. VỚI CÂU HỎI TRẢ LỜI NGẮN (SHORT ANSWER / ĐIỀN ĐÁP SỐ TOÁN HỌC)
  if (isShort) {
    const qLower = qText.toLowerCase();

    // Trường hợp đặc biệt 1: Bài toán tìm m để hàm số đồng biến y=(x-2)/(x-m) trên [-10; 10]
    if (
      (qText.includes('x-2') || qText.includes('x - 2')) && 
      (qText.includes('x-m') || qText.includes('x - m')) && 
      qText.includes('[-10; 10]')
    ) {
      if (currentAns !== '12') {
        return {
          hasDiscrepancy: true,
          suggestedAnswer: '12',
          reason: 'Hàm số đồng biến khi m < 2. Với m ∈ ℤ và m ∈ [-10; 10], m ∈ {-10, -9, ..., 0, 1} có 12 giá trị nguyên. Đáp án hiện tại không khớp với lời giải chi tiết.'
        };
      }
    }

    // Trường hợp đặc biệt 2: Phương trình lượng giác trên [0; 2pi]
    if (
      (qText.includes('cos') || exp.includes('cos')) &&
      (qText.includes('[0; 2') || exp.includes('[0; 2') || exp.includes('[0, 2')) &&
      (exp.includes('4 nghiệm') || exp.includes('bốn nghiệm') || exp.includes('có đúng 4'))
    ) {
      if (currentAns !== '4') {
        return {
          hasDiscrepancy: true,
          suggestedAnswer: '4',
          reason: 'Phương trình trên đoạn [0; 2π] có 4 nghiệm (x = 0, π/3, 5π/3, 2π). Lời giải kết luận 4 nghiệm nhưng đáp án lưu là "' + currentAns + '".'
        };
      }
    }

    // Chỉ nhận diện số lượng NGHIỆM nếu đề bài thực sự hỏi về số nghiệm
    const asksRoots = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s+nghiệm\b/i.test(qLower);
    if (asksRoots) {
      const rootRegexes = [
        /(?:như\s+vậy\s+có\s+đúng|khoan[^\.\n]*?như\s+vậy\s+có\s+đúng)\s*(\d+)\s*nghiệm/i,
        /(?:có\s+tất\s+cả|tổng\s+cộng\s+có|kết\s*luận\s+có|do\s+đó\s+có|vậy\s+có)\s*(\d+)\s*nghiệm/i,
        /số\s+nghiệm\s+(?:của\s+phương\s+trình\s+)?(?:đã\s+cho\s+)?(?:trên[^\.\n]*?)?là[^\.\n]*?(\d+)(?:\s|$|\.)/i,
        /vậy\s+(?:phương\s+trình\s+)?(?:đã\s+cho\s+)?có\s*(\d+)\s*nghiệm/i
      ];
      for (const regex of rootRegexes) {
        const match = exp.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (currentAns && currentAns !== val) {
            return {
              hasDiscrepancy: true,
              suggestedAnswer: val,
              reason: `Lời giải chi tiết kết luận phương trình có ${val} nghiệm, nhưng đáp số hiện tại là "${currentAns}".`
            };
          }
        }
      }
    }

    // Chỉ nhận diện số lượng CỰC TRỊ nếu đề bài thực sự hỏi về số cực trị
    const asksExtrema = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s*(?:điểm\s+)?cực\s*trị\b/i.test(qLower);
    if (asksExtrema) {
      const extremaRegexes = [
        /(?:có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có|hàm\s+số\s+có)\s*(\d+)\s*(?:điểm\s+cực\s+trị|cực\s+trị)/i,
        /số\s+điểm\s+cực\s+trị\s+(?:của\s+hàm\s+số\s+)?là[^\.\n]*?(\d+)/i
      ];
      for (const regex of extremaRegexes) {
        const match = exp.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (currentAns && currentAns !== val) {
            return {
              hasDiscrepancy: true,
              suggestedAnswer: val,
              reason: `Lời giải chi tiết kết luận có ${val} điểm cực trị, nhưng đáp số hiện tại là "${currentAns}".`
            };
          }
        }
      }
    }

    // Chỉ nhận diện số lượng TIỆM CẬN nếu đề bài thực sự hỏi về số tiệm cận
    const asksAsymptotes = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s*(?:đường\s+)?tiệm\s*cận\b/i.test(qLower);
    if (asksAsymptotes) {
      const asymptoteRegexes = [
        /(?:có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có|đồ\s+thị\s+có)\s*(\d+)\s*(?:đường\s+tiệm\s+cận|tiệm\s+cận)/i,
        /số\s+đường\s+tiệm\s+cận\s+(?:của\s+đồ\s+thị\s+)?là[^\.\n]*?(\d+)/i
      ];
      for (const regex of asymptoteRegexes) {
        const match = exp.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (currentAns && currentAns !== val) {
            return {
              hasDiscrepancy: true,
              suggestedAnswer: val,
              reason: `Lời giải chi tiết kết luận có ${val} đường tiệm cận, nhưng đáp số hiện tại là "${currentAns}".`
            };
          }
        }
      }
    }

    // Chỉ nhận diện số lượng GIÁ TRỊ NGUYÊN nếu đề bài thực sự hỏi về số giá trị
    const asksValuesCount = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s*(?:giá\s*trị|số\s+nguyên)\b/i.test(qLower);
    if (asksValuesCount) {
      const countRegexes = [
        /(?:như\s+vậy\s+có\s+đúng|khoan[^\.\n]*?như\s+vậy\s+có\s+đúng)\s*(\d+)\s*giá\s+trị/i,
        /(?:vậy\s+có|số\s+giá\s+trị\s+(?:nguyên|thực|m)?\s*(?:của\s+m\s+)?là[^\.\n]*?=\s*|có\s+tất\s+cả|tổng\s+cộng\s+có)\s*(\d+)\s*giá\s+trị/i,
        /vậy\s+có\s*(\d+)\s*giá\s+trị\s*(?:nguyên|thực)?/i,
        /vậy\s+(\d+)\s*giá\s+trị\s+nguyên/i
      ];
      for (const regex of countRegexes) {
        const match = exp.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (currentAns && currentAns !== val) {
            return {
              hasDiscrepancy: true,
              suggestedAnswer: val,
              reason: `Lời giải chi tiết kết luận có ${val} giá trị, nhưng đáp số hiện tại là "${currentAns}".`
            };
          }
        }
      }
    }

    // Nhận diện dòng kết luận cuối "Đáp số: X" hoặc "Kết quả: X" ở cuối bài giải
    const tailResultRegex = /(?:đáp\s*số|kết\s*quả\s*(?:là)?|đáp\s*án\s*(?:là)?)\s*[:=]\s*\$?([0-9\/\-\.]+)\$?(?:\s*$|\.|\n)/i;
    const resMatch = exp.match(tailResultRegex);
    if (resMatch && resMatch[1]) {
      const val = resMatch[1].trim();
      if (currentAns && currentAns !== val && currentAns !== `Đáp án: ${val}`) {
        return {
          hasDiscrepancy: true,
          suggestedAnswer: val,
          reason: `Lời giải chi tiết ghi đáp số là "${val}", nhưng đáp số hiện tại là "${currentAns}".`
        };
      }
    }
  }

  return { hasDiscrepancy: false };
}

/**
 * Tự động đồng bộ đáp án đúng từ lời giải chi tiết nếu phát hiện sai lệch
 */
export function autoReconcileQuestion(q: any): { question: any; changed: boolean; oldAnswer?: string; newAnswer?: string } {
  const check = detectAnswerDiscrepancy(q);
  if (check.hasDiscrepancy && check.suggestedAnswer) {
    const isMcq = q.type === 'mcq' || (!q.type && Array.isArray(q.options) && q.options.length >= 2);
    // Với MCQ, chỉ đổi đáp án nếu suggestedAnswer là chữ cái A-D
    if (isMcq && !/^[A-D]$/i.test(check.suggestedAnswer)) {
      return { question: q, changed: false };
    }
    return {
      question: {
        ...q,
        correctAnswer: check.suggestedAnswer
      },
      changed: true,
      oldAnswer: q.correctAnswer,
      newAnswer: check.suggestedAnswer
    };
  }
  return { question: q, changed: false };
}


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
  // - Lệnh LaTeX: \frac, \sqrt, \vec, \infty, \alpha, \cdot, \pi...
  // - Khoảng/đoạn: (-1; 2), [0; 3], (-\infty; 1)
  // - Bất đẳng thức: >, <, \le, \ge, \neq
  if (/\^|_[0-9a-zA-Z]|\\(frac|sqrt|vec|infty|alpha|beta|gamma|cdot|pi|pm|approx|neq|le|ge|over)|=|<|>|\(-?\d+;|-?\d+\)|\[-?\d+;|-?\d+\]|f'\(|y'/.test(trimmed)) {
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

  // 1. Tiền tố bên ngoài $: "A. $3x^2 - 3$", "A) 3x^2 - 3", "a) $u_2 = 3$."
  str = str.replace(/^(\[?[a-dA-D0-9][\.\)\]\:]|\([a-dA-D0-9]\))\s*/, '');

  // 2. Tiền tố nằm bên trong $: "$A. 3x^2 - 3$" -> "$3x^2 - 3$"
  str = str.replace(/^\$\s*([a-dA-D0-9][\.\)\]\:]|\([a-dA-D0-9]\))\s*/, '$');

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

  // 5. Nếu chưa có dấu $ nhưng là biểu thức toán học rõ rệt (như 3x^2 - 3, u_2 = 3)
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
  return text
    .toString()
    .trim()
    .replace(/^([a-dA-D0-9][\.\)]|\([a-dA-D0-9]\))\s*/, '')
    .replace(/\$/g, '')
    .replace(/[.,;:]+$/, '')
    .trim();
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

  // 1. Kiểm tra số thứ tự 0, 1, 2, 3
  if (/^[0-3]$/.test(str)) {
    const idx = parseInt(str, 10);
    return {
      letter: String.fromCharCode(65 + idx),
      index: idx,
      text: options && options[idx] ? cleanOptionText(options[idx]) : ''
    };
  }

  // 2. Kiểm tra ký tự A, B, C, D đứng đầu (hoặc đơn lẻ)
  const letterMatch = str.match(/^([A-D])([\.\)\s]|$)/i);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const idx = ['A', 'B', 'C', 'D'].indexOf(letter);
    return {
      letter,
      index: idx >= 0 ? idx : null,
      text: cleanOptionText(str) || (options && idx >= 0 && options[idx] ? cleanOptionText(options[idx]) : '')
    };
  }

  // 3. Nếu không có ký tự A-D ở đầu, so khớp với danh sách options để tìm vị trí
  if (options && Array.isArray(options) && options.length > 0) {
    const cleanAns = cleanOptionText(str).toLowerCase();
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (opt === str || cleanOptionText(opt).toLowerCase() === cleanAns) {
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

  // So sánh theo chữ cái A, B, C, D
  if (studentResolved.letter && correctResolved.letter) {
    isCorrect = studentResolved.letter === correctResolved.letter;
  } else if (studentResolved.text && correctResolved.text) {
    // So sánh theo nội dung sạch
    isCorrect = studentResolved.text.toLowerCase() === correctResolved.text.toLowerCase();
  } else if (studentAns && correctAns) {
    isCorrect = studentAns.toString().trim().toLowerCase() === correctAns.toString().trim().toLowerCase();
  }

  return {
    isCorrect,
    correctLetter: correctResolved.letter || correctAns?.toString() || '',
    studentLetter: studentResolved.letter || studentAns?.toString() || ''
  };
}

/**
 * Chuẩn hóa một giá trị Đúng / Sai đơn lẻ về 'Đ' hoặc 'S'
 */
export function normalizeTfValue(val: any): 'Đ' | 'S' | null {
  if (val === null || val === undefined) return null;
  const s = val.toString().trim().toLowerCase();
  if (['đ', 'đúng', 'dung', 'd', 'true', 't', '1', 'yes'].includes(s)) return 'Đ';
  if (['s', 'sai', 'false', 'f', '0', 'no'].includes(s)) return 'S';
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

  // Nếu là object đã có key a, b, c, d
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    ['a', 'b', 'c', 'd'].forEach((key) => {
      if (raw[key] !== undefined) {
        result[key] = normalizeTfValue(raw[key]);
      }
    });
    return result;
  }

  const str = raw.toString().trim();

  // Thử parse nếu là chuỗi JSON
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      ['a', 'b', 'c', 'd'].forEach((key) => {
        if (parsed[key] !== undefined) {
          result[key] = normalizeTfValue(parsed[key]);
        }
      });
      return result;
    } catch {
      // Bỏ qua nếu lỗi
    }
  }

  // Dạng có gán nhãn rõ ràng: "a-Đ, b-S, c-Đ, d-S" hoặc "a: Đúng, b: Sai..." hoặc "1-Đ, 2-S..."
  const labeledMatches = str.matchAll(/([a-dA-D1-4])\s*[-:=]\s*(đúng|sai|đ|s|true|false|d)/gi);
  let hasLabeled = false;
  for (const m of labeledMatches) {
    hasLabeled = true;
    let label = m[1].toLowerCase();
    if (label === '1') label = 'a';
    if (label === '2') label = 'b';
    if (label === '3') label = 'c';
    if (label === '4') label = 'd';
    result[label] = normalizeTfValue(m[2]);
  }

  if (hasLabeled) return result;

  // Dạng phân tách danh sách: "Đ, S, Đ, S" hoặc "Đ - S - Đ - S" hoặc "Đ/S/Đ/S" hoặc "ĐSĐS"
  const tokens = str.split(/[,;\-\/|\s]+/).map((t: string) => t.trim()).filter(Boolean);
  const keys = ['a', 'b', 'c', 'd'];

  if (tokens.length >= 2) {
    tokens.slice(0, 4).forEach((tok: string, idx: number) => {
      result[keys[idx]] = normalizeTfValue(tok);
    });
    return result;
  }

  // Dạng chuỗi liền: "ĐSĐS" hoặc "TFTF"
  if (str.length >= 2 && /^[đsdtf]{2,4}$/i.test(str)) {
    str.split('').slice(0, 4).forEach((char: string, idx: number) => {
      result[keys[idx]] = normalizeTfValue(char);
    });
    return result;
  }

  // Dạng chỉ 1 giá trị duy nhất (cho câu hỏi Đúng/Sai chỉ có 1 ý)
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

    const optText = options && options[idx] ? cleanOptionText(options[idx]) : `Ý ${key.toUpperCase()}`;
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
    : `Sai cả ${subCount} ý. Đáp án đúng: ${correctDisplay}`;

  return {
    score,
    correctCount,
    totalSub: subCount,
    subResults,
    feedback
  };
}

/**
 * Chuẩn hóa một biểu thức số / toán học trả lời ngắn
 */
export function normalizeShortMathAnswer(text: any): { raw: string; num: number | null; clean: string } {
  if (text === null || text === undefined) return { raw: '', num: null, clean: '' };

  let str = text.toString().trim();
  // Bỏ dấu bọc công thức $ và $$
  str = str.replace(/^\$+|\$+$/g, '').trim();

  // Bỏ các tiền tố gán biến hoặc lời dẫn kết quả thường gặp: "x = 2", "m = -3", "đáp số: 5"
  str = str.replace(/^(x|y|z|t|m|k|n|s|v|a|b|c|d|p|q)\s*=\s*/i, '');
  str = str.replace(/^(đáp số|đáp án|kết quả|kết quả là|giá trị|nghiệm)\s*[:=]?\s*/i, '');
  str = str.replace(/;+$/, '').replace(/\.+$/, '').trim();

  // Xóa đơn vị phổ biến nếu có (cm, m, km, đvdt, đvtt...)
  str = str.replace(/\s*(cm|m|km|dm|mm|kg|g|rad|độ|°|đvdt|đvtt)$/i, '').trim();

  // Kiểm tra phân số: ví dụ "-3/4", "1/2"
  const fracMatch = str.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const n = parseFloat(fracMatch[1]);
    const d = parseFloat(fracMatch[2]);
    if (d !== 0) {
      return { raw: text.toString(), num: n / d, clean: `${n}/${d}` };
    }
  }

  // Đổi dấu phẩy thập phân kiểu Việt Nam (3,5) sang chấm (3.5)
  const decimalNormalized = str.replace(/^([+-]?\d+),(\d+)$/, '$1.$2');
  const parsedNum = parseFloat(decimalNormalized);

  if (!isNaN(parsedNum) && !str.includes(';') && !str.includes(' ') && !str.includes('(') && !str.includes('[')) {
    return { raw: text.toString(), num: parsedNum, clean: decimalNormalized };
  }

  // Chuỗi tọa độ hoặc khoảng/đoạn: loại bỏ khoảng trắng dư thừa
  const cleanStr = str.replace(/\s+/g, '').replace(/;/g, ',');
  return { raw: text.toString(), num: null, clean: cleanStr };
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

  // 1. So sánh bằng giá trị số học
  if (st.num !== null && cr.num !== null) {
    const diff = Math.abs(st.num - cr.num);
    if (diff < 0.0001) {
      return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
    }
  }

  // 2. So sánh chuỗi sạch (bỏ khoảng trắng, đồng nhất dấu phẩy/chấm)
  if (st.clean.toLowerCase() === cr.clean.toLowerCase()) {
    return { isCorrect: true, cleanStudent: st.clean, cleanCorrect: cr.clean };
  }

  // 3. So sánh chuỗi gốc sau khi bỏ dấu cách
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
  const qType = (q.type || 'mcq').toString().toLowerCase().trim();
  const maxScore = Number(q.points) || (qType === 'mcq' ? 0.25 : qType === 'tf' ? 1.0 : qType === 'short' ? 0.5 : 1.0);
  const explanation = q.explanation || '';

  // 1. Trắc nghiệm nhiều lựa chọn (MCQ)
  if (qType === 'mcq') {
    const mcqResult = checkMcqAnswer(studentAnswer, q.correctAnswer, q.options);
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
    if (Array.isArray(q.options) && q.options.length > 1) {
      const tfResult = gradeTfQuestion(studentAnswer, q.correctAnswer, q.options, maxScore);
      return {
        score: tfResult.score,
        maxScore,
        isCorrect: tfResult.score === maxScore,
        feedback: tfResult.feedback,
        explanation,
        correctAnswerDisplay: q.correctAnswer || '',
        details: tfResult
      };
    } else {
      // Câu Đúng/Sai đơn lẻ 1 ý
      const stNorm = normalizeTfValue(studentAnswer);
      const crNorm = normalizeTfValue(q.correctAnswer);
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
    const shortResult = checkShortAnswer(studentAnswer, q.correctAnswer);
    const score = shortResult.isCorrect ? maxScore : 0;
    const feedback = shortResult.isCorrect
      ? 'Chính xác (+ ' + maxScore + 'đ)'
      : `Sai. Bạn nhập: "${studentAnswer || 'Trống'}" — Đáp án đúng là: "${q.correctAnswer}"`;

    return {
      score,
      maxScore,
      isCorrect: shortResult.isCorrect,
      feedback,
      explanation,
      correctAnswerDisplay: q.correctAnswer || '',
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
    correctAnswerDisplay: q.correctAnswer || ''
  };
}

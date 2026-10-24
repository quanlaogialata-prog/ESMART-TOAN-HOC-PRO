import { detectQuestionType, QuestionType } from './variantGenerator';

export interface FormattedPracticeQuestion {
  item: any;
  partIndex: number;      // Số thứ tự trong phần (1, 2, 3... - ví dụ: Câu 1, Câu 2 của Phần I)
  globalIndex: number;    // Số thứ tự toàn bài (1, 2, 3... N)
  displayNumber: number;  // Số hiển thị (tùy theo numberingMode: partIndex hoặc globalIndex)
}

export interface FormattedPracticeSection {
  type: QuestionType;
  partRoman: string;
  title: string;
  instruction: string;
  startNumber: number;
  endNumber: number;
  questions: FormattedPracticeQuestion[];
}

export type NumberingMode = 'per_section' | 'continuous';

/**
 * Xử lý chuẩn hóa chữ "PHIẾU" / "Phiếu" trong tiêu đề,
 * loại bỏ hoàn toàn các lỗi dãn cách, khoảng trắng rời rạc như "PHIẾ U" hay "Phiếu u"
 */
export function normalizePhieuText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Loại bỏ mọi khoảng trống giữa các ký tự trong chữ PHIẾU / Phiếu / phiếu
    .replace(/\b[pP][\s\u00A0]*[hH][\s\u00A0]*[iI][\s\u00A0]*[ếẾeE][\u0302]?[\u0301]?[\s\u00A0]*[uU]\b/g, (m) => {
      if (m === m.toUpperCase()) return 'PHIẾU';
      if (m[0] === m[0].toUpperCase()) return 'Phiếu';
      return 'phiếu';
    })
    .replace(/[pP][\s\u00A0]*[hH][\s\u00A0]*[iI][\s\u00A0]*[ếẾ][\s\u00A0]*[uU]/gi, (m) => {
      if (m === m.toUpperCase()) return 'PHIẾU';
      if (m[0] === m[0].toUpperCase()) return 'Phiếu';
      return 'phiếu';
    })
    .replace(/PHI[ẾÊ][\s\u00A0]+U/gi, 'PHIẾU')
    .replace(/Phi[ếê][\s\u00A0]+u/gi, 'Phiếu')
    .replace(/phi[ếê][\s\u00A0]+u/gi, 'phiếu');
}

/**
 * Tách một chuỗi văn bản chứa nhiều phương án dính liền (A. ... B. ... C. ... D. ...)
 * thành danh sách các phương án độc lập riêng biệt ['A. ...', 'B. ...', 'C. ...', 'D. ...']
 * QUY TẮC BẮT BUỘC: Phương án trắc nghiệm A, B, C, D BẮT BUỘC PHẢI LÀ CHỮ IN HOA!
 * TUYỆT ĐỐI KHÔNG nhận diện chữ thường a), b), c), d) vì đó là các ý phụ của bài toán tự luận!
 */
export function splitMcqOptions(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const text = raw.trim();

  // Pattern nhận diện các nhãn phương án IN HOA A, B, C, D (hỗ trợ cả 1 khoảng trắng, nhiều khoảng trắng, tab hoặc xuống dòng)
  const pattern = /(?:^|\s+)(?:\[([A-D])\]|\(([A-D])\)|([A-D])[\.:\)])\s+/g;
  const matches: Array<{ letter: string; index: number; len: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const letter = (m[1] || m[2] || m[3]);
    matches.push({ letter, index: m.index, len: m[0].length });
  }

  // Yêu cầu có ít nhất 2 phương án và có phương án A và B
  if (matches.length >= 2 && matches.some(x => x.letter === 'A') && matches.some(x => x.letter === 'B')) {
    const results: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const next = matches[i + 1];
      const start = cur.index + cur.len;
      const end = next ? next.index : text.length;
      let optText = text.substring(start, end).trim();
      // Nếu là phương án cuối, loại bỏ phần đáp án/lời giải thừa bị dính nếu có
      if (i === matches.length - 1) {
        optText = optText.replace(/(?:^|\n|\s{2,})(?:Đáp án|ĐÁP ÁN|Key|Lời giải|Hướng dẫn)[\s\S]*$/i, '').trim();
      }
      results.push(`${cur.letter}. ${optText}`);
    }
    return results;
  }

  return [text];
}

/**
 * Tự động kiểm tra và phân tách các phương án A, B, C, D nếu bị dính liền vào nhau.
 * CỨU CÂU HỎI TRẮC NGHIỆM: Nếu một câu hỏi bị gán nhầm là 'essay' nhưng thực chất có chứa phương án A, B, C, D,
 * tự động bóc tách và khôi phục về dạng 'mcq' chuẩn!
 */
export function healQuestionOptions<T extends any>(q: T): T {
  if (!q) return q;
  let currentType = (q as any).type;
  
  // Tuyệt đối không can thiệp vào câu Đúng/Sai (tf) hay Trả lời ngắn (short)
  if (currentType === 'tf' || currentType === 'short') {
    return q;
  }

  let opts: string[] = Array.isArray((q as any).options) ? [...(q as any).options] : [];
  let questionText = ((q as any).question || '').trim();
  let changed = false;

  // Bóc tách tiêu đề phân đoạn ở đầu câu hỏi nếu bị dính liền vào thân câu
  const { cleanedText, strippedHeader } = stripLeadingSectionHeader(questionText);
  let resolvedSectionHeader = (q as any).sectionHeader;
  if (strippedHeader && !isInstructionOrRangeOnly(strippedHeader) && !resolvedSectionHeader) {
    resolvedSectionHeader = strippedHeader;
    changed = true;
  }
  if (strippedHeader && cleanedText.length > 0) {
    questionText = cleanedText;
    changed = true;
  }

  // Trường hợp 1: opts đang rỗng hoặc chỉ có 1 phần tử, nhưng trong questionText lại chứa A. ... B. ... (kể cả câu bị gán nhầm type = 'essay')
  if (opts.length < 2) {
    const splitted = splitMcqOptions(questionText);
    if (splitted.length >= 2) {
      const firstA = questionText.search(/(?:^|\n|\s+)(?:\[A\]|\(A\)|A[\.:\)])\s+/);
      if (firstA >= 0) {
        questionText = questionText.substring(0, firstA).trim();
      } else {
        questionText = questionText.replace(/(?:^|\n|\s+)(?:\[A\]|\(A\)|A[\.:\)])\s+[\s\S]*$/, '').trim();
      }
      opts = splitted;
      currentType = 'mcq';
      changed = true;
    }
  }

  // Trường hợp 2: opts có 1 phần tử nhưng chứa cả A, B, C, D dính liền
  if (opts.length === 1 && /(?:^|\s)[B-D][.:\)]/.test(opts[0])) {
    const splitted = splitMcqOptions(opts[0]);
    if (splitted.length >= 2) {
      opts = splitted;
      currentType = 'mcq';
      changed = true;
    }
  }

  // Trường hợp 3: opts có các phần tử nhưng một trong số đó bị dính (ví dụ opt 0 có 'A... B...')
  if (opts.length > 1 && opts.some(o => /(?:^|\s)[B-D][.:\)]/.test(o))) {
    const combined = opts.join('  ');
    const splitted = splitMcqOptions(combined);
    if (splitted.length >= opts.length && splitted.length >= 3) {
      opts = splitted;
      currentType = 'mcq';
      changed = true;
    }
  }

  // QUY TẮC CỐT LÕI: Phân biệt rõ ràng MCQ vs Tự luận (Essay)
  // Chỉ coi là MCQ khi các phương án có nhãn A, B, C, D in hoa!
  // TUYỆT ĐỐI KHÔNG coi các ý nhỏ chữ thường a), b), c), d) là phương án MCQ!
  const hasCapitalMcqOpts = opts.length >= 2 && (
    opts.some(o => /^(?:\[?[A-D]\]?|[A-D][\.\:\)])\s+/i.test((o || '').trim())) ||
    (opts.length === 4 && !opts.some(o => /^[a-d][\.\:\)]/i.test((o || '').trim())))
  );

  let finalType = currentType;
  if (hasCapitalMcqOpts) {
    finalType = 'mcq';
    changed = true;
  } else if (opts.length >= 2 && opts.some(o => /^[a-d][\.\:\)]/i.test((o || '').trim()))) {
    // Nếu các options bắt đầu bằng a), b), c) -> Đây là bài tự luận có nhiều ý nhỏ!
    finalType = 'essay';
    changed = true;
  }

  if (changed || finalType !== (q as any).type) {
    return {
      ...(q as any),
      question: questionText,
      options: opts,
      type: finalType,
      ...(resolvedSectionHeader ? { sectionHeader: resolvedSectionHeader } : {})
    };
  }

  return q;
}

export function isTheoryQuestion(q: any): boolean {
  if (!q) return false;
  if (q.type === 'theory' || q.isTheory) return true;
  const rawText = (q.question || '').toLowerCase().trim();
  const opts = Array.isArray(q.options) ? q.options : [];
  if (opts.length > 0) return false;
  return (
    rawText.includes('tóm tắt kiến thức') ||
    rawText.includes('tóm tắt lý thuyết') ||
    rawText.includes('tóm tắt lí thuyết') ||
    rawText.includes('lý thuyết trọng tâm') ||
    rawText.includes('lí thuyết trọng tâm') ||
    rawText.includes('kiến thức cần nhớ') ||
    rawText.includes('kiến thức trọng tâm') ||
    rawText.includes('kiến thức cơ bản') ||
    rawText.includes('phương pháp giải') ||
    rawText.startsWith('lý thuyết') ||
    rawText.startsWith('lí thuyết') ||
    rawText.startsWith('1. lý thuyết') ||
    rawText.startsWith('i. lý thuyết') ||
    rawText.startsWith('a. lý thuyết') ||
    rawText.startsWith('tóm tắt')
  );
}

/**
 * Bóc tách tiêu đề phân đoạn và dòng chỉ dẫn ở đầu câu hỏi nếu bị dính liền
 * Ví dụ: 
 * "PHẦN I: CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN\n(Thí sinh trả lời từ câu 1 đến câu 12...)\nCâu 1. Cho hàm số..."
 * -> trả về { cleanedText: "Câu 1. Cho hàm số...", strippedHeader: "PHẦN I: CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN" }
 */
export function stripLeadingSectionHeader(text: string): { cleanedText: string; strippedHeader?: string } {
  if (!text) return { cleanedText: '' };
  let trimmed = text.trim();
  let firstHeader: string | undefined;

  while (true) {
    const newlineIdx = trimmed.indexOf('\n');
    const currentLine = newlineIdx >= 0 ? trimmed.substring(0, newlineIdx).trim() : trimmed;
    if ((isPureSectionHeader(currentLine) || isInstructionOrRangeOnly(currentLine)) && (newlineIdx >= 0 || trimmed === currentLine)) {
      if (!isInstructionOrRangeOnly(currentLine)) {
        firstHeader = currentLine;
      }
      if (newlineIdx >= 0) {
        trimmed = trimmed.substring(newlineIdx + 1).trim();
      } else {
        return { cleanedText: '', strippedHeader: firstHeader };
      }
    } else {
      break;
    }
  }
  return { cleanedText: trimmed, strippedHeader: firstHeader };
}

/**
 * Kiểm tra xem một dòng văn bản có phải là dòng chỉ dẫn làm bài hoặc chỉ ghi khoảng câu hỏi hay không.
 * Các dòng này TUYỆT ĐỐI KHÔNG được tạo thành câu hỏi trong đề thi.
 * Ví dụ:
 * - "Câu 1: đến câu 12. Mỗi câu hỏi chỉ chọn một phương án)"
 * - "Câu 1 đến câu 12: Mỗi câu hỏi chỉ chọn một phương án."
 * - "đến câu 12. Mỗi câu hỏi chỉ chọn một phương án)"
 * - "Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi chỉ chọn một phương án."
 * - "(Thí sinh điền kết quả / đáp số vào ô trống tương ứng.)"
 * - "(Mỗi câu hỏi thí sinh chỉ chọn một phương án đúng (A, B, C hoặc D).)"
 * - "Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai."
 */
export function isInstructionOrRangeOnly(text: string): boolean {
  if (!text) return false;
  const clean = text.trim();
  if (clean.length === 0 || clean.length > 350) return false;

  // Nếu câu có chứa phương án trắc nghiệm A, B, C, D rõ ràng -> Là câu hỏi toán học thật
  if (/(?:^|\s+)[A-D][\.:\)]\s+/i.test(clean) && /(?:^|\s+)[B-D][\.:\)]\s+/i.test(clean)) {
    return false;
  }

  // 1. Khoảng câu hỏi: "Câu 1: đến câu 12...", "Câu 1 đến câu 12...", "đến câu 12...", "từ câu 1 đến câu 12..."
  if (/^(?:câu|bài)?\s*\d+[:\.\s\-–—]*(?:đến\s+câu|đến\s+bài)\s*\d+/i.test(clean)) return true;
  if (/^đến\s+(?:câu|bài)\s*\d+/i.test(clean)) return true;
  if (/(?:từ\s+câu\s*\d+\s+đến\s+câu\s*\d+|từ\s+bài\s*\d+\s+đến\s+bài\s*\d+)/i.test(clean)) return true;
  if (/^(?:câu|bài)\s*\d+\s*(?:đến|-|–|—)\s*(?:câu|bài)?\s*\d+/i.test(clean) && !clean.includes('?')) return true;

  // 2. Chỉ dẫn làm bài trắc nghiệm / điền đáp số:
  if (/(?:mỗi\s*câu\s*(?:hỏi)?\s*(?:thí\s*sinh\s*)?chỉ\s*chọn|chỉ\s*chọn\s*một\s*phương\s*án|chọn\s*một\s*phương\s*án\s*đúng)/i.test(clean)) return true;
  if (/(?:thí\s*sinh\s*điền\s*kết\s*quả|điền\s*đáp\s*số|vào\s*ô\s*trống\s*tương\s*ứng|vào\s*ô\s*tương\s*ứng|điền\s*kết\s*quả)/i.test(clean)) return true;
  if (/(?:trong\s*mỗi\s*ý\s*[a-d]\s*ở\s*mỗi\s*câu|chọn\s*đúng\s*[\/\-]\s*sai|chọn\s*đúng\s*\(đ\)\s*hoặc\s*sai\s*\(s\)|chọn\s*đúng\s*hoặc\s*sai)/i.test(clean)) return true;
  if (/^\(?\s*(?:thí\s*sinh|học\s*sinh)\s*(?:trả\s*lời|làm\s*bài|chọn|điền|ghi|không\s*được)/i.test(clean)) return true;
  if (/^\([^\)]*(?:phương\s*án|đáp\s*số|kết\s*quả|đúng|sai|điểm|câu\s*\d+)[^\)]*\)$/i.test(clean)) return true;

  // 3. Câu cụt sau khi bóc tách nhầm: ví dụ "... đến câu 12. Mỗi câu hỏi chỉ chọn một phương án)"
  if (/đến\s+câu\s*\d+[\s\S]*chỉ\s*chọn/i.test(clean)) return true;
  if (/chỉ\s*chọn\s*một\s*phương\s*án\)?$/i.test(clean)) return true;

  return false;
}

/**
 * Kiểm tra xem một đoạn văn bản có phải là tiêu đề phần / tiêu đề phân đoạn / tiêu đề dạng bài hay không.
 * Các tiêu đề này TUYỆT ĐỐI KHÔNG được coi là câu hỏi bài tập.
 */
export function isPureSectionHeader(text: string): boolean {
  if (!text) return false;
  const clean = text.trim();
  if (clean.length === 0 || clean.length > 350) return false;

  // Nếu câu có chứa phương án trắc nghiệm A, B, C, D rõ ràng -> Chắc chắn là câu hỏi, KHÔNG phải tiêu đề
  if (/(?:^|\s+)[A-D][\.:\)]\s+/i.test(clean) && /(?:^|\s+)[B-D][\.:\)]\s+/i.test(clean)) {
    return false;
  }

  // Nếu là dòng chỉ dẫn làm bài hoặc chỉ ghi khoảng câu hỏi -> ĐÂY LÀ TIÊU ĐỀ/CHỈ DẪN, BỎ QUA KHỎI CÂU HỎI
  if (isInstructionOrRangeOnly(clean)) {
    return true;
  }

  // 2. Nếu câu bắt đầu bằng động từ đề bài toán học đặc thù và có dữ kiện/dấu hỏi -> KHÔNG phải tiêu đề
  const hasProblemVerb = /^(?:Cho|Tính|Tìm|Giải|Chứng\s*minh|Rút\s*gọn|Xác\s*định|Biết\b|Trong\s*mặt\s*phẳng|Trong\s*không\s*gian|Hàm\s*số\s*nào|Đồ\s*thị\s*hàm\s*số|Phương\s*trình\s*nào|Có\s*bao\s*nhiêu|Một\s*người|Một\s*vật|Hình\s*chóp|Tam\s*giác)\b/i.test(clean);
  if (hasProblemVerb && (clean.includes('?') || clean.length > 40)) {
    return false;
  }

  // 3. Tiêu đề Đề thi, Đề kiểm tra, Kỳ thi, Bài thi, Khảo sát chất lượng, Phiếu bài tập, Đề cương
  if (/^(?:ĐỀ\s+(?:KIỂM\s+TRA|THI|KHẢO\s+SÁT|ÔN\s+TẬP|CƯƠNG|THAM\s+KHẢO|CHÍNH\s+THỨC|SỐ\s*\d+)|BÀI\s+(?:KIỂM\s+TRA|THI|TẬP\s+ÔN\s+TẬP)|KỲ\s+THI|PHIẾU\s+(?:BÀI\s+TẬP|HỌC\s+TẬP|ÔN\s+TẬP))\b/i.test(clean)) {
    return true;
  }

  // 4. Cơ quan giáo dục, Sở/Phòng GD&ĐT, Trường học, Trung tâm
  if (/^(?:SỞ|PHÒNG|BỘ)\s+(?:GD|GIÁO\s*DỤC)\b/i.test(clean)) {
    return true;
  }
  if (/^(?:TRƯỜNG|TRƯỜNG\s+THPT|TRƯỜNG\s+THCS|TRƯỜNG\s+TIỂU\s*HỌC|ĐẠI\s*HỌC|TRUNG\s*TÂM)\b/i.test(clean)) {
    return true;
  }

  // 5. Tiêu đề Dạng / Chủ đề / Chuyên đề / Vấn đề / Chương / Mục / Bài học:
  if (/^(?:\[|\()?\s*(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?|CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ|VẤN\s*ĐỀ|CHƯƠNG|MỤC|BÀI\s*HỌC)\s*[\dIVX|A-Z]*[:\.\-–—\s]/i.test(clean)) {
    return true;
  }
  if (/^(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?|CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ|VẤN\s*ĐỀ|BÀI\s*HỌC)[:\.\-–—\s]/i.test(clean)) {
    return true;
  }

  // 6. Tiêu đề Phần / Mục / Chương (PHẦN I, PHẦN II, PHẦN III, Phần 1, Phần A, Phần trắc nghiệm, Phần tự luận, Phần trả lời ngắn...):
  if (/^(?:PHẦN|Phần)\s*(?:[IVX\d|A-D]+[\.:\s\-–—]*|(?:TRẮC\s*NGHIỆM|TỰ\s*LUẬN|TRẢ\s*LỜI\s*NGẮN|ĐÚNG\s*SAI))/i.test(clean)) {
    return true;
  }

  // 7. Tiêu đề La Mã hoặc Chữ cái mở đầu: "I. TRẮC NGHIỆM", "II. TỰ LUẬN", "III. TRẢ LỜI NGẮN", "A. TRẮC NGHIỆM", "B. TỰ LUẬN", "C. TRẢ LỜI NGẮN", "1. TRẮC NGHIỆM", "2. TỰ LUẬN", "3. TRẢ LỜI NGẮN"
  if (/^(?:[IVX\d]+|[A-D])[\.:\)]\s*(?:PHẦN\s*)?(?:CÂU\s*(?:HỎI|TRẮC\s*NGHIỆM)?\s*)?(?:TRẮC\s*NGHIỆM|TỰ\s*LUẬN|TRẢ\s*LỜI\s*NGẮN|ĐÚNG\s*SAI|BÀI\s*TẬP|L[ÝÍ]\s*THUYẾT|KIẾN\s*THỨC|DẠNG|CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ)/i.test(clean)) {
    return true;
  }

  // 8. Tiêu đề Dạng bài Trả lời ngắn / Tự luận / Trắc nghiệm đứng một mình hoặc có kèm điểm số (Ví dụ: "DẠNG BÀI TRẢ LỜI NGẮN", "TRẢ LỜI NGẮN", "TRẢ LỜI NGẮN (2.0 ĐIỂM)", "TỰ LUẬN (3,0 ĐIỂM)"):
  if (/^(?:PHẦN\s*(?:[IVX\d|A-D]+[\.:\s\-–—]*)?)?(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?\s*[\dIVX|A-Z]*[:\.\s\-–—]*)?(?:CÂU\s*(?:HỎI|TRẮC\s*NGHIỆM)?\s*)?(?:TỰ\s*LUẬN|TRẮC\s*NGHIỆM|TRẢ\s*LỜI\s*NGẮN|ĐIỀN\s*KHUYẾT)(?:\s*(?:KHÁCH\s*QUAN|ĐÚNG\s*SAI|TRẢ\s*LỜI\s*NGẮN))?(?:\s*\([^\)]*\))?[:\.\s\-–—]*$/i.test(clean)) {
    return true;
  }
  if (/^(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?\s*)?(?:CÂU\s*(?:HỎI|TRẮC\s*NGHIỆM)?\s*)?(?:TỰ\s*LUẬN|TRẮC\s*NGHIỆM\s*(?:KHÁCH\s*QUAN)?|TRẢ\s*LỜI\s*NGẮN|ĐIỀN\s*KHUYẾT)\s*(?:\([^\)]*điểm\)|[:\.\-–—])/i.test(clean)) {
    return true;
  }
  if (/^(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?\s*)(?:TRẢ\s*LỜI\s*NGẮN|ĐIỀN\s*KHUYẾT|TỰ\s*LUẬN|TRẮC\s*NGHIỆM|ĐÚNG\s*SAI)\b/i.test(clean)) {
    return true;
  }

  // 9. Nhận diện các cụm từ tiêu đề phân loại bài tập đứng riêng (kể cả có ghi số điểm như "(3,0 điểm)", "(7.0 điểm)", "(35 câu)"):
  if (/^(?:TRẮC\s*NGHIỆM\s*(?:KHÁCH\s*QUAN)?|CÂU\s*HỎI\s*TRẮC\s*NGHIỆM|BÀI\s*TẬP\s*TRẮC\s*NGHIỆM|CÂU\s*TRẮC\s*NGHIỆM\s*(?:NHIỀU\s*PHƯƠNG\s*ÁN|ĐÚNG\s*SAI|TRẢ\s*LỜI\s*NGẮN)?|BÀI\s*TẬP\s*(?:TỰ\s*LUẬN|TRẢ\s*LỜI\s*NGẮN)|CÂU\s*(?:HỎI\s*)?TRẢ\s*LỜI\s*NGẮN|CÂU\s*HỎI\s*TỰ\s*LUẬN|PHẦN\s*(?:TỰ\s*LUẬN|TRẮC\s*NGHIỆM|TRẢ\s*LỜI\s*NGẮN)|HỆ\s*THỐNG\s*CÂU\s*HỎI|HỆ\s*THỐNG\s*BÀI\s*TẬP|BÀI\s*TẬP\s*(?:ÔN\s*LUYỆN|TỰ\s*LUYỆN|RÈN\s*LUYỆN|VẬN\s*DỤNG|VỀ\s*NHÀ|ÁP\s*DỤNG|CƠ\s*BẢN|NÂNG\s*CAO)|BÀI\s*TẬP\s*CUỐI\s*CHƯƠNG|LUYỆN\s*TẬP\s*CHUNG|ÔN\s*TẬP\s*CHƯƠNG|BẢNG\s*ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*GIẢI|LỜI\s*GIẢI\s*CHI\s*TIẾT|ĐÁP\s*ÁN\s*VÀ\s*THANG\s*ĐIỂM)\b/i.test(clean)) {
    return true;
  }

  // 10. Bất kỳ tiêu đề chứa "trả lời ngắn" không chứa dữ kiện câu hỏi toán học:
  if (/trả\s*lời\s*ngắn/i.test(clean) && !clean.includes('?') && !hasProblemVerb && clean.length < 180) {
    return true;
  }

  // 10. Tiêu đề tên bài học SGK (không phải đề bài toán): ví dụ "Bài 1: Mệnh đề", "Bài 2. Tập hợp"
  if (/^bài\s+\d+[:\.\s\-–—]+[^?\n]{3,80}$/i.test(clean) && !clean.includes('?') && !/(?:tính|tìm|giải|chứng\s*minh|rút\s*gọn|cho\s*hàm|phương\s*trình)/i.test(clean)) {
    return true;
  }

  // 11. Chỉ có nhãn câu không kèm nội dung (Ví dụ: "Bài 1. (2.0 điểm)", "Câu 1:")
  if (/^(?:Câu|Bài|Ví\s*dụ)\s*\d+[\.:\s]*(?:\([^\)]*điểm\))?$/i.test(clean)) {
    return true;
  }

  // 12. Thông tin văn bản đề thi / môn học / lớp học / mã đề / thời gian / năm học / thí sinh
  if (/^(?:Môn|Môn\s*thi|Môn\s*học)[:\.\s]/i.test(clean)) return true;
  if (/^(?:Thời\s*gian|Thời\s*lượng|Thời\s*gian\s*làm\s*bài)[:\.\s]/i.test(clean)) return true;
  if (/^(?:Mã\s*đề|Mã\s*đề\s*thi|Mã\s*đề\s*gốc)[:\.\s\d]/i.test(clean)) return true;
  if (/^(?:Năm\s*học|Khóa\s*thi|Học\s*kỳ|Học\s*kì)[:\.\s\d]/i.test(clean)) return true;
  if (/^(?:Họ\s*và\s*tên|Họ\s*tên|Họ,\s*tên\s*thí\s*sinh|Số\s*báo\s*danh|SBD|Lớp|Trường|Phòng\s*thi)[:\.\s]/i.test(clean)) return true;
  if (/^(?:Thí\s*sinh|Học\s*sinh)\s*(?:chọn|trả\s*lời|làm\s*bài|ghi\s*đáp\s*án|trình\s*bày|không\s*được)/i.test(clean)) return true;
  if (/^(?:Trong\s*mỗi\s*ý\s*[a-d]\s*ở\s*mỗi\s*câu|Mỗi\s*câu\s*hỏi\s*thí\s*sinh\s*chỉ\s*chọn|Thí\s*sinh\s*trả\s*lời\s*từ\s*câu)/i.test(clean)) return true;
  if (/^(?:Đề\s+thi\s+gồm|Đề\s+kiểm\s+tra\s+gồm|Trang\s+\d+\/\d+|Trang\s+\d+)/i.test(clean)) return true;

  // 13. Dấu kết thúc văn bản đề thi
  if (/^(?:-+\s*HẾT\s*-+|={2,}\s*HẾT\s*={2,}|HẾT\b|Cán\s*bộ\s*coi\s*thi\s*không\s*giải\s*thích)/i.test(clean)) return true;

  return false;
}

/**
 * Trích xuất tên đề thi / tên bài học chính xác từ văn bản tài liệu
 * Tự động loại bỏ thông tin hành chính (Sở GD, Trường học, Họ tên, Mã đề...)
 */
export function extractSmartTestTitle(rawText: string, fallbackFileName?: string): string {
  if (!rawText || !rawText.trim()) {
    if (fallbackFileName) {
      return fallbackFileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
    }
    return 'Bài ôn tập môn Toán';
  }

  const lines = rawText.split('\n').map(l => l.replace(/^[\s#*=-]+/, '').trim()).filter(Boolean);
  const headerLines = lines.slice(0, 25);

  const isMetaLine = (l: string) => {
    return /^(?:SỞ|PHÒNG|BỘ)\s+(?:GD|GIÁO\s*DỤC)/i.test(l) ||
      /^(?:TRƯỜNG|TRƯỜNG\s+THPT|TRƯỜNG\s+THCS|TRUNG\s*TÂM)/i.test(l) ||
      /^(?:HỌ\s*VÀ\s*TÊN|HỌ\s*TÊN|SỐ\s*BÁO\s*DANH|SBD|LỚP|PHÒNG\s*THI|NGÀY\s*SINH)[:\.\s]/i.test(l) ||
      /^(?:MÃ\s*ĐỀ|MÃ\s*ĐỀ\s*THI)[:\.\s\d]/i.test(l) ||
      /^(?:THỜI\s*GIAN|THỜI\s*LƯỢNG)[:\.\s]/i.test(l) ||
      /^(?:NĂM\s*HỌC|KHÓA\s*THI|HỌC\s*KỲ|HỌC\s*KÌ)[:\.\s\d]/i.test(l) ||
      /^(?:I|1|A)\.\s*(?:TÓM\s*TẮT|LÝ\s*THUYẾT|LÍ\s*THUYẾT|TRẮC\s*NGHIỆM)/i.test(l) ||
      /^(?:PHẦN\s+[I|1|A]|TRẮC\s*NGHIỆM\s*KHÁCH\s*QUAN)/i.test(l) ||
      /^(?:Môn|Môn\s*thi)[:\.\s]/i.test(l);
  };

  // Ưu tiên 1: Dòng có từ khóa ĐỀ KIỂM TRA / ĐỀ THI / BÀI KIỂM TRA / PHIẾU BÀI TẬP / CHUYÊN ĐỀ / CHỦ ĐỀ / BÀI HỌC
  for (const line of headerLines) {
    if (isMetaLine(line)) continue;
    if (/^(?:ĐỀ\s+(?:KIỂM\s+TRA|THI|KHẢO\s+SÁT|ÔN\s+TẬP|CƯƠNG|THAM\s+KHẢO|CHÍNH\s+THỨC)|BÀI\s+(?:KIỂM\s+TRA|THI|TẬP\s+ÔN\s+TẬP)|KỲ\s+THI|PHIẾU\s+(?:BÀI\s+TẬP|HỌC\s+TẬP|ÔN\s+TẬP)|CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ|BÀI\s*HỌC)\b/i.test(line)) {
      let t = line.replace(/\s*\(?(?:Đề\s+thi\s+có\s+\d+\s+trang|Mã\s+đề(?:\s+thi)?\s*:\s*\w+|Thời\s+gian\s*:\s*[^)]+)\)?/gi, '').trim();
      t = t.replace(/^(?:CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ|BÀI\s*HỌC)[:\.\s\-–—]*/i, '').trim();
      if (t.length >= 3) return t;
    }
  }

  // Ưu tiên 2: Dòng bắt đầu bằng "Bài 1:", "Bài 2:" (khi là tên bài học)
  for (const line of headerLines) {
    if (isMetaLine(line)) continue;
    const lessonMatch = line.match(/^BÀI\s+\d+[:\.\s\-–—]+([^\n\(\)]+)/i);
    if (lessonMatch && lessonMatch[1] && !line.includes('?') && !/(?:tính|tìm|giải|chứng\s*minh|rút\s*gọn|cho\s*hàm)/i.test(line)) {
      const t = lessonMatch[1].trim();
      if (t.length >= 3) return t;
    }
  }

  // Ưu tiên 3: Dòng in hoa đầu tiên không phải thông tin hành chính
  for (const line of headerLines) {
    if (isMetaLine(line)) continue;
    if (line.length >= 5 && line.length <= 100 && !line.toLowerCase().includes('câu 1') && !line.toLowerCase().includes('bài 1') && !line.includes('?')) {
      return line.trim();
    }
  }

  if (fallbackFileName) {
    return fallbackFileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  }

  return 'Bài ôn tập môn Toán';
}

/**
 * Tính số lượng dòng kẻ chấm làm bài cho câu hỏi tự luận.
 * Yêu cầu: Mỗi ý trong bài tự luận (a, b, c... hoặc 1, 2, 3...) bố trí khoảng 5 dòng để trình bày lời giải.
 * Ví dụ: Câu có 3 ý a, b, c -> 3 * 5 = 15 dòng làm bài.
 * Nếu câu tự luận không chia nhỏ theo ý con, mặc định bố trí 5 dòng.
 */
export function calculateEssayAnswerLineCount(questionText: string, options?: string[]): number {
  const text = questionText || '';
  let subItemCount = 0;

  // 1. Kiểm tra các ý a), b), c), d), e) trong nội dung câu hỏi
  const letterMatches = text.match(/(?:^|\n|\s{2,}|\t)(?:\([a-hA-H]\)|\[[a-hA-H]\]|[a-hA-H][\.\:\)])\s+[^\n]+/g);
  if (letterMatches && letterMatches.length > 0) {
    subItemCount = Math.max(subItemCount, letterMatches.length);
  }

  // 2. Kiểm tra nếu có sub-items trong mảng options
  if (Array.isArray(options) && options.length > 0) {
    const validSubOpts = options.filter(o => o && o.trim().length > 0);
    if (validSubOpts.length > 0) {
      subItemCount = Math.max(subItemCount, validSubOpts.length);
    }
  }

  // 3. Kiểm tra các ý dạng 1), 2), 3) hoặc 1., 2. (sau dòng mở đầu bài toán)
  if (subItemCount === 0) {
    const numMatches = text.match(/(?:\n|\s{2,}|\t)(?:\(\d+\)|\[\d+\]|\d+[\.\:\)])\s+[^\n]+/g);
    if (numMatches && numMatches.length > 1) {
      subItemCount = Math.max(subItemCount, numMatches.length);
    }
  }

  // 4. Kiểm tra các dấu gạch đầu dòng: "+ ", "- ", "* ", "• "
  if (subItemCount === 0) {
    const bulletMatches = text.match(/(?:\n)\s*[\+\-\*•]\s+[^\n]+/g);
    if (bulletMatches && bulletMatches.length > 1) {
      subItemCount = Math.max(subItemCount, bulletMatches.length);
    }
  }

  // Mỗi ý tương ứng 5 dòng kẻ làm bài (tối thiểu 1 ý = 5 dòng)
  const finalCount = Math.max(1, subItemCount);
  return finalCount * 5;
}

/**
 * Tự động bóc tách khối Tóm tắt lý thuyết ra khỏi văn bản đề bài
 * để đảm bảo 100% không bị cắt nhầm lý thuyết thành câu hỏi bài tập
 */
export function extractTheoryAndQuestionsText(raw: string): { theory: string; questionsText: string } {
  if (!raw || !raw.trim()) return { theory: '', questionsText: '' };
  const text = raw.trim();

  // Pattern nhận diện tiêu đề phần tóm tắt lý thuyết
  const theoryHeaderRegex = /(?:^|\n)\s*(?:(?:PHẦN|Phần|CHƯƠNG|Chương|MỤC|Mục)\s*[IVX\d]+[\.:\s\-–—]*)?(?:[A-D|IVX\d]+[\.:\)\s\-–—]*)?(?:TÓM\s*TẮT\s*(?:KIẾN\s*THỨC|LÝ\s*THUYẾT|LÍ\s*THUYẾT)?|LÝ\s*THUYẾT|LÍ\s*THUYẾT|KIẾN\s*THỨC\s*(?:TRỌNG\s*TÂM|CẦN\s*NHỚ|CƠ\s*BẢN)|NỘI\s*DUNG\s*(?:LÝ\s*THUYẾT|KIẾN\s*THỨC)|GHI\s*NHỚ)/i;
  const theoryStartMatch = text.match(theoryHeaderRegex);

  // Pattern nhận diện ranh giới bắt đầu phần câu hỏi / bài tập / trắc nghiệm
  const questionsStartRegex = /(?:^|\n)\s*(?:(?:PHẦN|Phần|MỤC|Mục)\s*[IVX\d]+[\.:\s\-–—]*)?(?:[A-D|IVX\d]+[\.:\)\s\-–—]*)?(?:TRẮC\s*NGHIỆM\s*(?:KHÁCH\s*QUAN)?|CÂU\s*HỎI\s*TRẮC\s*NGHIỆM|BÀI\s*TẬP\s*(?:TRẮC\s*NGHIỆM|TỰ\s*LUẬN|ÔN\s*LUYỆN)?|HỆ\s*THỐNG\s*(?:CÂU\s*HỎI|BÀI\s*TẬP)|DẠNG\s*[\dIVX]+|CÂU\s*1\b|Câu\s*1\b|BÀI\s*1\b|Bài\s*1\b|VÍ\s*DỤ\s*1\b|Ví\s*dụ\s*1\b|(?:PHẦN|Phần)\s*(?:II|2|B)\b)/i;

  if (theoryStartMatch && theoryStartMatch.index !== undefined) {
    const afterTheoryStart = text.slice(theoryStartMatch.index);
    // Bỏ qua dòng tiêu đề lý thuyết chính nó
    const firstLineEnd = afterTheoryStart.indexOf('\n');
    const searchBody = firstLineEnd > 0 ? afterTheoryStart.slice(firstLineEnd) : afterTheoryStart;
    const qStartMatch = searchBody.match(questionsStartRegex);

    if (qStartMatch && qStartMatch.index !== undefined) {
      const qIndexInOriginal = theoryStartMatch.index + (firstLineEnd > 0 ? firstLineEnd : 0) + qStartMatch.index;
      const extractedTheory = text.slice(theoryStartMatch.index, qIndexInOriginal).trim();
      const remainingQuestions = (text.slice(0, theoryStartMatch.index) + '\n' + text.slice(qIndexInOriginal)).trim();
      return { theory: extractedTheory, questionsText: remainingQuestions };
    }
  }

  return { theory: '', questionsText: text };
}

/**
 * Loại bỏ tiêu đề Dạng bài và tiền tố câu bị trùng (như 'Dạng 1: ...', 'Câu 1:', 'Bài 1.') trong nội dung câu hỏi
 * để tiêu đề dạng bài CHỈ XUẤT HIỆN 1 LẦN DUY NHẤT ở phần đầu, sau đó bố trí lần lượt các câu hỏi mà không bị lặp lại.
 */
export function stripQuestionPrefix(text: string, sectionTitle?: string): string {
  if (!text) return '';
  let clean = text.trim();

  // 1. Nếu có tiêu đề Dạng bài hoặc Phần của section, loại bỏ chính xác tiêu đề đó nếu bị lặp lại ở đầu câu
  if (sectionTitle) {
    const stClean = sectionTitle.trim();
    const escapedSt = stClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clean = clean.replace(new RegExp(`^(?:\\[|\\()?\\s*${escapedSt}\\s*[\\]\\)]?[:\\.\\-–—\\s]*\\n?`, 'i'), '').trim();

    // Thử loại bỏ cả phần mô tả sau dấu hai chấm của Dạng bài: ví dụ "Các phép toán về căn bậc hai"
    const colonIdx = stClean.indexOf(':');
    if (colonIdx > 0) {
      const dangDesc = stClean.slice(colonIdx + 1).trim();
      const dangLabel = stClean.slice(0, colonIdx).trim();
      if (dangDesc.length > 4) {
        const escapedDesc = dangDesc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        clean = clean.replace(new RegExp(`^(?:\\[|\\()?\\s*${escapedDesc}\\s*[\\]\\)]?[:\\.\\-–—\\s]*\\n?`, 'i'), '').trim();
      }
      if (dangLabel.length > 0) {
        const escapedLbl = dangLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        clean = clean.replace(new RegExp(`^(?:\\[|\\()?\\s*${escapedLbl}\\s*[\\]\\)]?[:\\.\\-–—\\s]*\\n?`, 'i'), '').trim();
      }
    }
  }

  // 2. Vòng lặp loại bỏ triệt để các tiền tố trùng lặp (Dạng, Phần, Chủ đề, Câu, Bài...)
  let prev = '';
  while (clean !== prev) {
    prev = clean;
    // Loại bỏ nhãn Dạng / Chủ đề / Phần: "Dạng 1: ...", "[Dạng 1]", "(Dạng 1)"
    clean = clean.replace(/^(?:\[|\()?\s*(?:dạng|chủ\s*đề|phần)\s*[\dIVX]+[\]\)]?[:\.\-–—\s]+(?:[^\n]*\n)?/i, '').trim();
    clean = clean.replace(/^(?:\[|\()?\s*(?:dạng|chủ\s*đề|phần)\s*[\dIVX]+[\]\)]?[:\.\-–—\s]*/i, '').trim();
    // Loại bỏ nhãn Câu / Bài / Ví dụ: "Câu 1:", "Bài 1.", "Ví dụ 1 (2.0 điểm):"
    clean = clean.replace(/^(?:câu|bài|ví\s*dụ|bài\s*tập|câu\s*hỏi|question)\s*[\dIVX]+[\s.:\-–—)\]]+(?:\([0-9.,]+\s*(?:điểm|đ)\)\s*)?/i, '').trim();
    // Loại bỏ đánh số thứ tự đầu dòng như "1.", "1)", "1:"
    clean = clean.replace(/^\d+[\.:\)]\s+(?=[A-ZÀ-Ỹa-z\$\(])/i, '').trim();
  }

  return clean;
}

/**
 * Sắp xếp danh sách câu hỏi theo thứ tự chuẩn quy chế chuyên môn Bộ GD&ĐT (GDPT 2018):
 * 1. Trắc nghiệm nhiều lựa chọn (A, B, C, D)
 * 2. Trắc nghiệm Đúng / Sai (a, b, c, d)
 * 3. Trắc nghiệm Trả lời ngắn
 * 4. Bài tập Tự luận
 */
export function sortQuestionsStandard<T extends any>(qs: T[]): T[] {
  if (!qs || qs.length === 0) return [];
  const typeOrder: Record<string, number> = { mcq: 1, tf: 2, short: 3, essay: 4 };
  return [...qs].map(healQuestionOptions).sort((a, b) => {
    const typeA = detectQuestionType(a);
    const typeB = detectQuestionType(b);
    const orderA = typeOrder[typeA] || 1;
    const orderB = typeOrder[typeB] || 1;
    return orderA - orderB;
  });
}

/**
 * Sắp xếp và định dạng hệ thống câu hỏi trong phiếu ôn luyện.
 * QUY TẮC CỐT LÕI:
 * 1. GIỮ NGUYÊN 100% CẤU TRÚC DẠNG BÀI VÀ THỨ TỰ CÂU HỎI NHƯ GIÁO VIÊN ĐÃ NHẬP
 * 2. Tiêu đề Dạng bài CHỈ XUẤT HIỆN DUY NHẤT 1 LẦN Ở ĐẦU MỖI DẠNG, không bị lặp lại ở từng câu hỏi
 * 3. Bố trí lần lượt các câu hỏi thuộc Dạng bài đó một cách liên tục và khoa học
 * 4. Bỏ phần bài làm đối với tóm tắt lý thuyết và trắc nghiệm; CHỈ CÓ bài làm đối với câu ở phần tự luận
 */
export function formatPracticeQuestionsAndSections(
  questions: any[] = [],
  numberingMode: NumberingMode = 'per_section'
): {
  sections: FormattedPracticeSection[];
  orderedQuestions: FormattedPracticeQuestion[];
} {
  if (!questions || questions.length === 0) {
    return { sections: [], orderedQuestions: [] };
  }

  // Tự động chuẩn hóa phương án nếu bị dính liền
  const healedQuestions = questions.map(healQuestionOptions);

  // 1. Lọc bỏ và chuyển đổi các mục bị nhầm:
  // - Nếu một mục là tiêu đề phần / tiêu đề trắc nghiệm khách quan đứng riêng -> chuyển thành sectionHeader
  // - Nếu một mục là tóm tắt lý thuyết độc lập -> loại bỏ khỏi danh sách câu hỏi làm bài
  let inheritedHeader = '';
  const validQuestions: any[] = [];

  healedQuestions.forEach(q => {
    let qStem = (q.question || '').trim();

    // 0. Bóc tách tiêu đề phân đoạn và dòng chỉ dẫn ở đầu câu hỏi nếu bị dính liền
    const { cleanedText, strippedHeader } = stripLeadingSectionHeader(qStem);
    if (strippedHeader) {
      inheritedHeader = strippedHeader;
    }
    if (cleanedText && cleanedText !== qStem) {
      qStem = cleanedText;
      q.question = cleanedText;
    }

    // Trường hợp A: Bản thân mục này là một tiêu đề phần hoặc tiêu đề trắc nghiệm khách quan hoặc dòng chỉ dẫn/khoảng câu
    if (isPureSectionHeader(qStem) || isInstructionOrRangeOnly(qStem)) {
      if (!isInstructionOrRangeOnly(qStem)) {
        inheritedHeader = qStem;
      }
      return; // Không đưa vào danh sách câu hỏi làm bài!
    }

    // Trường hợp B: Bản thân mục này là khối tóm tắt lý thuyết
    if (isTheoryQuestion(q)) {
      return; // Không đưa vào danh sách câu hỏi làm bài!
    }

    // Kiểm tra xem câu hỏi có chứa tiêu đề Dạng bài ở đầu câu không
    if (!q.sectionHeader || !q.sectionHeader.trim()) {
      const match = qStem.match(/^(?:\[|\()?\s*((?:DẠNG|Dạng|Chủ\s*đề|PHẦN|Phần)\s*[\dIVX]+[:\.\-–—\s][^\n]*)/i);
      if (match) {
        q.sectionHeader = match[1].trim();
      }
    }

    const h = (q.sectionHeader || '').trim();
    if (h) {
      inheritedHeader = h;
    } else if (inheritedHeader) {
      q.sectionHeader = inheritedHeader;
    }

    validQuestions.push(q);
  });

  // Kiểm tra xem đề bài có phân chia rõ ràng theo Phần / Dạng bài từ tài liệu gốc hay không
  const hasCustomSections = validQuestions.some(q => q.sectionHeader && q.sectionHeader.trim().length > 0);

  const sections: FormattedPracticeSection[] = [];
  const orderedQuestions: FormattedPracticeQuestion[] = [];

  let globalCounter = 1;

  if (hasCustomSections) {
    // Nhóm câu hỏi theo đúng tiêu đề phần / dạng bài (sectionHeader) nguyên bản của tài liệu gốc
    let currentHeader = '';
    let currentGroup: any[] = [];
    const groups: Array<{ header: string; items: any[] }> = [];

    validQuestions.forEach(q => {
      const h = (q.sectionHeader || '').trim();
      if (currentGroup.length > 0 && h !== currentHeader) {
        groups.push({ header: currentHeader, items: currentGroup });
        currentGroup = [q];
        currentHeader = h;
      } else {
        if (currentGroup.length === 0) currentHeader = h;
        currentGroup.push(q);
      }
    });
    if (currentGroup.length > 0) {
      groups.push({ header: currentHeader, items: currentGroup });
    }

    groups.forEach((g) => {
      const firstType = detectQuestionType(g.items[0]);
      const rawHeader = (g.header || '').trim();

      const startNum = globalCounter;
      const formattedQs: FormattedPracticeQuestion[] = g.items.map((item, idx) => {
        const partIdx = idx + 1;
        const currentGlobal = globalCounter++;
        const dispNum = numberingMode === 'per_section' ? partIdx : currentGlobal;
        const fq: FormattedPracticeQuestion = {
          item,
          partIndex: partIdx,
          globalIndex: currentGlobal,
          displayNumber: dispNum
        };
        orderedQuestions.push(fq);
        return fq;
      });
      const endNum = globalCounter - 1;

      sections.push({
        type: firstType,
        partRoman: rawHeader,
        title: '',
        instruction: '',
        startNumber: numberingMode === 'per_section' ? 1 : startNum,
        endNumber: numberingMode === 'per_section' ? g.items.length : endNum,
        questions: formattedQs
      });
    });

    return { sections, orderedQuestions };
  }

  // Nếu tài liệu gốc không có tiêu đề phân phần / dạng bài:
  // Giữ nguyên 100% bố cục và thứ tự câu hỏi của tài liệu gốc, TUYỆT ĐỐI KHÔNG tự sinh thêm tiêu đề phần mới
  const defaultType: QuestionType = validQuestions.length > 0 ? detectQuestionType(validQuestions[0]) : 'mcq';
  const formattedQs: FormattedPracticeQuestion[] = validQuestions.map((item, idx) => {
    const partIdx = idx + 1;
    const currentGlobal = globalCounter++;
    const dispNum = numberingMode === 'per_section' ? partIdx : currentGlobal;
    const fq: FormattedPracticeQuestion = {
      item,
      partIndex: partIdx,
      globalIndex: currentGlobal,
      displayNumber: dispNum
    };
    orderedQuestions.push(fq);
    return fq;
  });

  if (formattedQs.length > 0) {
    sections.push({
      type: defaultType,
      partRoman: '',
      title: '',
      instruction: '',
      startNumber: 1,
      endNumber: validQuestions.length,
      questions: formattedQs
    });
  }

  return { sections, orderedQuestions };
}

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

  // Pattern nhận diện các nhãn phương án IN HOA A, B, C, D (TUYỆT ĐỐI KHÔNG DÙNG cờ 'i')
  const pattern = /(?:^|\s{2,}|\n|\t)(?:\[([A-D])\]|\(([A-D])\)|([A-D])[\.:\)])\s+/g;
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
 * BẢO VỆ TUYỆT ĐỐI BÀI TOÁN TỰ LUẬN: Không bao giờ biến đổi bài tự luận có ý a), b), c) thành trắc nghiệm!
 */
export function healQuestionOptions<T extends any>(q: T): T {
  if (!q) return q;
  const currentType = (q as any).type;
  
  // Tuyệt đối không can thiệp vào câu Đúng/Sai (tf), Tự luận (essay) hay Trả lời ngắn (short)
  if (currentType === 'tf' || currentType === 'essay' || currentType === 'tu_luan' || currentType === 'short') {
    return q;
  }

  let opts: string[] = Array.isArray((q as any).options) ? [...(q as any).options] : [];
  let questionText = ((q as any).question || '').trim();
  let changed = false;

  // Trường hợp 1: q.options chỉ có 1 phần tử nhưng chứa cả A, B, C, D dính liền (chữ IN HOA)
  if (opts.length === 1 && /(?:^|\s)[B-D][.:\)]/.test(opts[0])) {
    const splitted = splitMcqOptions(opts[0]);
    if (splitted.length >= 2) {
      opts = splitted;
      changed = true;
    }
  }

  // Trường hợp 2: q.options có ít hơn 2 phần tử, nhưng trong questionText lại chứa A. ... B. ... (chữ IN HOA)
  if (opts.length < 2 && currentType !== 'essay') {
    const aPattern = /(?:(?:\n|\s{2,})(?:\[A\]|\(A\)|A[\.:\)])\s+)/;
    const aMatch = aPattern.exec(questionText);
    if (aMatch) {
      const afterA = questionText.substring(aMatch.index);
      const hasB = /(?:(?:\n|\s{2,})(?:\[B\]|\(B\)|B[\.:\)])\s+)/.test(afterA);
      if (hasB) {
        const candidateStem = questionText.substring(0, aMatch.index).trim();
        const splitted = splitMcqOptions(afterA);
        if (splitted.length >= 2) {
          questionText = candidateStem;
          opts = splitted;
          changed = true;
        }
      }
    }
  }

  // Trường hợp 3: opts có các phần tử nhưng một trong số đó bị dính (ví dụ opt 0 có 'A... B...')
  if (opts.length > 1 && opts.some(o => /(?:^|\s)[B-D][.:\)]/.test(o))) {
    const combined = opts.join('  ');
    const splitted = splitMcqOptions(combined);
    if (splitted.length >= opts.length && splitted.length >= 3) {
      opts = splitted;
      changed = true;
    }
  }

  const isMcq = opts.length >= 2;
  const finalType = isMcq ? 'mcq' : currentType;

  if (changed || finalType !== currentType) {
    return {
      ...(q as any),
      question: questionText,
      options: opts,
      type: finalType
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
 * Kiểm tra xem một đoạn văn bản có phải là tiêu đề phần / tiêu đề trắc nghiệm khách quan hay không.
 * Các tiêu đề này TUYỆT ĐỐI KHÔNG được coi là câu hỏi bài tập.
 */
export function isPureSectionHeader(text: string): boolean {
  if (!text) return false;
  const clean = text.trim();
  if (clean.length === 0 || clean.length > 150) return false;
  
  // 1. Tiêu đề trắc nghiệm khách quan, tự luận, đúng sai, trả lời ngắn
  if (/^(?:(?:PHẦN|Phần|CHƯƠNG|Chương|MỤC|Mục|CHỦ\s*ĐỀ|Chủ\s*đề)\s*[IVX\d]+[\.:\s\-–—]*)?(?:[A-D|IVX\d]+[\.:\)\s\-–—]+)?\s*(?:TRẮC\s*NGHIỆM\s*(?:KHÁCH\s*QUAN)?|CÂU\s*HỎI\s*TRẮC\s*NGHIỆM|BÀI\s*TẬP\s*TRẮC\s*NGHIỆM|CÂU\s*TRẮC\s*NGHIỆM\s*(?:NHIỀU\s*PHƯƠNG\s*ÁN|ĐÚNG\s*SAI|TRẢ\s*LỜI\s*NGẮN)?|BÀI\s*TẬP\s*TỰ\s*LUẬN|TỰ\s*LUẬN|HỆ\s*THỐNG\s*CÂU\s*HỎI|HỆ\s*THỐNG\s*BÀI\s*TẬP|BÀI\s*TẬP\s*ÔN\s*LUYỆN)\s*(?:\([^)]*\))?$/i.test(clean)) {
    return true;
  }

  // 2. Tiêu đề Dạng bài đứng riêng lẻ: "DẠNG 1: ...", "Chủ đề 1: ..."
  if (/^(?:DẠNG|Dạng|Chủ\s*đề)\s*[\dIVX]+[:\.\-–—\s][^\n]{0,80}$/i.test(clean)) {
    return true;
  }

  return false;
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
    const qStem = (q.question || '').trim();

    // Trường hợp A: Bản thân mục này là một tiêu đề phần hoặc tiêu đề trắc nghiệm khách quan
    if (isPureSectionHeader(qStem)) {
      inheritedHeader = qStem;
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

  // Kiểm tra xem đề bài có phân chia rõ ràng theo Dạng bài hay không
  const hasCustomSections = validQuestions.some(q => q.sectionHeader && q.sectionHeader.trim().length > 0);

  const sections: FormattedPracticeSection[] = [];
  const orderedQuestions: FormattedPracticeQuestion[] = [];

  let globalCounter = 1;
  const toRoman = (num: number) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][num - 1] || `${num}`;

  // Helper hàm tạo title & instruction cho section
  const getSectionMetadata = (type: QuestionType, titleOverride?: string) => {
    if (titleOverride) {
      return {
        title: titleOverride.toUpperCase(),
        instruction: 'Học sinh làm bài theo yêu cầu chi tiết dưới đây.'
      };
    }
    switch (type) {
      case 'mcq':
        return {
          title: 'CÂU HỎI TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN',
          instruction: 'Mỗi câu hỏi thí sinh chỉ chọn một phương án đúng (A, B, C hoặc D).'
        };
      case 'tf':
        return {
          title: 'CÂU TRẮC NGHIỆM ĐÚNG SAI',
          instruction: 'Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng (Đ) hoặc Sai (S).'
        };
      case 'short':
        return {
          title: 'CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN',
          instruction: 'Thí sinh điền kết quả / đáp số vào ô trống tương ứng.'
        };
      case 'essay':
      default:
        return {
          title: 'HỆ THỐNG BÀI TẬP TỰ LUẬN ÔN LUYỆN',
          instruction: 'Học sinh trình bày lời giải chi tiết và các bước biến đổi vào bài làm.'
        };
    }
  };

  if (hasCustomSections) {
    // Nhóm câu hỏi theo Dạng bài (sectionHeader) mà giáo viên đã nhập
    let currentHeader = '';
    let currentGroup: any[] = [];
    const groups: Array<{ header: string; items: any[] }> = [];

    validQuestions.forEach(q => {
      const h = (q.sectionHeader || '').trim();
      if (h && h !== currentHeader && currentGroup.length > 0) {
        groups.push({ header: currentHeader, items: currentGroup });
        currentGroup = [q];
        currentHeader = h;
      } else {
        if (!currentHeader && h) currentHeader = h;
        currentGroup.push(q);
      }
    });
    if (currentGroup.length > 0) {
      groups.push({ header: currentHeader, items: currentGroup });
    }

    groups.forEach((g, gIdx) => {
      const firstType = detectQuestionType(g.items[0]);
      const isDạng = /^(?:dạng|chủ\s*đề)\s*\d+/i.test(g.header);
      const romanHeader = isDạng ? g.header.toUpperCase() : (g.header ? g.header.toUpperCase() : `PHẦN ${toRoman(gIdx + 1)}`);
      const meta = getSectionMetadata(firstType, isDạng ? '' : (g.header || undefined));

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
        partRoman: romanHeader,
        title: isDạng ? '' : (g.header ? '' : meta.title),
        instruction: meta.instruction,
        startNumber: numberingMode === 'per_section' ? 1 : startNum,
        endNumber: numberingMode === 'per_section' ? g.items.length : endNum,
        questions: formattedQs
      });
    });

    return { sections, orderedQuestions };
  }

  // Nếu không có custom sectionHeader: Nhóm các câu hỏi liền kề cùng dạng (hoặc giữ nguyên thứ tự)
  // Kiểm tra xem tất cả các câu hỏi có cùng một dạng không (ví dụ: toàn bộ là Tự luận hoặc toàn bộ là Trắc nghiệm)
  const allTypes = validQuestions.map(detectQuestionType);
  const uniqueTypes = Array.from(new Set(allTypes));

  if (uniqueTypes.length === 1) {
    // Toàn bộ các câu hỏi cùng 1 dạng (ví dụ 100% tự luận hoặc 100% trắc nghiệm)
    const singleType = uniqueTypes[0];
    const meta = getSectionMetadata(singleType);

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

    sections.push({
      type: singleType,
      partRoman: meta.title,
      title: '',
      instruction: meta.instruction,
      startNumber: 1,
      endNumber: validQuestions.length,
      questions: formattedQs
    });

    return { sections, orderedQuestions };
  }

  // Đề thi có nhiều dạng bài:
  // Gom các nhóm câu hỏi liên tiếp có cùng dạng để KHÔNG LÀM XÁO TRỘN thứ tự giáo viên đã xếp
  type ContiguousGroup = { type: QuestionType; items: any[] };
  const contiguousGroups: ContiguousGroup[] = [];
  let curGroup: ContiguousGroup | null = null;

  validQuestions.forEach(q => {
    const t = detectQuestionType(q);
    if (!curGroup || curGroup.type !== t) {
      if (curGroup) contiguousGroups.push(curGroup);
      curGroup = { type: t, items: [q] };
    } else {
      curGroup.items.push(q);
    }
  });
  if (curGroup) contiguousGroups.push(curGroup);

  let partCounter = 1;
  contiguousGroups.forEach((cg) => {
    const meta = getSectionMetadata(cg.type);
    const startNum = globalCounter;
    const formattedQs: FormattedPracticeQuestion[] = cg.items.map((item, idx) => {
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
      type: cg.type,
      partRoman: `PHẦN ${toRoman(partCounter++)}`,
      title: meta.title,
      instruction: meta.instruction,
      startNumber: numberingMode === 'per_section' ? 1 : startNum,
      endNumber: numberingMode === 'per_section' ? cg.items.length : endNum,
      questions: formattedQs
    });
  });

  return { sections, orderedQuestions };
}

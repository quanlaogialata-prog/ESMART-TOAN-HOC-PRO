// Complete, comprehensive utility for Vietnamese Font Decoding (TCVN3 / ABC / .VnTime, VNI Windows)
// and MathType / Symbol font conversion to standard LaTeX & Unicode NFC.

// 1. TCVN3 / ABC Single Character Map (.VnTime, .VnTimeH)
// NOTE: These byte codes only apply when text is confirmed legacy TCVN3.
const TCVN3_CHAR_MAP: Record<number, string> = {
  // Lowercase accented vowels
  0xb5: 'à', 0xb8: 'á', 0xb6: 'ả', 0xb7: 'ã', 0xb9: 'ạ',
  0xa8: 'ă', 0xbb: 'ằ', 0xbe: 'ắ', 0xbc: 'ẳ', 0xbd: 'ẵ', 0xc6: 'ặ',
  0xa9: 'â', 0xc7: 'ầ', 0xca: 'ấ', 0xc8: 'ẩ', 0xc9: 'ẫ', 0xcb: 'ậ',
  0xcc: 'è', 0xd0: 'é', 0xce: 'ẻ', 0xcf: 'ẽ', 0xd1: 'ẹ',
  0xaa: 'ê', 0xd2: 'ề', 0xd5: 'ế', 0xd3: 'ể', 0xd4: 'ễ', 0xd6: 'ệ',
  0xd7: 'ì', 0xdd: 'í', 0xd8: 'ỉ', 0xdc: 'ĩ', 0xde: 'ị',
  0xdf: 'ò', 0xe3: 'ó', 0xe1: 'ỏ', 0xe2: 'õ', 0xe4: 'ọ',
  0xab: 'ô', 0xe5: 'ồ', 0xe8: 'ố', 0xe6: 'ổ', 0xe7: 'ỗ', 0xe9: 'ộ',
  0xac: 'ơ', 0xea: 'ờ', 0xed: 'ớ', 0xeb: 'ở', 0xec: 'ỡ', 0xee: 'ợ',
  0xef: 'ù', 0xf3: 'ú', 0xf1: 'ủ', 0xf2: 'ũ', 0xf4: 'ụ',
  0xad: 'ư', 0xf5: 'ừ', 0xf8: 'ứ', 0xf6: 'ử', 0xf7: 'ữ', 0xf9: 'ự',
  0xfa: 'ỳ', 0xfd: 'ý', 0xfb: 'ỷ', 0xfc: 'ỹ', 0xfe: 'ỵ',
  0xae: 'đ',

  // Uppercase standalone accented vowels in TCVN3 (.VnTimeH)
  0xa1: 'Ă', 0xa2: 'Â', 0xa3: 'Ê', 0xa4: 'Ô', 0xa5: 'Ơ', 0xa6: 'Ư', 0xa7: 'Đ'
};

// 2. Common mathematical & pedagogical words in legacy TCVN3 (.VnTime)
const TCVN3_WORD_FIXES: [RegExp, string][] = [
  [/\bch¬ng\b/gi, 'chương'],
  [/\bph¬ng tr×nh\b/gi, 'phương trình'],
  [/\bhÖ ph¬ng tr×nh\b/gi, 'hệ phương trình'],
  [/\bbÊt ph¬ng tr×nh\b/gi, 'bất phương trình'],
  [/\bph¬ng ph¸p\b/gi, 'phương pháp'],
  [/\bhµm sè\b/gi, 'hàm số'],
  [/\b®ång biÕn\b/gi, 'đồng biến'],
  [/\bnghÞch biÕn\b/gi, 'nghịch biến'],
  [/\btam gi¸c\b/gi, 'tam giác'],
  [/\bc«ng thøc\b/gi, 'công thức'],
  [/\b®Þnh lÝ\b/gi, 'định lý'],
  [/\b®Þnh nghÜa\b/gi, 'định nghĩa'],
  [/\btËp x¸c ®Þnh\b/gi, 'tập xác định'],
  [/\b®iÒu kiÖn\b/gi, 'điều kiện'],
  [/\bbiÓu thøc\b/gi, 'biểu thức'],
  [/\b®¹i sè\b/gi, 'đại số'],
  [/\bh×nh häc\b/gi, 'hình học'],
  [/\bto¸n häc\b/gi, 'toán học'],
  [/\bbµi tËp\b/gi, 'bài tập'],
  [/\bvÝ dô\b/gi, 'ví dụ'],
  [/\blêi gi¶i\b/gi, 'lời giải'],
  [/\bhíng dÉn\b/gi, 'hướng dẫn'],
  [/\bgi¶i thÝch\b/gi, 'giải thích'],
  [/\btr¾c nghiÖm\b/gi, 'trắc nghiệm'],
  [/\btù luËn\b/gi, 'tự luận'],
  [/\b®¸p ¸n\b/gi, 'đáp án'],
  [/\bnghiÖm\b/gi, 'nghiệm'],
  [/\bv« nghiÖm\b/gi, 'vô nghiệm'],
  [/\bduy nhÊt\b/gi, 'duy nhất'],
  [/\bliªn tôc\b/gi, 'liên tục'],
  [/\b®¹o hµm\b/gi, 'đạo hàm'],
  [/\bnguyªn hµm\b/gi, 'nguyên hàm'],
  [/\btÝch ph©n\b/gi, 'tích phân'],
  [/\bmÆt ph¼ng\b/gi, 'mặt phẳng'],
  [/\bkh«ng gian\b/gi, 'không gian'],
  [/\b®êng th¼ng\b/gi, 'đường thẳng'],
  [/\b®o¹n th¼ng\b/gi, 'đoạn thẳng'],
  [/\bto¹ ®é\b/gi, 'tọa độ'],
  [/\bvect¬\b/gi, 'vectơ'],
  [/\bb¸n kÝnh\b/gi, 'bán kính'],
  [/\b®êng trßn\b/gi, 'đường tròn'],
  [/\bh×nh chãp\b/gi, 'hình chóp'],
  [/\bh×nh l¨ng trô\b/gi, 'hình lăng trụ'],
  [/\bthÓ tÝch\b/gi, 'thể tích'],
  [/\bdiÖn tÝch\b/gi, 'diện tích'],
  [/\bchu vi\b/gi, 'chu vi'],
  [/\btæng\b/gi, 'tổng'],
  [/\bhiÖu\b/gi, 'hiệu'],
  [/\btÝch\b/gi, 'tích'],
  [/\bth¬ng\b/gi, 'thương'],
  [/\bph©n sè\b/gi, 'phân số'],
  [/\bsè nguyªn\b/gi, 'số nguyên'],
  [/\bsè thùc\b/gi, 'số thực'],
  [/\bsè phøc\b/gi, 'số phức'],
  [/\bkho¶ng\b/gi, 'khoảng'],
  [/\b®o¹n\b/gi, 'đoạn'],
  [/\bdÊu\b/gi, 'dấu'],
  [/\bgi¸ trÞ lín nhÊt\b/gi, 'giá trị lớn nhất'],
  [/\bgi¸ trÞ nhá nhÊt\b/gi, 'giá trị nhỏ nhất'],
  [/\btiÖm cËn\b/gi, 'tiệm cận'],
  [/\b®å thÞ\b/gi, 'đồ thị'],
  [/\bgiao ®iÓm\b/gi, 'giao điểm'],
  [/\btiÕp tuyÕn\b/gi, 'tiếp tuyến'],
  [/\bcùc trÞ\b/gi, 'cực trị'],
  [/\bcùc ®¹i\b/gi, 'cực đại'],
  [/\bcùc tiÓu\b/gi, 'cực tiểu'],
  [/\bb¶ng biÕn thiªn\b/gi, 'bảng biến thiên'],
  [/\bxÐt dÊu\b/gi, 'xét dấu'],
  [/\bchøng minh\b/gi, 'chứng minh'],
  [/\bkÕt luËn\b/gi, 'kết luận'],
  [/\bgi¶ thiÕt\b/gi, 'giả thiết'],
  [/\bBµi\b/g, 'Bài'],
  [/\bCh¬ng\b/g, 'Chương'],
  [/\bPhÇn\b/g, 'Phần'],
  [/\bMôc\b/g, 'Mục'],
  [/\bLÝ thuyÕt\b/g, 'Lý thuyết'],
  [/\bC«ng thøc\b/g, 'Công thức'],
  [/\bD¹ng\b/g, 'Dạng'],
  [/\bVÝ dô\b/g, 'Ví dụ'],
  [/\bBµi tËp\b/g, 'Bài tập'],
  [/\bLíp\b/g, 'Lớp'],
  [/\bGi¸o viªn\b/g, 'Giáo viên'],
  [/\bHäc sinh\b/g, 'Học sinh'],
  [/\bTrêng\b/g, 'Trường']
];

// 3. VNI Windows 2-character / syllable replacements
const VNI_PAIRS: [RegExp, string][] = [
  [/aù/g, 'á'], [/aà/g, 'à'], [/aû/g, 'ả'], [/aõ/g, 'ã'], [/aï/g, 'ạ'],
  [/aê/g, 'ă'], [/aé/g, 'ắ'], [/aè/g, 'ằ'], [/aú/g, 'ẳ'], [/aü/g, 'ẵ'], [/aë/g, 'ặ'],
  [/aâ/g, 'â'], [/aá/g, 'ấ'], [/aà/g, 'ầ'], [/aå/g, 'ẩ'], [/aã/g, 'ẫ'], [/aä/g, 'ậ'],
  [/eù/g, 'é'], [/eà/g, 'è'], [/eû/g, 'ẻ'], [/eõ/g, 'ẽ'], [/eï/g, 'ẹ'],
  [/eâ/g, 'ê'], [/eá/g, 'ế'], [/eà/g, 'ề'], [/eå/g, 'ể'], [/eã/g, 'ễ'], [/eä/g, 'ệ'],
  [/où/g, 'ó'], [/oà/g, 'ò'], [/oû/g, 'ỏ'], [/oõ/g, 'õ'], [/oï/g, 'ọ'],
  [/oâ/g, 'ô'], [/oá/g, 'ố'], [/oà/g, 'ồ'], [/oå/g, 'ổ'], [/oã/g, 'ỗ'], [/oä/g, 'ộ'],
  [/ôù/g, 'ớ'], [/ôø/g, 'ờ'], [/ôà/g, 'ờ'], [/ôû/g, 'ở'], [/ôõ/g, 'ỡ'], [/ôï/g, 'ợ'],
  [/uù/g, 'ú'], [/uà/g, 'ù'], [/uû/g, 'ủ'], [/uõ/g, 'ũ'], [/uï/g, 'ụ'],
  [/öù/g, 'ứ'], [/öø/g, 'ừ'], [/öà/g, 'ừ'], [/öû/g, 'ử'], [/öõ/g, 'ữ'], [/öï/g, 'ự'], [/ö/g, 'ư'],
  [/yù/g, 'ý'], [/yà/g, 'ỳ'], [/yû/g, 'ỷ'], [/yõ/g, 'ỹ'],
  [/ñ/g, 'đ'], [/Ñ/g, 'Đ'],
  [/AÙ/g, 'Á'], [/AÀ/g, 'À'], [/AÛ/g, 'Ả'], [/AÕ/g, 'Ã'], [/AÏ/g, 'Ạ'],
  [/AÊ/g, 'Ă'], [/AÉ/g, 'Ắ'], [/AÈ/g, 'Ằ'], [/AÚ/g, 'Ẳ'], [/AÜ/g, 'Ẵ'], [/AË/g, 'Ặ'],
  [/AÂ/g, 'Â'], [/AÁ/g, 'Ấ'], [/AÀ/g, 'Ầ'], [/AÅ/g, 'Ẩ'], [/AÃ/g, 'Ẫ'], [/AÄ/g, 'Ậ'],
  [/EÙ/g, 'É'], [/EÀ/g, 'È'], [/EÛ/g, 'Ẻ'], [/EÕ/g, 'Ẽ'], [/EÏ/g, 'Ẹ'],
  [/EÂ/g, 'Ê'], [/EÁ/g, 'Ế'], [/EÀ/g, 'Ề'], [/EÅ/g, 'Ể'], [/EÃ/g, 'Ễ'], [/EÄ/g, 'Ệ'],
  [/OÙ/g, 'Ó'], [/OÀ/g, 'Ò'], [/OÛ/g, 'Ỏ'], [/OÕ/g, 'Õ'], [/OÏ/g, 'Ọ'],
  [/OÂ/g, 'Ô'], [/OÁ/g, 'Ố'], [/OÀ/g, 'Ồ'], [/OÅ/g, 'Ổ'], [/OÃ/g, 'Ỗ'], [/OÄ/g, 'Ộ'],
  [/ÔÙ/g, 'Ớ'], [/ÔØ/g, 'Ờ'], [/ÔÀ/g, 'Ờ'], [/ÔÛ/g, 'Ở'], [/ÔÕ/g, 'Ỡ'], [/ÔÏ/g, 'Ợ'],
  [/UÙ/g, 'Ú'], [/UÀ/g, 'Ù'], [/UÛ/g, 'Ủ'], [/UÕ/g, 'Ũ'], [/UÏ/g, 'Ụ'],
  [/ÖÙ/g, 'Ứ'], [/ÖØ/g, 'Ừ'], [/ÖÀ/g, 'Ừ'], [/ÖÛ/g, 'Ử'], [/ÖÕ/g, 'Ữ'], [/ÖÏ/g, 'Ự'], [/Ö/g, 'Ư']
];

// 4. MathType / Word Private Use Area (PUA) & Math Symbols to LaTeX
// CRITICAL: NEVER include standard Latin-1 characters like È (\u00C8), Ì (\u00CC), ³ (\u00B3)!
const MATH_SYMBOL_MAP: [RegExp, string][] = [
  // Private Use Area (PUA) generated by MathType Word equations
  [/[\uF0CE∈]/g, ' \\in '],
  [/[\uF0A3≤]/g, ' \\le '],
  [/[\uF0B3≥]/g, ' \\ge '],
  [/[\uF0A5∞]/g, ' \\infty '],
  [/[\uF0DB⇔]/g, ' \\Leftrightarrow '],
  [/[\uF0DE⇒]/g, ' \\Rightarrow '],
  [/[\uF022∀]/g, ' \\forall '],
  [/[\uF024∃]/g, ' \\exists '],
  [/[\uF044Δ]/g, ' \\Delta '],
  [/[\uF070π]/g, ' \\pi '],
  [/[\uF061α]/g, ' \\alpha '],
  [/[\uF062β]/g, ' \\beta '],
  [/[\uF067γ]/g, ' \\gamma '],
  [/[\uF071θ]/g, ' \\theta '],
  [/[\uF02B±]/g, ' \\pm '],
  [/[\uF0B4×]/g, ' \\times '],
  [/[\uF0B8÷]/g, ' \\div '],
  [/[\uF0B9≠]/g, ' \\neq '],
  [/[\uF0BB≈]/g, ' \\approx '],
  [/[\uF05E⊥]/g, ' \\perp '],
  [/[\uF050∥]/g, ' \\parallel '],
  [/[\uF0C8∪]/g, ' \\cup '],
  [/[\uF0C7∩]/g, ' \\cap '],
  [/[\uF0CC⊂]/g, ' \\subset '],
  [/[\uF0CB⊄]/g, ' \\not\\subset '],
  [/[\uF0C6∅]/g, ' \\emptyset '],
  [/[\uF0AE→]/g, ' \\to '],
  [/√/g, ' \\sqrt '],
  [/∫/g, ' \\int '],
  // Arc symbols & overparen/wideparen -> standard KaTeX \overgroup
  [/[\u23DC\u23D4\u23D5\u23E0\u23E1\u2322⌒⌢⏜⏠]/g, ' \\overgroup '],
  [/\\overparen\{([^}]+)\}/g, ' \\overgroup{$1} '],
  [/\\wideparen\{([^}]+)\}/g, ' \\overgroup{$1} '],
  [/\\overparen\b/g, ' \\overgroup '],
  [/\\wideparen\b/g, ' \\overgroup '],
  [/\\arc\{([^}]+)\}/g, ' \\overgroup{$1} ']
];

/**
 * Kiểm tra xem văn bản đã là Unicode tiếng Việt chuẩn hay chưa.
 * Văn bản đã là Unicode khi chứa các ký tự đặc trưng của tiếng Việt trong Unicode
 * (như: đ, Đ, ơ, Ơ, ư, Ư, ă, Ă hoặc các nguyên âm có dấu thanh trong dải \u1EA0-\u1EF9)
 * hoặc các từ tiếng Việt Unicode thông dụng.
 */
export function isAlreadyUnicode(text: string): boolean {
  if (!text) return true;

  // 1. Ký tự độc nhất vô nhị chỉ có trong tiếng Việt Unicode (U+0102-01B0, U+1EA0-1EF9)
  const unicodeCount = (text.match(/[\u1EA0-\u1EF9đĐơƠưƯăĂ]/g) || []).length;
  if (unicodeCount >= 3) {
    return true;
  }

  // 2. Kiểm tra các từ tiếng Việt Unicode chuẩn thường gặp
  const commonWordsMatch = text.match(/\b(bài|học|toán|hàm|số|đồng|biến|nghịch|tập|xác|định|đạo|nguyên|tích|phân|ví|dụ|lời|giải|chứng|minh|phương|trình|điều|kiện|công|thức|cho|với|khi|nếu|thì|trong|của|các|được|người|không|những|một|có|là)\b/gi);
  if (commonWordsMatch && commonWordsMatch.length >= 2) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem văn bản có phải mã TCVN3 (.VnTime, .VnTimeH) không
 */
export function isLegacyTcvn3(text: string): boolean {
  if (!text) return false;

  // Kiểm tra từ điển TCVN3 đặc trưng
  const tcvn3Words = text.match(/\b(bµi|®îc|kh«ng|ngêi|ph¬ng|hµm|®ång|biÕn|ph¶i|c¸c|®iÒu|tam gi¸c|c«ng thøc|vÝ dô|lêi gi¶i|®¹i sè|h×nh häc|®¹o hµm)\b/gi);
  if (tcvn3Words && tcvn3Words.length > 0) return true;

  // Kiểm tra tần suất ký tự đặc trưng TCVN3: ® (đ), ¨ (ă), © (â), ª (ê), « (ô), ¬ (ơ)
  const markerCount = (text.match(/[®¨©ª«¬µ¸¶·¹»¾¼½ÇÊÈÉËÌÐÎÏÑÒÕÓÔÖ×ÝØÜÞ]/g) || []).length;
  return markerCount >= 2;
}

/**
 * Kiểm tra xem văn bản có phải mã VNI Windows không
 */
export function isLegacyVni(text: string): boolean {
  if (!text) return false;

  const vniWords = text.match(/\b(baøi|toaùn|phöông|ñöôïc|khoâng|ngöôøi|haøm|ñoàng|nghòch|ñieàu|caùc|gioù|thöùc|ví duï)\b/gi);
  if (vniWords && vniWords.length > 0) return true;

  const vniPatternCount = (text.match(/(ñ[a-z]|aù|aà|aû|aõ|aï|eù|eà|où|uù|öù|öø)/g) || []).length;
  return vniPatternCount >= 2;
}

/**
 * Converts TCVN3 / ABC (.VnTime, .VnTimeH) and VNI encoded text to standard Unicode (NFC).
 * AN TOÀN TUYỆT ĐỐI: Chuyển đổi hoàn hảo cả tài liệu thuần mã cũ lẫn tài liệu hỗn hợp Unicode và TCVN3/VNI.
 */
export function convertTcvn3ToUnicode(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Luôn chạy TCVN3_WORD_FIXES: các từ ngữ đặc thù này (ph¬ng tr×nh, tam gi¸c, ®¹o hµm...)
  // không bao giờ tồn tại trong tiếng Việt Unicode chuẩn hay bất kỳ ngôn ngữ nào khác.
  for (const [pattern, replacement] of TCVN3_WORD_FIXES) {
    text = text.replace(pattern, replacement);
  }

  // 2. Chuyển đổi VNI Windows nếu có dấu hiệu
  if (isLegacyVni(text) || /(baøi|toaùn|phöông|ñöôïc|khoâng|ngöôøi|haøm|ñoàng|nghòch|ñieàu|caùc|gioù|thöùc|ví duï|ñaïo haøm)/i.test(text)) {
    for (const [pattern, replacement] of VNI_PAIRS) {
      text = text.replace(pattern, replacement);
    }
  }

  // 3. Nếu còn ký tự TCVN3 đơn lẻ (như ® = đ, hoặc các nguyên âm có dấu đặc trưng TCVN3):
  const hasTcvn3Chars = /[®¨©ª«¬µ¸¶·¹»¾¼½ÇÊÈÉËÌÐÎÏÑÒÕÓÔÖ×ÝØÜÞ]/.test(text);
  if (hasTcvn3Chars) {
    let converted = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0xa1 && TCVN3_CHAR_MAP[code] !== undefined) {
        converted += TCVN3_CHAR_MAP[code];
      } else {
        converted += text[i];
      }
    }
    text = converted;

    // Xử lý nguyên âm đôi TCVN3 ơng/ước
    text = text.replace(/([cChHpPtT])ơng/g, '$1ương');
    text = text.replace(/([bBcCdDđĐgGhHkKlLmMnNpPqQrRsStTvVxX])ước/g, '$1ước');
    text = text.replace(/([cChHpPtT])ƠNG/g, '$1ƯƠNG');
    text = text.replace(/([bBcCdDđĐgGhHkKlLmMnNpPqQrRsStTvVxX])ƯỚC/g, '$1ƯỚC');
  }

  try {
    text = text.normalize('NFC');
  } catch {}

  return text;
}

/**
 * Chuẩn hóa khối nội dung bên trong môi trường LaTeX nhiều dòng (\begin{cases}, \begin{aligned}, \begin{matrix}...)
 * - Tự động bổ sung dấu ngắt dòng \\ nếu người dùng chỉ xuống dòng thông thường
 * - Chuẩn hóa dấu gạch ngang (em-dash, en-dash, unicode minus) thành dấu trừ tiêu chuẩn
 * - Nối các dòng phương trình gọn gàng, tránh bị ngắt đoạn Markdown
 */
export function formatCasesBlock(inner: string): string {
  if (!inner) return '';
  // Chuẩn hóa dấu gạch ngang
  let fixed = inner.replace(/[–—−]/g, '-');
  // Sửa các dấu \ đơn lẻ trước khi xuống dòng
  fixed = fixed.replace(/(?<=[^\\])\\\s*(\r?\n|$)/g, ' \\\\$1');

  // Tách từng dòng phương trình
  const rawLines = fixed.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (rawLines.length > 1) {
    const fixedLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];
      if (i < rawLines.length - 1) {
        if (!line.endsWith('\\\\') && !line.endsWith('\\')) {
          line += ' \\\\';
        } else if (line.endsWith('\\') && !line.endsWith('\\\\')) {
          line += '\\';
        }
      }
      fixedLines.push(line);
    }
    return fixedLines.join(' ');
  }
  return fixed.replace(/\r?\n/g, ' ');
}

/**
 * Kiểm tra xem chuỗi có chứa từ ngữ hoặc ký tự tiếng Việt rõ rệt không
 */
export function hasVietnameseText(str: string): boolean {
  if (!str) return false;
  return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/i.test(str)
    || /\b(cho|một|hai|ba|bốn|năm|vật|con|lắc|dao|động|tính|khoảng|cách|độ|dài|cung|bán|kính|tam|giác|vuông|cân|đều|tại|điểm|đường|thẳng|mặt|phẳng|hình|chóp|lăng|trụ|biết|rằng|hàm|số|nghiệm|phương|trình|hệ|trên|dưới|trong|ngoài|khi|nếu|thì|với|theo|có|là|của|các|được|lời|giải|đáp|án|câu|hỏi|trắc|nghiệm|tự|luận|đúng|sai|đồng|biến|nghịch|tập|xác|định|đạo|nguyên|tích|phân|giá|trị|lớn|nhất|nhỏ|tiệm|cận|đồ|thị|cực|trị|tọa|độ|vectơ)\b/i.test(str);
}

/**
 * GIẢI CỨU TIẾNG VIỆT BỊ NHỐT TRONG KHỐI CÔNG THỨC TOÁN ($...$ hoặc $$...$$)
 * Nếu cả câu tiếng Việt bị bọc nhầm trong dấu $, KaTeX sẽ biến toàn bộ chữ tiếng Việt
 * thành phông chữ nghiêng toán học dính liền không dấu cách. Hàm này bóc tách câu chữ
 * tiếng Việt ra ngoài, chỉ giữ lại các biểu thức toán thực thụ bên trong $...$.
 * Đồng thời chuẩn hóa \overparen, \wideparen sang \overgroup để KaTeX hiển thị hoàn hảo.
 */
export function rescueVietnameseMathBlocks(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Chuẩn hóa các biến thể cung tròn sang \overgroup chuẩn KaTeX
  text = text.replace(/\\overparen\{([^}]+)\}/g, '\\overgroup{$1}');
  text = text.replace(/\\wideparen\{([^}]+)\}/g, '\\overgroup{$1}');
  text = text.replace(/\\arc\{([^}]+)\}/g, '\\overgroup{$1}');

  // 2. Quét các khối $...$ và $$...$$ chứa câu chữ tiếng Việt
  text = text.replace(/(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?(?<!\$)\$)/g, (match) => {
    const isDouble = match.startsWith('$$');
    let inner = isDouble ? match.slice(2, -2) : match.slice(1, -1);
    
    // Nếu khối không chứa tiếng Việt hoặc không có khoảng trắng -> Giữ nguyên là công thức toán
    if (!hasVietnameseText(inner) || !inner.trim().includes(' ')) {
      return match;
    }

    // ĐÂY LÀ MỘT CÂU/CỤM TỪ TIẾNG VIỆT BỊ NHỐT TRONG KHỐI TOÁN!
    inner = inner.replace(/\\overparen\{([^}]+)\}/g, '\\overgroup{$1}');
    inner = inner.replace(/\\wideparen\{([^}]+)\}/g, '\\overgroup{$1}');
    inner = inner.replace(/\\arc\{([^}]+)\}/g, '\\overgroup{$1}');

    // Tách và bảo toàn các công thức toán:
    // - Lệnh có ngoặc nhọn: \overgroup{...}, \vec{...}, \widehat{...}, \frac{...}{...}, \sqrt{...}, \overline{...}
    // - Ký hiệu Hy Lạp & toán tử: \alpha, \beta, \pi, \Delta, \infty, \perp, \parallel...
    // - Biểu thức đẳng thức/bất đẳng thức: AB = 5, R = 10cm, x = 1, y = 2
    // - Lũy thừa, chỉ số: x^2, u_n, 90^\circ
    let unwrap = inner.replace(
      /(\\overgroup\{[^}]+\}|\\vec\{[^}]+\}|\\widehat\{[^}]+\}|\\overline\{[^}]+\}|\\(?:d|t)?frac\{[^{}]+\}\{[^{}]+\}|\\sqrt(?:\\[[^\\]]+\\])?\{[^{}]+\}|\\(alpha|beta|gamma|Delta|pi|theta|infty|pm|le|ge|neq|perp|parallel)\b|[a-zA-Z0-9_]+\s*=\s*[^,;\s]+|[a-zA-Z]\^[0-9a-zA-Z\+\-]+|[a-zA-Z]_[0-9a-zA-Z]+|\d+(?:\.\d+)?\s*\^\s*\\circ)/g,
      (formula) => {
        const clean = formula.trim();
        return `$${clean}$`;
      }
    );

    return isDouble ? `\n\n${unwrap.trim()}\n\n` : ` ${unwrap.trim()} `;
  });

  return text;
}

/**
 * Standardizes mathematical formulas and MathType symbols into clean LaTeX.
 * Bảo vệ 100% tiếng Việt, xử lý triệt để lỗi ký hiệu MathType (\undefined), ngắt dòng \begin{cases},
 * dấu $ bất đối xứng và phân tách câu chữ tiếng Việt tự nhiên.
 */
export function formatMathExpressions(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // Step 0: Luôn chạy giải cứu câu chữ tiếng Việt bị nhốt trong math mode trước tiên
  text = rescueVietnameseMathBlocks(text);

  // Step 1: Thay thế các ký hiệu MathType PUA và ký hiệu toán sang LaTeX
  for (const [pattern, replacement] of MATH_SYMBOL_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Step 2: Dọn dẹp lỗi artifact MathType `undefined` hoặc `\undefined`
  // - Đứng sau số hiệu hệ phương trình: (I)undefined hoặc (I)\undefined -> (I) \Leftrightarrow
  text = text.replace(/(\([I|V|X|\d]+\))\s*\\?undefined\s*/gi, '$1 \\Leftrightarrow ');
  // - Đứng giữa 2 hệ phương trình: \end{cases}undefined\begin{cases} -> \end{cases} \Leftrightarrow \begin{cases}
  text = text.replace(/(\\end\{[a-zA-Z*]+\})\s*\\?undefined\s*(\\begin\{[a-zA-Z*]+\})/gi, '$1 \\Leftrightarrow $2');
  // - Đứng sau \end{cases} hoặc trước \begin{cases}
  text = text.replace(/(\\end\{[a-zA-Z*]+\})\s*\\?undefined\s*/gi, '$1 \\Leftrightarrow ');
  text = text.replace(/\\?undefined\s*(\\begin\{[a-zA-Z*]+\})/gi, ' \\Leftrightarrow $1');
  // - Đứng sau kết quả tính toán trước tọa độ: m = \frac{1}{5}undefined(x; y) -> m = \frac{1}{5} \Rightarrow (x; y)
  text = text.replace(/([=\d\w\}])\s*\\?undefined\s*(\([x-zX-Z0-9_\s;,\+\-]+\))/gi, '$1 \\Rightarrow $2');
  // - Mọi chữ \undefined hoặc undefined đứng lẻ trong biểu thức toán
  text = text.replace(/\\undefined\b/g, '\\Leftrightarrow');
  text = text.replace(/(?<=[a-zA-Z0-9_\$\\}])\s+undefined\s+(?=[a-zA-Z0-9_\$\\\(\[\{])/g, ' \\Leftrightarrow ');

  // Step 2.5: Tách đề mục (Bài, Câu, Ví dụ, Dạng) bị dính liền vào câu văn trước mà thiếu ngắt dòng
  text = text.replace(/([a-zA-ZÀ-ỹ\.\!\?])\s*(Bài\s*\d+|Câu\s*\d+|Ví\s*dụ\s*\d+|Dạng\s*\d+)[:\.\-\s]/g, '$1\n\n**$2.** ');

  // Step 2.6: Thêm khoảng trắng trước lệnh LaTeX nếu bị dính liền chữ tiếng Việt: "phương trình\begin" -> "phương trình \begin"
  text = text.replace(/([a-zA-ZÀ-ỹ])\\(begin|frac|dfrac|tfrac|sqrt)\{/g, '$1 \\$2{');

  // Step 2.7: Chuẩn hóa em-dash / en-dash / unicode minus trước lệnh LaTeX hoặc số
  text = text.replace(/[–—−](?=\s*\\)/g, '-');
  text = text.replace(/[–—−](?=\s*[0-9])/g, '-');

  // Step 2.8: Sửa lỗi biểu thức có dấu $ lẻ ở cuối (ví dụ: "m = \dfrac{1}{5}$" -> "$m = \dfrac{1}{5}$")
  text = text.replace(/(?<![\$\w])([0-9]*[a-zA-Z]\s*=\s*(?:\\(?:d|t)?frac\{[^{}]+\}\{[^{}]+\}|[0-9\/\+\-]+))\$(?!\$)/g, '$$$1$$');

  // Step 2.9: Mở ngoặc văn bản thuần \text{(vô lí)} -> (vô lí), \text{(luôn đúng)} -> (luôn đúng)
  text = text.replace(/\\text\{([^{}]+)\}/g, '($1)').replace(/\(\((.*?)\)\)/g, '($1)');

  // HỆ THỐNG TOKEN HÓA TOÁN HỌC AN TOÀN (SAFE TOKENIZATION ENGINE)
  // Đảm bảo không có bất kỳ regex nào can thiệp chồng chéo làm hỏng biểu thức toán
  const mathTokens: string[] = [];
  function addToken(math: string, isBlock = false): string {
    const idx = mathTokens.length;
    const clean = math.trim();
    if (isBlock) {
      mathTokens.push(`$$${clean}$$`);
    } else {
      mathTokens.push(`$${clean}$`);
    }
    return `___MATH_TOK_${idx}___`;
  }

  // 1. Token hóa các khối display math $$...$$ có sẵn
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    if (hasVietnameseText(inner) && inner.includes(' ')) {
      return rescueVietnameseMathBlocks(`$$${inner}$$`);
    }
    return addToken(inner, true);
  });

  // 2. Token hóa các khối môi trường LaTeX \begin{...}...\end{...}
  text = text.replace(
    /(?:\$*(\\left\s*(?:\\.|.)\s*))?(\${1,2}\s*)?(\\left\s*(?:\\.|.)\s*)?\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\4\}(\s*\\right\s*(?:\\.|.))?(\s*\${1,2})?(?:\s*(\\right\s*(?:\\.|.))\$*)?/g,
    (match, left1, openDollar, left2, env, inner, right1, closeDollar, right2) => {
      let l = (left1 || left2 || '').replace(/\$/g, '').trim();
      let r = (right1 || right2 || '').replace(/\$/g, '').trim();
      let cleanInner = formatCasesBlock(inner.replace(/(?<!\\)\$/g, ''));
      let body = `\\begin{${env}} ${cleanInner} \\end{${env}}`;
      if (l || r) {
        body = `${l} ${body} ${r}`.trim();
      }
      const isDouble = (openDollar && openDollar.includes('$$')) || (closeDollar && closeDollar.includes('$$')) || match.includes('$$');
      return addToken(body, isDouble);
    }
  );

  // 3. Token hóa các khối inline math $...$ có sẵn
  text = text.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {
    // Giải cứu chữ tiếng Việt bị nhốt nhầm trong $...$
    if (hasVietnameseText(inner) && inner.includes(' ')) {
      return ` ${rescueVietnameseMathBlocks('$' + inner + '$')} `;
    }
    return addToken(inner, false);
  });

  // 4. Trong phần văn bản thuần còn lại (hoàn toàn sạch các khối $ đã token hóa):
  // A. Mũi tên suy ra / tương đương dạng ký hiệu hoặc lệnh LaTeX rơi ra ngoài
  text = text.replace(/(?<=\s|^)=>(?=\s|$)/g, () => addToken('\\Rightarrow'));
  text = text.replace(/(?<=\s|^)<=>(?=\s|$)/g, () => addToken('\\Leftrightarrow'));
  text = text.replace(/\\?(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|Longleftrightarrow|Longrightarrow)\b/g, (_m, p1) => addToken(`\\${p1}`));

  // B. Tọa độ điểm / khoảng đoạn toán học: (-2; 1), (1; -1), [0; 3], (-\infty; 1)
  text = text.replace(/(?<![a-zA-Z0-9\$\\])([\(\[][\+\-]?(?:\d+|\\infty)\s*;\s*[\+\-]?(?:\d+|\\infty)[\)\]])/g, (_m, coord) => addToken(coord));

  // C. Biểu thức phương trình đơn giản chưa có $ (ví dụ: m = \frac{1}{5}, 5m = 1, 4m = 1, x = 1, y = -1)
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\\+\-])\b([0-9]*[a-zA-Z])\s*=\s*(\\?(?:d|t)?frac\{[^{}]+\}\{[^{}]+\}|[+\-]?(?:\d+(?:\.\d+)?|\d+\/\d+))(?![a-zA-Z0-9_\$\^])/g,
    (_m, p1, p2) => addToken(`${p1} = ${p2}`)
  );

  // D. Ký hiệu vectơ, cung tròn, góc, độ
  text = text.replace(/\\over\s*\\rightarrow\s*\{([^}]+)\}/g, (_m, p1) => addToken(`\\overrightarrow{${p1}}`));
  text = text.replace(/\\over\s*\\leftarrow\s*\{([^}]+)\}/g, (_m, p1) => addToken(`\\overleftarrow{${p1}}`));
  text = text.replace(/\\(overgroup|overparen|wideparen|arc|overrightarrow|overleftarrow|vec|widehat)\{([^}]+)\}/g, (_m, cmd, p1) => {
    const safeCmd = (cmd === 'overparen' || cmd === 'wideparen' || cmd === 'arc') ? 'overgroup' : cmd;
    return addToken(`\\${safeCmd}{${p1}}`);
  });
  text = text.replace(/\b(\d+(?:\.\d+)?)\s*\^\s*\\circ\b/g, (_m, p1) => addToken(`${p1}^\\circ`));

  // E. Phân số và căn bậc hai chưa có $ (hỗ trợ \dfrac, \tfrac, \frac kèm dấu âm/dương)
  text = text.replace(/(?<![\$\\\w])([+\-]?\s*\\(?:d|t)?frac\{[^{}]+\}\{[^{}]+\})/g, (_m, frac) => addToken(frac.trim()));
  text = text.replace(/(?<![\$\\\w])(\\sqrt\{[^{}]+\})/g, (_m, sqrt) => addToken(sqrt.trim()));

  // F. Toán tử hình học & dấu nhân
  text = text.replace(/\\cdot/g, () => addToken('\\cdot'));
  text = text.replace(/\\parallel/g, () => addToken('\\parallel'));
  text = text.replace(/\\perp/g, () => addToken('\\perp'));

  // G. Các ký hiệu toán phổ biến: \nearrow, \infty, \leq, \geq, \le, \ge, \pm, \alpha...
  text = text.replace(/\\(nearrow|searrow|uparrow|downarrow|infty|pm|mp|leq|geq|le|ge|in|notin|subset|supset|cup|cap|emptyset|approx|equiv|forall|exists|alpha|beta|gamma|theta|pi|Delta|lambda|sigma|omega|Omega|times|div|neq)\b/g, (_m, p1) => addToken(`\\${p1}`));

  // H. Toán tử so sánh rõ ràng giữa các biến/số (vd: x <= 3, n >= -1, x != 0)
  text = text.replace(/\b([a-zA-Z0-9_\(\)]+)\s*<=\s*([\+\-]?[0-9a-zA-Z_\(\)]+)/g, (_m, p1, p2) => addToken(`${p1} \\le ${p2}`));
  text = text.replace(/\b([a-zA-Z0-9_\(\)]+)\s*>=\s*([\+\-]?[0-9a-zA-Z_\(\)]+)/g, (_m, p1, p2) => addToken(`${p1} \\ge ${p2}`));
  text = text.replace(/\b([a-zA-Z0-9_\(\)]+)\s*!=\s*([\+\-]?[0-9a-zA-Z_\(\)]+)/g, (_m, p1, p2) => addToken(`${p1} \\neq ${p2}`));

  // I. Tự động nhận diện đa thức chứa lũy thừa chưa có $ (ví dụ: 3x^2 - 3, 2^x)
  text = text.replace(/(?<![a-zA-Z0-9\$\\])([0-9]*[a-zA-Z\)]\s*\^\s*\{?[0-9a-zA-Z\+\-]+\}?(?:\s*[+\-]\s*[0-9a-zA-Z]+)*)(?![a-zA-Z0-9\$\^])/g, (_m, p1) => addToken(p1));

  // J. Tự động nhận diện dãy số / chỉ số dưới có dấu bằng: u_2 = 3, u_n = 2n + 1
  text = text.replace(/(?<![a-zA-Z0-9\$\\])([a-zA-Z])_([0-9a-zA-Z]+)(\s*=\s*[0-9a-zA-Z\+\-\*\/]+)?(?![a-zA-Z0-9\$_])/g, (_m, p1, p2, p3) => addToken(`${p1}_${p2}${p3 || ''}`));

  // 5. Khôi phục toàn bộ các tokens toán học an toàn, hoàn chỉnh
  text = text.replace(/___MATH_TOK_(\d+)___/g, (_m, idx) => {
    return mathTokens[Number(idx)] || '';
  });

  // Step 6: Dọn dẹp dollar thừa từ 3 dấu trở lên
  text = text.replace(/\${3,}/g, '$$');

  return text;
}

/**
 * Master repair function: Runs full Unicode font repair followed by Math LaTeX normalization.
 * Giữ nguyên 100% nội dung và phông chữ tiếng Việt chuẩn.
 */
export function repairVietnameseDocument(content: string): string {
  if (!content) return '';
  const decoded = convertTcvn3ToUnicode(content);
  const rescued = rescueVietnameseMathBlocks(decoded);
  return formatMathExpressions(rescued);
}

/**
 * Tự động phát hiện tên bài học từ nội dung bài viết
 */
export function autoDetectLessonTitle(content: string, fallbackTitle?: string, fallbackFileName?: string): string {
  if (fallbackTitle && fallbackTitle.trim()) return fallbackTitle.trim();
  if (!content) return fallbackFileName ? fallbackFileName.replace(/\.[^/.]+$/, '') : 'Bài học mới';

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 30);
  
  // 1. Tìm theo mẫu rõ ràng: "Bài 1: ...", "Chương 2: ...", "Chuyên đề: ...", "§1. ..."
  for (const line of lines) {
    const cleanLine = line.replace(/^[#*>\-\s]+/, '').trim();
    if (/^(bài|chương|chuyên đề|bài học|chủ đề|tiết|§)\s*(\d+|[ivxldcm]+)?[:\.\-\s]/i.test(cleanLine)) {
      return cleanLine.replace(/[*_#]/g, '').trim();
    }
  }

  // 2. Tìm dòng tiêu đề viết HOA hoặc có dấu # đầu tiên
  for (const line of lines) {
    const cleanLine = line.replace(/^[#*>\-\s]+/, '').trim();
    if (cleanLine.length > 5 && cleanLine.length < 80) {
      if (line.startsWith('#') || (cleanLine === cleanLine.toUpperCase() && /[A-ZÀÁẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/.test(cleanLine))) {
        return cleanLine.replace(/[*_#]/g, '').trim();
      }
    }
  }

  // 3. Lấy dòng đầu tiên có độ dài phù hợp
  if (lines.length > 0 && lines[0].length < 80) {
    return lines[0].replace(/^[#*>\-\s]+/, '').replace(/[*_#]/g, '').trim();
  }

  return fallbackFileName ? fallbackFileName.replace(/\.[^/.]+$/, '') : 'Bài học mới';
}

/**
 * Chuẩn hóa và tự động sửa các lỗi phổ biến trong đồ thị / hình vẽ SVG:
 * 1. Loại bỏ hoàn toàn dấu $ bên trong các thẻ <text>...</text> (e.g. $(0; -2)$ -> (0; -2), $y = -2$ -> y = -2, $x$ -> x, $y$ -> y).
 * 2. Tự động kiểm tra và hoàn thiện hệ trục tọa độ Oxy:
 *    - Bổ sung mũi tên trục tung Oy nếu thiếu
 *    - Bổ sung nhãn 'y' ở đầu trục tung nếu thiếu
 *    - Đảm bảo marker mũi tên #arrow được khai báo trong <defs>
 *    - Đảm bảo gốc O và trục Ox đầy đủ
 * 3. Chuẩn hóa thuộc tính viewBox và kích thước responsive
 */
export function healMathSvg(svg: string): string {
  if (!svg || !svg.includes('<svg')) return svg;

  let cleaned = svg;

  // 1. Loại bỏ toàn bộ dấu $ và các artifact KaTeX bên trong thẻ <text>...</text>
  cleaned = cleaned.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (_match, attrs, content) => {
    const withoutDollars = content.replace(/\$/g, '').trim();
    return `<text${attrs}>${withoutDollars}</text>`;
  });

  // 2. Đảm bảo có viewBox hợp lệ nếu thiếu
  if (!cleaned.includes('viewBox=') && !cleaned.includes('viewbox=')) {
    cleaned = cleaned.replace(/<svg\b/i, '<svg viewBox="0 0 380 250"');
  }

  // 3. Đảm bảo có xmlns nếu thiếu
  if (!cleaned.includes('xmlns=')) {
    cleaned = cleaned.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 4. Kiểm tra hệ trục tọa độ Oxy
  const hasXAxis = /<text\b[^>]*>\s*x\s*<\/text>/i.test(cleaned) || /<text\b[^>]*>\s*Ox\s*<\/text>/i.test(cleaned);
  const hasYAxis = /<text\b[^>]*>\s*y\s*<\/text>/i.test(cleaned) || /<text\b[^>]*>\s*Oy\s*<\/text>/i.test(cleaned);

  // Đảm bảo định nghĩa mũi tên #arrow trong <defs> nếu cần
  let hasArrowDef = cleaned.includes('id="arrow"') || cleaned.includes("id='arrow'");
  if (!hasArrowDef && (hasXAxis || cleaned.includes('marker-end'))) {
    const arrowDef = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/></marker></defs>`;
    if (cleaned.includes('<defs>')) {
      cleaned = cleaned.replace('<defs>', `<defs><marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/></marker>`);
    } else {
      cleaned = cleaned.replace(/<svg\b([^>]*)>/i, `<svg$1>\n  ${arrowDef}`);
    }
    hasArrowDef = true;
  }

  // Nếu phát hiện có trục x hoặc hệ trục tọa độ mà thiếu trục y hoặc thiếu nhãn y:
  if (hasXAxis && !hasYAxis) {
    const lineMatches = Array.from(cleaned.matchAll(/<line\b([^>]*)\/?>/gi));
    let bestVerticalLine: { fullMatch: string; x: number; yTop: number; yBottom: number; hasMarker: boolean } | null = null;

    for (const m of lineMatches) {
      const attrs = m[1];
      const x1 = parseFloat(attrs.match(/\bx1=["']?([0-9.]+)["']?/)?.[1] || '-1');
      const y1 = parseFloat(attrs.match(/\by1=["']?([0-9.]+)["']?/)?.[1] || '-1');
      const x2 = parseFloat(attrs.match(/\bx2=["']?([0-9.]+)["']?/)?.[1] || '-1');
      const y2 = parseFloat(attrs.match(/\by2=["']?([0-9.]+)["']?/)?.[1] || '-1');

      if (x1 >= 0 && y1 >= 0 && x2 >= 0 && y2 >= 0) {
        if (Math.abs(x1 - x2) <= 4 && Math.abs(y1 - y2) >= 50) {
          const yTop = Math.min(y1, y2);
          const yBottom = Math.max(y1, y2);
          const hasMarker = attrs.includes('marker-end');
          if (!bestVerticalLine || (yBottom - yTop) > (bestVerticalLine.yBottom - bestVerticalLine.yTop)) {
            bestVerticalLine = { fullMatch: m[0], x: (x1 + x2) / 2, yTop, yBottom, hasMarker };
          }
        }
      }
    }

    if (bestVerticalLine) {
      // 1. Thêm mũi tên vào trục Oy nếu chưa có
      if (!bestVerticalLine.hasMarker && hasArrowDef) {
        const newLine = bestVerticalLine.fullMatch.replace(/\/?>$/, ' marker-end="url(#arrow)" />');
        cleaned = cleaned.replace(bestVerticalLine.fullMatch, newLine);
      }

      // 2. Thêm nhãn 'y' ở đầu trục tung Oy
      const labelY = `<text x="${Math.max(10, Math.round(bestVerticalLine.x - 16))}" y="${Math.max(16, Math.round(bestVerticalLine.yTop + 5))}" font-family="sans-serif" font-style="italic" font-weight="bold" font-size="14" fill="#1e293b">y</text>`;
      cleaned = cleaned.replace('</svg>', `  ${labelY}\n</svg>`);
    }
  }

  // 5. Kiểm tra và bổ sung nhãn gốc tọa độ O nếu thiếu khi có cả x và y
  const hasOrigin = /<text\b[^>]*>\s*O\s*<\/text>/i.test(cleaned);
  const nowHasX = /<text\b[^>]*>\s*x\s*<\/text>/i.test(cleaned);
  const nowHasY = /<text\b[^>]*>\s*y\s*<\/text>/i.test(cleaned);
  if (nowHasX && nowHasY && !hasOrigin) {
    const lineMatches = Array.from(cleaned.matchAll(/<line\b([^>]*)\/?>/gi));
    let xCoord = -1;
    let yCoord = -1;
    for (const m of lineMatches) {
      const attrs = m[1];
      const x1 = parseFloat(attrs.match(/\bx1=["']?([0-9.]+)["']?/)?.[1] || '-1');
      const y1 = parseFloat(attrs.match(/\by1=["']?([0-9.]+)["']?/)?.[1] || '-1');
      const x2 = parseFloat(attrs.match(/\bx2=["']?([0-9.]+)["']?/)?.[1] || '-1');
      const y2 = parseFloat(attrs.match(/\by2=["']?([0-9.]+)["']?/)?.[1] || '-1');
      if (Math.abs(x1 - x2) <= 4 && Math.abs(y1 - y2) >= 50 && xCoord < 0) {
        xCoord = (x1 + x2) / 2;
      }
      if (Math.abs(y1 - y2) <= 4 && Math.abs(x1 - x2) >= 60 && yCoord < 0) {
        yCoord = (y1 + y2) / 2;
      }
    }
    if (xCoord > 0 && yCoord > 0) {
      const labelO = `<text x="${Math.round(xCoord + 6)}" y="${Math.round(yCoord + 16)}" font-family="sans-serif" font-weight="bold" font-size="13" fill="#64748b">O</text>`;
      cleaned = cleaned.replace('</svg>', `  ${labelO}\n</svg>`);
    }
  }

  return cleaned;
}

/**
 * Xóa bỏ hoàn toàn các thẻ HTML rác bao bọc ngoài SVG (như <div align="center">, <center>, </div>)
 * để tránh việc các thẻ này bị hiển thị thành chuỗi thô trên màn hình Markdown.
 */
export function cleanHtmlAndSvgContainers(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Loại bỏ các khối bao bọc như <div align="center"><svg>...</svg></div> hoặc <center><svg>...</svg></center>
  res = res.replace(/<(?:div|p|center)\b[^>]*>\s*(<svg\b[\s\S]*?<\/svg>)\s*<\/(?:div|p|center)>/gi, '\n\n$1\n\n');

  // 2. Loại bỏ các thẻ mở căn giữa còn sót lại
  res = res.replace(/<(?:div|p)\s+align=["']?(?:center|middle|left|right)["']?\s*>/gi, '');
  res = res.replace(/<\/?center>/gi, '');

  // 3. Loại bỏ các thẻ </div> đứng cô lập ngay trước/sau <svg> hoặc trên dòng riêng
  res = res.replace(/(?:^|\n)\s*<\/div>\s*(?:\n|$)/gi, '\n');

  return res.trim();
}

/**
 * Bố cục lại trang trình bày, sửa công thức hình vẽ, chỉnh phông chữ để hiển thị đẹp,
 * và BẢO ĐẢM NỘI DUNG BÀI HỌC ĐƯA VÀO ĐƯỢC GIỮ NGUYÊN 100%.
 */
export function smartFormatLessonLayout(rawText: string, customTitle?: string): string {
  if (!rawText || !rawText.trim()) return '';

  // Bước 0: Dọn dẹp sạch sẽ các thẻ HTML rác <div align="center"> quanh SVG
  const textWithoutHtmlContainers = cleanHtmlAndSvgContainers(rawText);

  // Bước 1: Trích xuất và bảo vệ 100% các khối SVG (tránh bị regex công thức toán làm biến dạng)
  const svgBlocks: string[] = [];
  const textWithPlaceholders = textWithoutHtmlContainers.replace(/(<svg\b[\s\S]*?<\/svg>)/gi, (_m, svg) => {
    const healed = healMathSvg(svg);
    svgBlocks.push(healed);
    return `\n\n___MATH_SVG_BLOCK_${svgBlocks.length - 1}___\n\n`;
  });

  // Bước 2: Sửa phông chữ an toàn và chuẩn hóa công thức toán (không chạm vào SVG)
  const repairedText = repairVietnameseDocument(textWithPlaceholders);

  const lines = repairedText.split(/\r?\n/);
  const formattedLines: string[] = [];

  const detectedTitle = autoDetectLessonTitle(repairedText, customTitle);
  let hasMainTitle = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Dòng trống
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // 1. Nhận diện tiêu đề chính của bài học (nếu ở những dòng đầu)
    if (!hasMainTitle && i < 5) {
      const cleanUpper = trimmed.toUpperCase();
      if (
        trimmed.startsWith('# ') ||
        /^(bài|chủ đề|chương|chuyên đề)\s*(\d+|[ivxldcm]+)?[:\.\-\s]/i.test(trimmed) ||
        cleanUpper === (detectedTitle || '').toUpperCase()
      ) {
        hasMainTitle = true;
        const cleanTitle = trimmed.replace(/^[#*\s]+/, '').trim();
        formattedLines.push(`# ${cleanTitle}`);
        formattedLines.push('');
        continue;
      }
    }

    // 2. Nhận diện các đề mục La Mã lớn (I., II., III., IV., V., VI...)
    const romanMatch = trimmed.match(/^([IVXLCDM]+\.)\s*(.+)$/i);
    if (romanMatch) {
      formattedLines.push('');
      formattedLines.push(`## ${romanMatch[1]} ${romanMatch[2].trim()}`);
      formattedLines.push('');
      continue;
    }

    // 3. Nhận diện các tiểu mục số (1., 2., 3., 4... hoặc 1.1, 1.2...)
    const numSubMatch = trimmed.match(/^(\d+(?:\.\d+)*\.)\s*(.+)$/);
    if (numSubMatch && !trimmed.match(/^\d+\.\s*(Chọn|Đáp án|[A-D]\b)/i)) {
      const rest = numSubMatch[2].trim();
      if (rest.length < 80 && !rest.includes('?') && !rest.includes('=')) {
        formattedLines.push('');
        formattedLines.push(`### ${numSubMatch[1]} ${rest}`);
        formattedLines.push('');
        continue;
      }
    }

    // 4. Nhận diện Dạng toán: "Dạng 1: ...", "Dạng 2: ..."
    const formMatch = trimmed.match(/^(dạng\s*\d+[:\.\-\s]\s*)(.+)$/i);
    if (formMatch) {
      formattedLines.push('');
      formattedLines.push(`### 🎯 ${formMatch[1].trim()} ${formMatch[2].trim()}`);
      formattedLines.push('');
      continue;
    }

    // 5. Nhận diện Ví dụ: "Ví dụ 1: ...", "Ví dụ 2: ...", "Bài toán 1: ..."
    const exampleMatch = trimmed.match(/^(ví dụ\s*\d+|bài toán\s*\d+|vd\s*\d+)[:\.\-\s]\s*(.*)$/i);
    if (exampleMatch) {
      formattedLines.push('');
      const exTitle = exampleMatch[1].trim();
      const exContent = exampleMatch[2].trim();
      formattedLines.push(`#### 📝 ${exTitle}${exContent ? `: ${exContent}` : ''}`);
      continue;
    }

    // 6. Nhận diện Lời giải / Hướng dẫn giải
    if (/^(lời giải|hướng dẫn giải|bài giải)[:\s]*$/i.test(trimmed)) {
      formattedLines.push('');
      formattedLines.push(`*✍️ Lời giải chi tiết:*`);
      formattedLines.push('');
      continue;
    }

    // 7. Nhận diện Hộp nổi bật (Callout boxes) cho Định nghĩa, Định lý, Chú ý, Phương pháp giải
    const defMatch = trimmed.match(/^(định nghĩa|khái niệm)[:\.\-\s]\s*(.+)$/i);
    if (defMatch) {
      formattedLines.push(`> 📌 **${defMatch[1].trim()}:** ${defMatch[2].trim()}`);
      continue;
    }

    const theoremMatch = trimmed.match(/^(định lý|tính chất|hệ quả)[:\.\-\s]\s*(.+)$/i);
    if (theoremMatch) {
      formattedLines.push(`> ⚡ **${theoremMatch[1].trim()}:** ${theoremMatch[2].trim()}`);
      continue;
    }

    const noteMatch = trimmed.match(/^(chú ý|lưu ý|nhận xét|quy ước)[:\.\-\s]\s*(.+)$/i);
    if (noteMatch) {
      formattedLines.push(`> 💡 **${noteMatch[1].trim()}:** ${noteMatch[2].trim()}`);
      continue;
    }

    const methodMatch = trimmed.match(/^(phương pháp giải|quy tắc|cách giải)[:\.\-\s]\s*(.+)$/i);
    if (methodMatch) {
      formattedLines.push(`> 🎯 **${methodMatch[1].trim()}:** ${methodMatch[2].trim()}`);
      continue;
    }

    const formulaBoxMatch = trimmed.match(/^(công thức cần nhớ|bảng công thức|công thức)[:\.\-\s]\s*(.+)$/i);
    if (formulaBoxMatch) {
      formattedLines.push(`> 📐 **${formulaBoxMatch[1].trim()}:** ${formulaBoxMatch[2].trim()}`);
      continue;
    }

    // 8. Nhận diện hình vẽ hoặc mô tả hình minh họa
    const figureMatch = trimmed.match(/^(\[?(?:hình vẽ|hình|hình minh họa|đồ thị)\s*\d*[:\.\-\s]?\]?)\s*(.*)$/i);
    if (figureMatch && (trimmed.includes('[Hình') || trimmed.startsWith('Hình ') || trimmed.startsWith('Hình:'))) {
      formattedLines.push(`> 🖼️ **${figureMatch[1].replace(/[\[\]]/g, '').trim()}:** ${figureMatch[2].trim() || 'Hình vẽ minh họa'}`);
      continue;
    }

    // 9. Dòng văn bản bình thường: Giữ nguyên 100% nội dung
    formattedLines.push(line);
  }

  // Kết hợp lại và chuẩn hóa khoảng trống
  let result = formattedLines.join('\n');

  // Khôi phục lại các khối SVG đã được làm lành hoàn chỉnh
  result = result.replace(/___MATH_SVG_BLOCK_(\d+)___/g, (_m, idx) => {
    return svgBlocks[Number(idx)] || '';
  });

  result = result.replace(/\n{3,}/g, '\n\n');

  try {
    return result.normalize('NFC').trim();
  } catch {
    return result.trim();
  }
}

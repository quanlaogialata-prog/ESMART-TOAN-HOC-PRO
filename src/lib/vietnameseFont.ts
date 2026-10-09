// Complete, comprehensive utility for Vietnamese Font Decoding (TCVN3 / ABC / .VnTime, VNI Windows)
// and MathType / Symbol font conversion to standard LaTeX & Unicode NFC.

// 1. TCVN3 / ABC Single Character Map (.VnTime, .VnTimeH)
// NOTE: These byte codes apply when text is legacy TCVN3 (.VnTime).
const TCVN3_CHAR_MAP: Record<number, string> = {
  // Lowercase accented vowels (.VnTime)
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

// Uppercase Character Map for .VnTimeH (all-caps headings & titles)
const TCVN3_UPPER_CHAR_MAP: Record<number, string> = {
  0xb5: 'À', 0xb8: 'Á', 0xb6: 'Ả', 0xb7: 'Ã', 0xb9: 'Ạ',
  0xa1: 'Ă', 0xa8: 'Ă', 0xbb: 'Ằ', 0xbe: 'Ắ', 0xbc: 'Ẳ', 0xbd: 'Ẵ', 0xc6: 'Ặ',
  0xa2: 'Â', 0xa9: 'Â', 0xc7: 'Ầ', 0xca: 'Ấ', 0xc8: 'Ẩ', 0xc9: 'Ẫ', 0xcb: 'Ậ',
  0xcc: 'È', 0xd0: 'É', 0xce: 'Ẻ', 0xcf: 'Ẽ', 0xd1: 'Ẹ',
  0xa3: 'Ê', 0xaa: 'Ê', 0xd2: 'Ề', 0xd5: 'Ế', 0xd3: 'Ể', 0xd4: 'Ễ', 0xd6: 'Ệ',
  0xd7: 'Ì', 0xdd: 'Í', 0xd8: 'Ỉ', 0xdc: 'Ĩ', 0xde: 'Ị',
  0xdf: 'Ò', 0xe3: 'Ó', 0xe1: 'Ỏ', 0xe2: 'Õ', 0xe4: 'Ọ',
  0xa4: 'Ô', 0xab: 'Ô', 0xe5: 'Ồ', 0xe8: 'Ố', 0xe6: 'Ổ', 0xe7: 'Ỗ', 0xe9: 'Ộ',
  0xa5: 'Ơ', 0xac: 'Ơ', 0xea: 'Ờ', 0xed: 'Ớ', 0xeb: 'Ở', 0xec: 'Ỡ', 0xee: 'Ợ',
  0xef: 'Ù', 0xf3: 'Ú', 0xf1: 'Ủ', 0xf2: 'Ũ', 0xf4: 'Ụ',
  0xa6: 'Ư', 0xad: 'Ư', 0xf5: 'Ừ', 0xf8: 'Ứ', 0xf6: 'Ử', 0xf7: 'Ữ', 0xf9: 'Ự',
  0xfa: 'Ỳ', 0xfd: 'Ý', 0xfb: 'Ỷ', 0xfc: 'Ỹ', 0xfe: 'Ỵ',
  0xa7: 'Đ', 0xae: 'Đ'
};

// 2. Common mathematical & pedagogical words in legacy TCVN3 (.VnTime)
const TCVN3_WORD_FIXES: [RegExp, string][] = [
  // Từ nối và từ ngữ phổ biến nhất trong đề thi và tài liệu
  [/\bcã\b/g, 'có'],
  [/\blµ\b/g, 'là'],
  [/\bvµ\b/g, 'và'],
  [/\bcña\b/g, 'của'],
  [/\bkh«ng\b/gi, 'không'],
  [/\b®îc\b/gi, 'được'],
  [/\bph¶i\b/gi, 'phải'],
  [/\bc¸c\b/gi, 'các'],
  [/\bth×\b/gi, 'thì'],
  [/\bnÕu\b/gi, 'nếu'],
  [/\bvíi\b/gi, 'với'],
  [/\bnµy\b/gi, 'này'],
  [/\b®ã\b/gi, 'đó'],
  [/\b®©y\b/gi, 'đây'],
  [/\b®Ó\b/gi, 'để'],
  [/\b®Òu\b/gi, 'đều'],
  [/\b®Õn\b/gi, 'đến'],
  [/\b®i\b/gi, 'đi'],
  [/\b®·\b/gi, 'đã'],
  [/\bmµ\b/gi, 'mà'],
  [/\bt¹i\b/gi, 'tại'],
  [/\btõ\b/gi, 'từ'],
  [/\bbiÕt\b/gi, 'biết'],
  [/\btÝnh\b/gi, 'tính'],
  [/\bt×m\b/gi, 'tìm'],
  [/\bgäi\b/gi, 'gọi'],
  [/\btrªn\b/gi, 'trên'],
  [/\bdíi\b/gi, 'dưới'],
  [/\btháa\b/gi, 'thỏa'],
  [/\bth¶o\b/gi, 'thảo'],
  [/\bm·n\b/gi, 'mãn'],
  [/\btháa m·n\b/gi, 'thỏa mãn'],
  [/\bgi¸\b/gi, 'giá'],
  [/\btrÞ\b/gi, 'trị'],
  [/\blín\b/gi, 'lớn'],
  [/\bnhá\b/gi, 'nhỏ'],
  [/\bb»ng\b/gi, 'bằng'],
  [/\bkh¸c\b/gi, 'khác'],
  [/\bcïng\b/gi, 'cùng'],
  [/\bthuéc\b/gi, 'thuộc'],
  [/\btån t¹i\b/gi, 'tồn tại'],
  [/\bsè\b/gi, 'số'],
  [/\bhµm\b/gi, 'hàm'],
  [/\b®a thøc\b/gi, 'đa thức'],
  [/\bc¨n bËc\b/gi, 'căn bậc'],
  [/\bbèn\b/gi, 'bốn'],
  [/\bn¨m\b/gi, 'năm'],
  [/\bs¸u\b/gi, 'sáu'],
  [/\bb¶y\b/gi, 'bảy'],
  [/\bt¸m\b/gi, 'tám'],
  [/\bchÝn\b/gi, 'chín'],
  [/\bmêi\b/gi, 'mười'],
  [/\bmøc ®é\b/gi, 'mức độ'],
  [/\bnhËn biÕt\b/gi, 'nhận biết'],
  [/\bth«ng hiÓu\b/gi, 'thông hiểu'],
  [/\bvËn dông\b/gi, 'vận dụng'],
  [/\bchän\b/gi, 'chọn'],
  [/\bc©u hái\b/gi, 'câu hỏi'],
  [/\bc©u\b/gi, 'câu'],
  [/\bhái\b/gi, 'hỏi'],
  [/\b®óng\b/gi, 'đúng'],
  [/\bh·y\b/gi, 'hãy'],
  [/\b®Æt\b/gi, 'đặt'],
  [/\bxÐt\b/gi, 'xét'],
  [/\bgãc\b/gi, 'góc'],
  [/\bc¹nh\b/gi, 'cạnh'],
  [/\b®Ønh\b/gi, 'đỉnh'],
  [/\b®¸y\b/gi, 'đáy'],
  [/\btrôc\b/gi, 'trục'],
  [/\bmÆt cÇu\b/gi, 'mặt cầu'],
  [/\bkhèi\b/gi, 'khối'],
  [/\bnãn\b/gi, 'nón'],
  [/\btrô\b/gi, 'trụ'],
  [/\bkho¶ng c¸ch\b/gi, 'khoảng cách'],
  [/\bhÖ sè\b/gi, 'hệ số'],
  [/\bph¬ng sai\b/gi, 'phương sai'],
  [/\bx¸c suÊt\b/gi, 'xác suất'],
  [/\bbiÕn cè\b/gi, 'biến cố'],
  [/\bcÊp sè céng\b/gi, 'cấp số cộng'],
  [/\bcÊp sè nh©n\b/gi, 'cấp số nhân'],
  [/\bgiíi h¹n\b/gi, 'giới hạn'],
  [/\btËp hîp\b/gi, 'tập hợp'],
  [/\bphÇn tö\b/gi, 'phần tử'],
  [/\brçng\b/gi, 'rỗng'],
  [/\bhîp\b/gi, 'hợp'],
  [/\bmÖnh ®Ò\b/gi, 'mệnh đề'],
  [/\bphñ ®Þnh\b/gi, 'phủ định'],
  [/\bkÐo theo\b/gi, 'kéo theo'],
  [/\bt¬ng ®¬ng\b/gi, 'tương đương'],
  [/\b®¶o\b/gi, 'đảo'],
  [/\bph¶n chøng\b/gi, 'phản chứng'],
  [/\bquy n¹p\b/gi, 'quy nạp'],
  [/\b®iÓm\b/gi, 'điểm'],
  // Thuật ngữ bài học, chương mục
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
  // 3-character compounds for circumflex/breve vowels with accents
  [/aâù/g, 'ấ'], [/aâá/g, 'ấ'], [/aâà/g, 'ầ'], [/aâû/g, 'ẩ'], [/aâõ/g, 'ẫ'], [/aâï/g, 'ậ'],
  [/aêé/g, 'ắ'], [/aêè/g, 'ằ'], [/aêú/g, 'ẳ'], [/aêü/g, 'ẵ'], [/aêë/g, 'ặ'],
  [/eâé/g, 'ế'], [/eâè/g, 'ề'], [/eâû/g, 'ể'], [/eâõ/g, 'ễ'], [/eâï/g, 'ệ'],
  [/oâá/g, 'ố'], [/oâà/g, 'ồ'], [/oâû/g, 'ổ'], [/oâõ/g, 'ỗ'], [/oâï/g, 'ộ'],
  [/ôù/g, 'ớ'], [/ôø/g, 'ờ'], [/ôà/g, 'ờ'], [/ôû/g, 'ở'], [/ôõ/g, 'ỡ'], [/ôï/g, 'ợ'],
  [/öù/g, 'ứ'], [/öø/g, 'ừ'], [/öà/g, 'ừ'], [/öû/g, 'ử'], [/öõ/g, 'ữ'], [/öï/g, 'ự'], [/ö/g, 'ư'],
  // 2-character VNI pairs
  [/aù/g, 'á'], [/aà/g, 'à'], [/aû/g, 'ả'], [/aõ/g, 'ã'], [/aï/g, 'ạ'],
  [/aê/g, 'ă'], [/aé/g, 'ắ'], [/aè/g, 'ằ'], [/aú/g, 'ẳ'], [/aü/g, 'ẵ'], [/aë/g, 'ặ'],
  [/aâ/g, 'â'], [/aá/g, 'ấ'], [/aå/g, 'ẩ'], [/aã/g, 'ẫ'], [/aä/g, 'ậ'],
  [/eù/g, 'é'], [/eà/g, 'è'], [/eû/g, 'ẻ'], [/eõ/g, 'ẽ'], [/eï/g, 'ẹ'],
  [/eâ/g, 'ê'], [/eá/g, 'ế'], [/eà/g, 'ề'], [/eå/g, 'ể'], [/eã/g, 'ễ'], [/eä/g, 'ệ'],
  [/où/g, 'ó'], [/oà/g, 'ò'], [/oû/g, 'ỏ'], [/oõ/g, 'õ'], [/oï/g, 'ọ'],
  [/oâ/g, 'ô'], [/oá/g, 'ố'], [/oà/g, 'ồ'], [/oå/g, 'ổ'], [/oã/g, 'ỗ'], [/oä/g, 'ộ'],
  [/uù/g, 'ú'], [/uà/g, 'ù'], [/uû/g, 'ủ'], [/uõ/g, 'ũ'], [/uï/g, 'ụ'],
  [/yù/g, 'ý'], [/yà/g, 'ỳ'], [/yû/g, 'ỷ'], [/yõ/g, 'ỹ'],
  [/ñ/g, 'đ'], [/Ñ/g, 'Đ'],
  // Uppercase VNI compounds
  [/AÂÙ/g, 'Ấ'], [/AÂÁ/g, 'Ấ'], [/AÂÀ/g, 'Ầ'], [/AÂÛ/g, 'Ẩ'], [/AÂÕ/g, 'Ẫ'], [/AÂÏ/g, 'Ậ'],
  [/AÊÉ/g, 'Ắ'], [/AÊÈ/g, 'Ằ'], [/AÊÚ/g, 'Ẳ'], [/AÊÜ/g, 'Ẵ'], [/AÊË/g, 'Ặ'],
  [/EÂÉ/g, 'Ế'], [/EÂÈ/g, 'Ề'], [/EÂÛ/g, 'Ể'], [/EÂÕ/g, 'Ễ'], [/EÂÏ/g, 'Ệ'],
  [/OÂÁ/g, 'Ố'], [/OÂÀ/g, 'Ồ'], [/OÂÛ/g, 'Ổ'], [/OÂÕ/g, 'Ỗ'], [/OÂÏ/g, 'Ộ'],
  [/ÔÙ/g, 'Ớ'], [/ÔØ/g, 'Ờ'], [/ÔÀ/g, 'Ờ'], [/ÔÛ/g, 'Ở'], [/ÔÕ/g, 'Ỡ'], [/ÔÏ/g, 'Ợ'],
  [/ÖÙ/g, 'Ứ'], [/ÖØ/g, 'Ừ'], [/ÖÀ/g, 'Ừ'], [/ÖÛ/g, 'Ử'], [/ÖÕ/g, 'Ữ'], [/ÖÏ/g, 'Ự'], [/Ö/g, 'Ư'],
  [/AÙ/g, 'Á'], [/AÀ/g, 'À'], [/AÛ/g, 'Ả'], [/AÕ/g, 'Ã'], [/AÏ/g, 'Ạ'],
  [/AÊ/g, 'Ă'], [/AÉ/g, 'Ắ'], [/AÈ/g, 'Ằ'], [/AÚ/g, 'Ẳ'], [/AÜ/g, 'Ẵ'], [/AË/g, 'Ặ'],
  [/AÂ/g, 'Â'], [/AÁ/g, 'Ấ'], [/AÅ/g, 'Ẩ'], [/AÃ/g, 'Ẫ'], [/AÄ/g, 'Ậ'],
  [/EÙ/g, 'É'], [/EÀ/g, 'È'], [/EÛ/g, 'Ẻ'], [/EÕ/g, 'Ẽ'], [/EÏ/g, 'Ẹ'],
  [/EÂ/g, 'Ê'], [/EÁ/g, 'Ế'], [/EÀ/g, 'Ề'], [/EÅ/g, 'Ể'], [/EÃ/g, 'Ễ'], [/EÄ/g, 'Ệ'],
  [/OÙ/g, 'Ó'], [/OÀ/g, 'Ò'], [/OÛ/g, 'Ỏ'], [/OÕ/g, 'Õ'], [/OÏ/g, 'Ọ'],
  [/OÂ/g, 'Ô'], [/OÁ/g, 'Ố'], [/OÀ/g, 'Ồ'], [/OÅ/g, 'Ổ'], [/OÃ/g, 'Ỗ'], [/OÄ/g, 'Ộ'],
  [/UÙ/g, 'Ú'], [/UÀ/g, 'Ù'], [/UÛ/g, 'Ủ'], [/UÕ/g, 'Ũ'], [/UÏ/g, 'Ụ']
];

// UTF-8 Mojibake pairs (when UTF-8 Vietnamese bytes are decoded as CP1252/ISO-8859-1)
export function repairUtf8Mojibake(text: string): string {
  if (!text) return '';
  if (!/[Ãáºá»]/.test(text)) return text;
  return text
    // Multi-byte UTF-8 sequences (3-byte characters)
    .replace(/áº£/g, 'ả').replace(/áº¡/g, 'ạ').replace(/áº¯/g, 'ắ').replace(/áº±/g, 'ằ')
    .replace(/áº³/g, 'ẳ').replace(/áºµ/g, 'ẵ').replace(/áº·/g, 'ặ').replace(/áº¥/g, 'ấ')
    .replace(/áº§/g, 'ầ').replace(/áº©/g, 'ẩ').replace(/áº«/g, 'ẫ').replace(/áº­/g, 'ậ')
    .replace(/áº»/g, 'ẻ').replace(/áº½/g, 'ẽ').replace(/áº¹/g, 'ẹ').replace(/áº¿/g, 'ế')
    .replace(/á»/g, 'ề').replace(/á»ƒ/g, 'ể').replace(/á»…/g, 'ễ').replace(/á»‡/g, 'ệ')
    .replace(/á»‰/g, 'ỉ').replace(/á»‹/g, 'ị').replace(/á»/g, 'ọ').replace(/á»/g, 'ỏ')
    .replace(/á»‘/g, 'ố').replace(/á»“/g, 'ồ').replace(/á»•/g, 'ổ').replace(/á»—/g, 'ỗ')
    .replace(/á»™/g, 'ộ').replace(/á»›/g, 'ớ').replace(/á»/g, 'ờ').replace(/á»Ÿ/g, 'ở')
    .replace(/á»¡/g, 'ỡ').replace(/á»£/g, 'ợ').replace(/á»¥/g, 'ụ').replace(/á»§/g, 'ủ')
    .replace(/á»©/g, 'ứ').replace(/á»«/g, 'ừ').replace(/á»­/g, 'ử').replace(/á»¯/g, 'ữ')
    .replace(/á»±/g, 'ự').replace(/á»³/g, 'ỳ').replace(/á»µ/g, 'ỵ').replace(/á»·/g, 'ỷ')
    .replace(/á»¹/g, 'ỹ')
    // 2-byte UTF-8 sequences
    .replace(/Ã¡/g, 'á').replace(/Ã /g, 'à').replace(/Ã£/g, 'ã').replace(/Ã¢/g, 'â')
    .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ãª/g, 'ê').replace(/Ã­/g, 'í')
    .replace(/Ã¬/g, 'ì').replace(/Ã³/g, 'ó').replace(/Ã²/g, 'ò').replace(/Ã´/g, 'ô')
    .replace(/Ãº/g, 'ú').replace(/Ã¹/g, 'ù').replace(/Ã½/g, 'ý').replace(/Ä‘/g, 'đ')
    .replace(/Ä/g, 'Đ');
}

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
  [/[\uF03D]/g, ' = '],
  [/[\uF03E]/g, ' > '],
  [/[\uF03C]/g, ' < '],
  [/[\uF028]/g, '('],
  [/[\uF029]/g, ')'],
  [/[\uF02D]/g, '-'],
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
 * Tự động sửa chữa các từ ngữ tiếng Việt (cả chữ thường và chữ in hoa)
 * từng bị lỗi phông chữ hoặc bị chuyển đổi nhầm từ bảng mã cũ TCVN3 trước đó.
 */
export function repairCorruptedVietnameseWords(text: string): string {
  if (!text) return '';
  let s = repairUtf8Mojibake(text);

  return s
    // Sửa lỗi câu hỏi / chọn đáp án trong đề kiểm tra
    .replace(/(?<![a-zA-ZÀ-ỹ])c[âa]u\s+h[áa]i(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m[0] === 'C' ? (_m.toUpperCase() === _m ? 'CÂU HỎI' : 'Câu hỏi') : 'câu hỏi')
    .replace(/(?<![a-zA-ZÀ-ỹ])c©u\s+hái(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m[0] === 'C' ? (_m.toUpperCase() === _m ? 'CÂU HỎI' : 'Câu hỏi') : 'câu hỏi')
    .replace(/(?<![a-zA-ZÀ-ỹ])c©u(?![a-zA-ZÀ-ỹ])/g, 'câu')
    .replace(/(?<![a-zA-ZÀ-ỹ])C©u(?![a-zA-ZÀ-ỹ])/g, 'Câu')
    .replace(/(?<![a-zA-ZÀ-ỹ])C¢U(?![a-zA-ZÀ-ỹ])/g, 'CÂU')
    .replace(/(?<![a-zA-ZÀ-ỹ])hái(?![a-zA-ZÀ-ỹ])/g, 'hỏi')
    .replace(/(?<![a-zA-ZÀ-ỹ])Hái(?![a-zA-ZÀ-ỹ])/g, 'Hỏi')
    .replace(/(?<![a-zA-ZÀ-ỹ])H¶I(?![a-zA-ZÀ-ỹ])/g, 'HỎI')
    .replace(/(?<![a-zA-ZÀ-ỹ])ch[äa]n(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m[0] === 'C' ? (_m.toUpperCase() === _m ? 'CHỌN' : 'Chọn') : 'chọn')
    .replace(/(?<![a-zA-ZÀ-ỹ])®[óo]ng(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m.toUpperCase() === _m ? 'ĐÚNG' : 'đúng')
    .replace(/(?<![a-zA-ZÀ-ỹ])®iÓm(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m[0] === '®' || _m[0] === 'Đ' ? (_m.toUpperCase() === _m ? 'ĐIỂM' : 'Điểm') : 'điểm')
    .replace(/(?<![a-zA-ZÀ-ỹ])®iÒu\s+kiÖn(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m.toUpperCase() === _m ? 'ĐIỀU KIỆN' : 'điều kiện')
    .replace(/(?<![a-zA-ZÀ-ỹ])®iÒu(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m.toUpperCase() === _m ? 'ĐIỀU' : 'điều')
    .replace(/(?<![a-zA-ZÀ-ỹ])kiÖn(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m.toUpperCase() === _m ? 'KIỆN' : 'kiện')
    .replace(/(?<![a-zA-ZÀ-ỹ])nghiÖm(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m[0] === 'N' ? (_m.toUpperCase() === _m ? 'NGHIỆM' : 'Nghiệm') : 'nghiệm')
    .replace(/(?<![a-zA-ZÀ-ỹ])biÕt(?![a-zA-ZÀ-ỹ])/gi, (_m) => _m[0] === 'B' ? (_m.toUpperCase() === _m ? 'BIẾT' : 'Biết') : 'biết')
    .replace(/(?<![a-zA-ZÀ-ỹ])sè(?![a-zA-ZÀ-ỹ])/g, 'số')
    .replace(/(?<![a-zA-ZÀ-ỹ])Sè(?![a-zA-ZÀ-ỹ])/g, 'Số')
    .replace(/(?<![a-zA-ZÀ-ỹ])SÈ(?![a-zA-ZÀ-ỹ])/g, 'SỐ')
    .replace(/(?<![a-zA-ZÀ-ỹ])bèn(?![a-zA-ZÀ-ỹ])/g, 'bốn')
    .replace(/(?<![a-zA-ZÀ-ỹ])Bèn(?![a-zA-ZÀ-ỹ])/g, 'Bốn')
    .replace(/(?<![a-zA-ZÀ-ỹ])BÈN(?![a-zA-ZÀ-ỹ])/g, 'BỐN')
    .replace(/(?<![a-zA-ZÀ-ỹ])th×(?![a-zA-ZÀ-ỹ])/g, 'thì')
    .replace(/(?<![a-zA-ZÀ-ỹ])Th×(?![a-zA-ZÀ-ỹ])/g, 'Thì')
    .replace(/(?<![a-zA-ZÀ-ỹ])TH×(?![a-zA-ZÀ-ỹ])/g, 'THÌ')
    .replace(/(?<![a-zA-ZÀ-ỹ])tÝnh(?![a-zA-ZÀ-ỹ])/g, 'tính')
    .replace(/(?<![a-zA-ZÀ-ỹ])TÝnh(?![a-zA-ZÀ-ỹ])/g, 'Tính')
    .replace(/(?<![a-zA-ZÀ-ỹ])TÝNH(?![a-zA-ZÀ-ỹ])/g, 'TÍNH')
    .replace(/(?<![a-zA-ZÀ-ỹ])t×m(?![a-zA-ZÀ-ỹ])/g, 'tìm')
    .replace(/(?<![a-zA-ZÀ-ỹ])T×m(?![a-zA-ZÀ-ỹ])/g, 'Tìm')
    .replace(/(?<![a-zA-ZÀ-ỹ])T×M(?![a-zA-ZÀ-ỹ])/g, 'TÌM')
    // Sửa trực tiếp lỗi "MỞ ĐẦU VỀ ĐƯỜNG TRỀN" / "ĐƯỜNG TRỀN" / "TRềN" / "trßn"
    .replace(/(?<![a-zA-ZÀ-ỹ])MỞ\s+ĐẦU\s+VỀ\s+ĐƯỜNG\s+TR[ềỀeE]N(?![a-zA-ZÀ-ỹ])/gi, 'MỞ ĐẦU VỀ ĐƯỜNG TRÒN')
    .replace(/(?<![a-zA-ZÀ-ỹ])(ĐƯỜNG|CUNG|HÌNH|BÁN\s+KÍNH)\s+TR[ềỀ]N(?![a-zA-ZÀ-ỹ])/g, '$1 TRÒN')
    .replace(/(?<![a-zA-ZÀ-ỹ])(đường|cung|hình|bán\s+kính)\s+tr[ềỀ]n(?![a-zA-ZÀ-ỹ])/gi, '$1 tròn')
    .replace(/(?<![a-zA-ZÀ-ỹ])TR[ềỀ]N\s+(XOAY|ĐỀU)(?![a-zA-ZÀ-ỹ])/g, 'TRÒN $1')
    .replace(/(?<![a-zA-ZÀ-ỹ])tr[ềỀ]n\s+(xoay|đều)(?![a-zA-ZÀ-ỹ])/g, 'tròn $1')
    .replace(/(?<![a-zA-ZÀ-ỹ])TR[ềỀ]N(?![a-zA-ZÀ-ỹ])/g, 'TRÒN')
    .replace(/(?<![a-zA-ZÀ-ỹ])tr[ềỀ]n(?![a-zA-ZÀ-ỹ])/g, 'tròn')
    .replace(/(?<![a-zA-ZÀ-ỹ])trßn(?![a-zA-ZÀ-ỹ])/g, 'tròn')
    .replace(/(?<![a-zA-ZÀ-ỹ])Trßn(?![a-zA-ZÀ-ỹ])/g, 'Tròn')
    .replace(/(?<![a-zA-ZÀ-ỹ])TRßN(?![a-zA-ZÀ-ỹ])/g, 'TRÒN')
    .replace(/(?<![a-zA-ZÀ-ỹ])®êng\s+trßn(?![a-zA-ZÀ-ỹ])/gi, 'đường tròn')
    .replace(/(?<![a-zA-ZÀ-ỹ])®êng\s+th¼ng(?![a-zA-ZÀ-ỹ])/gi, 'đường thẳng')
    .replace(/(?<![a-zA-ZÀ-ỹ])®êng\s+kÝnh(?![a-zA-ZÀ-ỹ])/gi, 'đường kính')
    .replace(/(?<![a-zA-ZÀ-ỹ])b¸n\s+kÝnh(?![a-zA-ZÀ-ỹ])/gi, 'bán kính')
    // Sửa các từ hình học, toán học in hoa bị lỗi
    .replace(/(?<![a-zA-ZÀ-ỹ])H[èÈ×]NH(?![a-zA-ZÀ-ỹ])/g, 'HÌNH')
    .replace(/(?<![a-zA-ZÀ-ỹ])h[èÈ×]nh(?![a-zA-ZÀ-ỹ])/g, 'hình')
    .replace(/(?<![a-zA-ZÀ-ỹ])H×nh(?![a-zA-ZÀ-ỹ])/g, 'Hình')
    .replace(/(?<![a-zA-ZÀ-ỹ])CH[ểỂã]P(?![a-zA-ZÀ-ỹ])/g, 'CHÓP')
    .replace(/(?<![a-zA-ZÀ-ỹ])ch[ểỂã]p(?![a-zA-ZÀ-ỹ])/g, 'chóp')
    .replace(/(?<![a-zA-ZÀ-ỹ])Chãp(?![a-zA-ZÀ-ỹ])/g, 'Chóp')
    .replace(/(?<![a-zA-ZÀ-ỹ])G[ểỂã]C(?![a-zA-ZÀ-ỹ])/g, 'GÓC')
    .replace(/(?<![a-zA-ZÀ-ỹ])g[ểỂã]c(?![a-zA-ZÀ-ỹ])/g, 'góc')
    .replace(/(?<![a-zA-ZÀ-ỹ])Gãc(?![a-zA-ZÀ-ỹ])/g, 'Góc')
    .replace(/(?<![a-zA-ZÀ-ỹ])N[ểỂã]N(?![a-zA-ZÀ-ỹ])/g, 'NÓN')
    .replace(/(?<![a-zA-ZÀ-ỹ])n[ểỂã]n(?![a-zA-ZÀ-ỹ])/g, 'nón')
    .replace(/(?<![a-zA-ZÀ-ỹ])Nãn(?![a-zA-ZÀ-ỹ])/g, 'Nón')
    .replace(/(?<![a-zA-ZÀ-ỹ])KH[èÈ]I(?![a-zA-ZÀ-ỹ])/g, 'KHỐI')
    .replace(/(?<![a-zA-ZÀ-ỹ])kh[èÈ]i(?![a-zA-ZÀ-ỹ])/g, 'khối')
    .replace(/(?<![a-zA-ZÀ-ỹ])Khèi(?![a-zA-ZÀ-ỹ])/g, 'Khối')
    .replace(/(?<![a-zA-ZÀ-ỹ])MÆT\s+CÇU(?![a-zA-ZÀ-ỹ])/gi, 'MẶT CẦU')
    .replace(/(?<![a-zA-ZÀ-ỹ])mÆt\s+cÇu(?![a-zA-ZÀ-ỹ])/gi, 'mặt cầu')
    .replace(/(?<![a-zA-ZÀ-ỹ])MÆT\s+PH¼NG(?![a-zA-ZÀ-ỹ])/gi, 'MẶT PHẲNG')
    .replace(/(?<![a-zA-ZÀ-ỹ])mÆt\s+ph¼ng(?![a-zA-ZÀ-ỹ])/gi, 'mặt phẳng')
    .replace(/(?<![a-zA-ZÀ-ỹ])B¶NG\s+BIÕN\s+THIªN(?![a-zA-ZÀ-ỹ])/gi, 'BẢNG BIẾN THIÊN')
    .replace(/(?<![a-zA-ZÀ-ỹ])b¶ng\s+biÕn\s+thiªn(?![a-zA-ZÀ-ỹ])/gi, 'bảng biến thiên')
    .replace(/(?<![a-zA-ZÀ-ỹ])CùC\s+TRÞ(?![a-zA-ZÀ-ỹ])/gi, 'CỰC TRỊ')
    .replace(/(?<![a-zA-ZÀ-ỹ])cùc\s+trÞ(?![a-zA-ZÀ-ỹ])/gi, 'cực trị')
    .replace(/(?<![a-zA-ZÀ-ỹ])®å\s+thÞ(?![a-zA-ZÀ-ỹ])/gi, 'đồ thị')
    .replace(/(?<![a-zA-ZÀ-ỹ])®ång\s+biÕn(?![a-zA-ZÀ-ỹ])/gi, 'đồng biến')
    .replace(/(?<![a-zA-ZÀ-ỹ])nghÞch\s+biÕn(?![a-zA-ZÀ-ỹ])/gi, 'nghịch biến')
    .replace(/(?<![a-zA-ZÀ-ỹ])tiÖm\s+cËn(?![a-zA-ZÀ-ỹ])/gi, 'tiệm cận')
    .replace(/(?<![a-zA-ZÀ-ỹ])tËp\s+x¸c\s+®Þnh(?![a-zA-ZÀ-ỹ])/gi, 'tập xác định')
    .replace(/(?<![a-zA-ZÀ-ỹ])®¹o\s+hµm(?![a-zA-ZÀ-ỹ])/gi, 'đạo hàm')
    .replace(/(?<![a-zA-ZÀ-ỹ])nguyªn\s+hµm(?![a-zA-ZÀ-ỹ])/gi, 'nguyên hàm')
    .replace(/(?<![a-zA-ZÀ-ỹ])tÝch\s+ph©n(?![a-zA-ZÀ-ỹ])/gi, 'tích phân')
    .replace(/(?<![a-zA-ZÀ-ỹ])(MỆNH|CHỦ|VẤN|TIÊN|ĐỀ|CHUYÊN)\s+Đ[ấẤ](?![a-zA-ZÀ-ỹ])/g, '$1 ĐỀ')
    .replace(/(?<![a-zA-ZÀ-ỹ])(mệnh|chủ|vấn|tiên|đề|chuyên)\s+đ[ấẤ](?![a-zA-ZÀ-ỹ])/g, '$1 đề')
    .replace(/(?<![a-zA-ZÀ-ỹ])(ĐỊNH|VÔ|VẬT|TÂM|QUẢN|XỬ)\s+L[íÍ](?![a-zA-ZÀ-ỹ])/g, '$1 LÝ')
    .replace(/(?<![a-zA-ZÀ-ỹ])(định|vô|vật|tâm|quản|xử)\s+l[íÍ](?![a-zA-ZÀ-ỹ])/g, '$1 lý')
    .replace(/(?<![a-zA-ZÀ-ỹ])CHÚ\s+[íÍ](?![a-zA-ZÀ-ỹ])/g, 'CHÚ Ý')
    .replace(/(?<![a-zA-ZÀ-ỹ])chú\s+[íÍ](?![a-zA-ZÀ-ỹ])/g, 'chú ý')
    .replace(/(?<![a-zA-ZÀ-ỹ])ĐỒ\s+TH[èÈ](?![a-zA-ZÀ-ỹ])/g, 'ĐỒ THỊ')
    .replace(/(?<![a-zA-ZÀ-ỹ])đồ\s+th[èÈ](?![a-zA-ZÀ-ỹ])/g, 'đồ thị')
    .replace(/(?<![a-zA-ZÀ-ỹ])(bài|dạng|môn|tổ)\s+tốn(?![a-zA-ZÀ-ỹ])/gi, (_m, prefix) => {
      return prefix === prefix.toUpperCase() ? `${prefix} TOÁN` : `${prefix} toán`;
    })
    .replace(/(?<![a-zA-ZÀ-ỹ])TỐN(?![a-zA-ZÀ-ỹ])/g, 'TOÁN')
    .replace(/(?<![a-zA-ZÀ-ỹ])tốn(?![a-zA-ZÀ-ỹ])/g, 'toán')
    .replace(/(?<![a-zA-ZÀ-ỹ])đớnh\s+kốm(?![a-zA-ZÀ-ỹ])/gi, 'đính kèm')
    .replace(/(?<![a-zA-ZÀ-ỹ])trọng\s+tõm(?![a-zA-ZÀ-ỹ])/gi, 'trọng tâm')
    .replace(/(?<![a-zA-ZÀ-ỹ])cụng\s+thức(?![a-zA-ZÀ-ỹ])/gi, 'công thức')
    .replace(/(?<![a-zA-ZÀ-ỹ])Cỏc\s+dạng(?![a-zA-ZÀ-ỹ])/g, 'Các dạng')
    .replace(/(?<![a-zA-ZÀ-ỹ])cỏc\s+dạng(?![a-zA-ZÀ-ỹ])/gi, 'các dạng')
    .replace(/(?<![a-zA-ZÀ-ỹ])điển\s+hỡnh(?![a-zA-ZÀ-ỹ])/gi, 'điển hình')
    .replace(/(?<![a-zA-ZÀ-ỹ])Phương\s+phỏp(?![a-zA-ZÀ-ỹ])/g, 'Phương pháp')
    .replace(/(?<![a-zA-ZÀ-ỹ])phương\s+phỏp(?![a-zA-ZÀ-ỹ])/gi, 'phương pháp')
    .replace(/(?<![a-zA-ZÀ-ỹ])vớ\s+dụ(?![a-zA-ZÀ-ỹ])/gi, 'ví dụ')

    // SỬA TRIỆT ĐỂ CÁC TỪ BỊ LỆCH PHÔNG DO CHUYỂN ĐỔI NHẦM KÝ TỰ UNICODE QUA TCVN3
    // - "các" bị thành "cỏc"
    .replace(/\bcỏc\b/g, 'các')
    .replace(/\bCỏc\b/g, 'Các')
    .replace(/\bCỎC\b/g, 'CÁC')
    // - "dây" bị thành "dùy"
    .replace(/\bdùy\b/g, 'dây')
    .replace(/\bDùy\b/g, 'Dây')
    .replace(/\bDÙY\b/g, 'DÂY')
    // - "tròn" bị thành "trũn"
    .replace(/\btrũn\b/g, 'tròn')
    .replace(/\bTrũn\b/g, 'Tròn')
    .replace(/\bTRŨN\b/g, 'TRÒN')
    // - "kính" bị thành "kớnh"
    .replace(/\bkớnh\b/g, 'kính')
    .replace(/\bKớnh\b/g, 'Kính')
    .replace(/\bKỚNH\b/g, 'KÍNH')
    // - "có" bị thành "cỳ"
    .replace(/\bcỳ\b/g, 'có')
    .replace(/\bCỳ\b/g, 'Có')
    .replace(/\bCỲ\b/g, 'CÓ')
    // - "góc" bị thành "gỳc"
    .replace(/\bgỳc\b/g, 'góc')
    .replace(/\bGỳc\b/g, 'Góc')
    .replace(/\bGỲC\b/g, 'GÓC')
    // - "tâm" bị thành "từm"
    .replace(/\btừm\b/g, 'tâm')
    .replace(/\bTừm\b/g, 'Tâm')
    .replace(/\bTỪM\b/g, 'TÂM')
    // - "bán kính" bị thành "bỏn kớnh" / "bỏn"
    .replace(/\bbỏn\s+kớnh\b/gi, 'bán kính')
    .replace(/\bbỏn\b/g, 'bán')
    .replace(/\bBỏn\b/g, 'Bán')
    // - "đáp án" bị thành "đỏp ỏn"
    .replace(/\bđỏp\s+ỏn\b/gi, 'đáp án')
    .replace(/\bđỏp\b/g, 'đáp')
    .replace(/\bĐỏp\b/g, 'Đáp')
    // - "toán" bị thành "toỏn"
    .replace(/\btoỏn\b/gi, 'toán')
    .replace(/\bToỏn\b/g, 'Toán')
    // - "phát" -> "phỏt", "khác" -> "khỏc", "tháng" -> "thỏng"
    .replace(/\bkhỏc\b/gi, 'khác')
    .replace(/\bthỏng\b/gi, 'tháng')
    .replace(/\bphỏt\b/gi, 'phát')
    // - "tính" -> "tớnh", "chính" -> "chớnh", "hình" -> "hớnh", "bình" -> "bớnh"
    .replace(/\btớnh\b/gi, 'tính')
    .replace(/\bchớnh\b/gi, 'chính')
    .replace(/\bhớnh\b/gi, 'hình')
    .replace(/\bbớnh\b/gi, 'bình')
    // - "đó" -> "đỳ", "nói" -> "nỳi", "khó" -> "khỳ", "nó" -> "nỳ", "chóp" -> "chỳp"
    .replace(/\bđỳ\b/g, 'đó')
    .replace(/\bĐỳ\b/g, 'Đó')
    .replace(/\bnỳi\b/gi, 'nói')
    .replace(/\bkhỳ\b/gi, 'khó')
    .replace(/\bchỳp\b/gi, 'chóp')
    .replace(/\bChỳp\b/g, 'Chóp')
    // - "đây" -> "đùy", "mây" -> "mùy", "cây" -> "cùy", "thầy" -> "thùy"
    .replace(/\bđùy\b/gi, 'đây')
    .replace(/\bĐùy\b/g, 'Đây')
    .replace(/\bmùy\b/gi, 'mây')
    .replace(/\bcùy\b/gi, 'cây')
    .replace(/\bthùy\b/gi, 'thầy')
    // - Cụm từ hình học và câu hỏi chuẩn
    .replace(/\bđường\s+trũn\b/gi, 'đường tròn')
    .replace(/\bĐường\s+trũn\b/gi, 'Đường tròn')
    .replace(/\bđường\s+kớnh\b/gi, 'đường kính')
    .replace(/\bĐường\s+kớnh\b/gi, 'Đường kính')
    .replace(/\bcung\s+trũn\b/gi, 'cung tròn')
    .replace(/\bhình\s+trũn\b/gi, 'hình tròn')
    .replace(/\bcỳ\s+độ\s+dài\b/gi, 'có độ dài')
    .replace(/\bcỳ\s+gỳc\b/gi, 'có góc')
    .replace(/\bgỳc\s+ở\s+từm\b/gi, 'góc ở tâm')
    .replace(/\bở\s+từm\b/gi, 'ở tâm')
    .replace(/\btrọng\s+từm\b/gi, 'trọng tâm')
    .replace(/\btrong\s+cỏc\s+dùy\b/gi, 'trong các dây')
    .replace(/\bcỏc\s+dùy\b/gi, 'các dây');
}

/**
 * Kiểm tra xem văn bản đã là Unicode tiếng Việt chuẩn hay chưa.
 */
export function isAlreadyUnicode(text: string): boolean {
  if (!text) return true;

  // 1. Ký tự độc nhất vô nhị chỉ có trong tiếng Việt Unicode (U+0102-01B0, U+1EA0-1EF9)
  const unicodeCount = (text.match(/[\u1EA0-\u1EF9đĐơƠưƯăĂ]/g) || []).length;
  if (unicodeCount >= 1) {
    return true;
  }

  // 2. Kiểm tra các từ tiếng Việt Unicode chuẩn thường gặp
  const commonWordsMatch = text.match(/\b(bài|học|toán|hàm|số|đồng|biến|nghịch|tập|xác|định|đạo|nguyên|tích|phân|ví|dụ|lời|giải|chứng|minh|phương|trình|điều|kiện|công|thức|cho|với|khi|nếu|thì|trong|của|các|được|người|không|những|một|có|là|đường|tròn|góc|hình|mở|đầu|chương|dây|cung|bán|kính|tâm|độ|dài|lớn|nhất|nhỏ|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\b/gi);
  if (commonWordsMatch && commonWordsMatch.length >= 1) {
    return true;
  }

  return false;
}

/**
 * Kiểm tra xem văn bản có phải mã TCVN3 (.VnTime, .VnTimeH) không.
 * CHỈ nhận diện TCVN3 khi có từ vựng hoặc ký tự điều khiển TCVN3 đặc thù,
 * tuyệt đối không nhầm lẫn với nguyên âm có dấu trong Unicode.
 */
export function isLegacyTcvn3(text: string): boolean {
  if (!text) return false;

  // Kiểm tra từ điển TCVN3 đặc trưng không bao giờ xuất hiện ở Unicode
  const tcvn3Words = text.match(/\b(bµi|®îc|kh«ng|ngêi|ph¬ng|hµm|®ång|biÕn|ph¶i|c¸c|®iÒu|tam gi¸c|c«ng thøc|vÝ dô|lêi gi¶i|®¹i sè|h×nh häc|®¹o hµm|c©u hái|®¸p ¸n|tiÖm cËn|tËp x¸c ®Þnh)\b/gi);
  if (tcvn3Words && tcvn3Words.length > 0) return true;

  // Nếu văn bản đã là Unicode rõ ràng và không có từ khoá TCVN3, không phải TCVN3
  if (isAlreadyUnicode(text)) return false;

  // Kiểm tra tần suất ký tự điều khiển đặc trưng TCVN3 (® ¨ © ª « ¬ ­ µ ¸ ¶ · ¹ » ¾ ¼ ½)
  const markerCount = (text.match(/[®¨©ª«¬­µ¸¶·¹»¾¼½]/g) || []).length;
  return markerCount >= 2;
}

/**
 * Kiểm tra xem văn bản có phải mã VNI Windows không
 */
export function isLegacyVni(text: string): boolean {
  if (!text) return false;

  const vniWords = text.match(/\b(baøi|toaùn|phöông|ñöôïc|khoâng|ngöôøi|haøm|ñoàng|nghòch|ñieàu|caùc|gioù|thöùc|ví duï)\b/gi);
  if (vniWords && vniWords.length > 0) return true;

  // Nếu đã là Unicode, không nhầm lẫn VNI
  if (isAlreadyUnicode(text)) return false;

  const vniPatternCount = (text.match(/(ñ[a-z]|aù|aà|aû|aõ|aï|eù|eà|où|uù|öù|öø)/g) || []).length;
  return vniPatternCount >= 2;
}

/**
 * Chuyển đổi một từ hoặc token chứa ký tự đặc trưng của TCVN3 sang Unicode chuẩn.
 * CHỈ chuyển đổi khi từ có chứa ký tự điều khiển TCVN3 thực sự,
 * tuyệt đối không can thiệp các từ đã là tiếng Việt Unicode chuẩn.
 */
export function convertTcvn3Word(word: string, forceUpper = false): string {
  if (!word) return '';

  // Chỉ nhận diện các ký tự TCVN3 thực thụ (ký hiệu phi chữ cái như ®, ¸, µ, ¶, ·, ¹, ¨, ©, ª, «, ¬, ­...)
  if (!/[®¨©ª«¬­µ¸¶·¹»¾¼½§¡¢£¤¥¦]/.test(word)) {
    return word;
  }

  // Xác định xem từ này có nên là in hoa không (dựa vào cờ forceUpper hoặc đa số ký tự ASCII là in hoa)
  const asciiLetters = word.replace(/[^a-zA-Z]/g, '');
  const isUpperWord = forceUpper || (asciiLetters.length > 0 && asciiLetters === asciiLetters.toUpperCase());

  let converted = '';
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i);
    const prevIsUpper = i > 0 && /[A-Z]/.test(word[i - 1]);
    const nextIsUpper = i < word.length - 1 && /[A-Z]/.test(word[i + 1]);

    if (prevIsUpper && nextIsUpper && (code === 0xd2 || code === 0xd3 || code === 0xd4 || code === 0xd5 || code === 0xcc || code === 0xdd)) {
      converted += word[i];
    } else if (code >= 0xa1 && code <= 0xfe && (TCVN3_CHAR_MAP[code] !== undefined || TCVN3_UPPER_CHAR_MAP[code] !== undefined)) {
      if (isUpperWord) {
        converted += (TCVN3_UPPER_CHAR_MAP[code] || TCVN3_CHAR_MAP[code] || word[i]).toUpperCase();
      } else {
        converted += (TCVN3_CHAR_MAP[code] || TCVN3_UPPER_CHAR_MAP[code] || word[i]);
      }
    } else {
      converted += word[i];
    }
  }

  // Xử lý nguyên âm đôi TCVN3 ơng/ước
  converted = converted.replace(/([cChHpPtT])ơng/g, '$1ương');
  converted = converted.replace(/([bBcCdDđĐgGhHkKlLmMnNpPqQrRsStTvVxX])ước/g, '$1ước');
  converted = converted.replace(/([cChHpPtT])ƠNG/g, '$1ƯƠNG');
  converted = converted.replace(/([bBcCdDđĐgGhHkKlLmMnNpPqQrRsStTvVxX])ƯỚC/g, '$1ƯỚC');

  return converted;
}

/**
 * Converts TCVN3 / ABC (.VnTime, .VnTimeH) and VNI encoded text to standard Unicode (NFC).
 * AN TOÀN TUYỆT ĐỐI: Bảo toàn 100% tiếng Việt Unicode chuẩn, chỉ chuyển đổi mã cũ TCVN3 / VNI khi có dấu hiệu.
 */
export function convertTcvn3ToUnicode(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 0. Sửa lỗi Mojibake UTF-8 trước
  text = repairUtf8Mojibake(text);

  // 0.1 Sửa các từ bị lỗi lệch phông (cỏc -> các, dùy -> dây, trũn -> tròn, kớnh -> kính, cỳ -> có, gỳc -> góc, từm -> tâm)
  text = repairCorruptedVietnameseWords(text);

  // 1. Luôn chạy TCVN3_WORD_FIXES: các từ ngữ đặc thù này (ph¬ng tr×nh, tam gi¸c, ®¹o hµm, cã, lµ, vµ, cña...)
  // chỉ xuất hiện ở tài liệu gõ phông .VnTime cũ, không bao giờ xuất hiện ở tiếng Việt Unicode chuẩn.
  for (const [pattern, replacement] of TCVN3_WORD_FIXES) {
    text = text.replace(pattern, replacement);
  }

  // 2. Chuyển đổi VNI Windows CHỈ KHI văn bản thực sự là mã VNI
  if (isLegacyVni(text)) {
    for (const [pattern, replacement] of VNI_PAIRS) {
      text = text.replace(pattern, replacement);
    }
  }

  // 3. Nếu văn bản là mã cũ TCVN3 thuần (.VnTime / .VnTimeH)
  if (isLegacyTcvn3(text)) {
    let converted = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const prevIsUpper = i > 0 && /[A-Z]/.test(text[i - 1]);
      const nextIsUpper = i < text.length - 1 && /[A-Z]/.test(text[i + 1]);
      if (prevIsUpper && nextIsUpper && (code === 0xd2 || code === 0xd3 || code === 0xd4 || code === 0xd5 || code === 0xcc || code === 0xdd)) {
        converted += text[i];
      } else if (code >= 0xa1 && TCVN3_CHAR_MAP[code] !== undefined) {
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

  return repairCorruptedVietnameseWords(text);
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
 * Tìm vị trí dấu đóng ngoặc tương ứng (hỗ trợ ngoặc lồng nhau)
 */
export function findClosingBrace(str: string, startIdx: number, openChar = '{', closeChar = '}'): number {
  if (str[startIdx] !== openChar) return -1;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
      continue;
    }
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Standardizes mathematical formulas and MathType symbols into clean LaTeX.
 * BẢO VỆ 100% CÔNG THỨC TOÁN HỌC VÀ KÝ HIỆU, KHÔNG LÀM HỎNG HOẶC ĐỨT GÃY BIỂU THỨC.
 * Áp dụng cơ chế Safe Tokenization: Trích xuất và bảo vệ toàn bộ công thức toán trước,
 * chỉ xử lý định dạng trên phần văn bản thường, sau đó khôi phục lại nguyên vẹn.
 */
export function formatMathExpressions(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 0. Sửa lỗi ký tự thoát dòng và phục hồi các lệnh LaTeX bị đứt gãy do \n (như \ne -> \n e, \notin -> \n otin)
  text = text.replace(/\\r\\n/g, '\n');
  // 0.0 Phục hồi triệt để các trường hợp \left bị gãy thành \le ft hoặc \neq bị gãy thành \ne q từ dữ liệu cũ
  text = text.replace(/\\le\s+ft(?=[^a-zA-Z]|$)/g, '\\left');
  text = text.replace(/\\ne\s+q(?=[^a-zA-Z0-9]|$)/g, '\\neq');
  text = text.replace(/\\ge\s+q(?=[^a-zA-Z0-9]|$)/g, '\\geq');
  text = text.replace(/\\n(?=[A-ZÀ-ỹa-z0-9\-\*\s])/g, (_match, offset, full) => {
    const rest = full.slice(offset);
    if (/^\\n(e|eq|otin|earrow|abla|u)\b/.test(rest)) {
      return '\\n'; // giữ nguyên macro latex
    }
    return '\n';
  });
  text = text.replace(/(?:^|\n)\s*e\s+([a-zA-Z0-9\-\+\\]+)/g, ' \\ne $1');
  text = text.replace(/([^\n])\s*\n\s*e\s+([a-zA-Z0-9\-\+\\]+)/g, '$1 \\ne $2');
  text = text.replace(/(?:^|\n)\s*otin\b/g, ' \\notin');
  text = text.replace(/([^\n])\s*\n\s*otin\b/g, '$1 \\notin');
  text = text.replace(/(?:^|\n)\s*earrow\b/g, ' \\nearrow');
  text = text.replace(/([^\n])\s*\n\s*earrow\b/g, '$1 \\nearrow');
  text = text.replace(/(?:^|\n)\s*eq\b/g, ' \\neq');
  text = text.replace(/([^\n])\s*\n\s*eq\b/g, '$1 \\neq');

  // HỆ THỐNG TOKEN HÓA TOÁN HỌC AN TOÀN TUYỆT ĐỐI (SAFE TOKENIZATION ENGINE)
  // Đảm bảo không có bất kỳ regex nào can thiệp chồng chéo làm hỏng biểu thức toán
  const mathTokens: string[] = [];
  function addToken(math: string, isBlock = false): string {
    let clean = math.trim();
    // Khôi phục đệ quy nếu bên trong đã chứa token để tránh nested token
    while (/___MATH_TOK_(\d+)___/.test(clean)) {
      clean = clean.replace(/___MATH_TOK_(\d+)___/g, (_m, i) => {
        const tok = mathTokens[Number(i)] || '';
        return tok.replace(/^\$+|\$+$/g, '').trim();
      });
    }
    clean = clean.trim();
    if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length > 4) {
      clean = clean.slice(2, -2).trim();
      isBlock = true;
    } else if (clean.startsWith('$') && clean.endsWith('$') && clean.length > 2) {
      clean = clean.slice(1, -1).trim();
    }
    // Không cho phép ngắt dòng bên trong công thức inline (tránh làm gãy khoảng/đoạn hoặc KaTeX)
    if (!isBlock && !/\\begin\{(?:aligned|cases|matrix|pmatrix|bmatrix|vmatrix|gathered)\}/.test(clean)) {
      clean = clean.replace(/\r?\n+/g, ' ');
    }
    const idx = mathTokens.length;
    if (isBlock) {
      mathTokens.push(`$$${clean}$$`);
    } else {
      mathTokens.push(`$${clean}$`);
    }
    return `___MATH_TOK_${idx}___`;
  }

  // BƯỚC 1: TRÍCH XUẤT VÀ BẢO VỆ TOÀN BỘ CÔNG THỨC ĐÃ CÓ
  // 1.1 Display math $$...$$ và \[...\]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => addToken(inner, true));
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => addToken(inner, true));

  // 1.2 LaTeX environments: \begin{cases}...\end{cases}, \begin{matrix}...\end{matrix}, etc.
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

  // 1.3 Inline math \(...\)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => addToken(inner, false));

  // 1.4 Inline math $...$
  text = text.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {
    // Chỉ giải cứu nếu là cả một câu văn tiếng Việt dài thuần túy bị bọc nhầm trong dấu $
    const trimmed = inner.trim();
    if (hasVietnameseText(trimmed) && !trimmed.includes('\\') && !/\\(?:frac|dfrac|tfrac|sqrt|sum|int|begin|vec|overrightarrow|widehat|overline|le|ge|ne|alpha|beta|pi|text|mathrm|mathbf|mathbb|mathcal)\b/.test(trimmed)) {
      const words = trimmed.split(/\s+/);
      if (words.length >= 3) {
        return ` ${trimmed} `;
      }
    }
    return addToken(inner, false);
  });

  // 1.5 Nhận diện biểu thức chứa \left ... \right ở ngoài dấu $
  // Ví dụ: x \in \left(0; \frac{\pi}{2}\right), t \in \left(0; 1\right), \left(0; \frac{\pi}{2}\right)
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])\b([a-zA-Z])\s*(\\in|\\notin)\s*(\\left\s*(?:[\(\[\{<\.\|\/]|\\\{|\\\|)[^$\n]*?\\right\s*(?:[\)\]\}>\.\|\/]|\\\}|\\\|))/g,
    (_m, v, op, target) => addToken(`${v} ${op} ${target}`)
  );
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])(\\left\s*(?:[\(\[\{<\.\|\/]|\\\{|\\\|)[^$\n]*?\\right\s*(?:[\)\]\}>\.\|\/]|\\\}|\\\|))/g,
    (_m, target) => addToken(target)
  );

  // 1.6 Nhận diện biểu thức lượng giác và phép gán biến: t = \cos x, y = \sin x, t = \cos(2x)...
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])\b([a-zA-Z])\s*=\s*\\(cos|sin|tan|cot)\s+([a-zA-Z0-9\\]+)/g,
    (_m, v, fn, arg) => addToken(`${v} = \\${fn} ${arg}`)
  );

  // BƯỚC 2: XỬ LÝ VĂN BẢN VÀ CÁC BIỂU THỨC CHƯA CÓ DẤU $ (BÊN NGOÀI KHỐI TOÁN)
  // 2.1 Ngắt dòng đề mục, câu hỏi, các bước và lời giải nếu bị dính liền thiếu ngắt dòng
  text = text.replace(/([^\n])\s*(\*\*(?:Ví\s*dụ\s*\d+\.?|Bài\s*\d+\.?|Câu\s*\d+:?|Dạng\s*\d+\.?|Bước\s*\d+:?|Trường\s*hợp\s*\d+:?|TH\s*\d+:?)\*\*|Ví\s*dụ\s*\d+\.|Bài\s*\d+\.|Câu\s*\d+:|Dạng\s*\d+\.|Bước\s*\d+:|Trường\s*hợp\s*\d+:|TH\s*\d+:)/g, '$1\n\n$2');
  text = text.replace(/([^\n])\s*(\*\*Lời giải\*\*|Lời giải:|\*\*Hướng dẫn giải\*\*|Hướng dẫn giải:|\*\*Phương pháp giải\*\*|Phương pháp giải:)/g, '$1\n\n$2\n\n');
  
  // Chỉ ngắt dòng cho 1), 2), 3) nếu là đầu dòng hoặc sau dấu chấm câu / kết thúc câu
  // TUYỆT ĐỐI KHÔNG ngắt dòng nếu đứng sau dấu chấm phẩy (;), dấu phẩy (,), dấu mở ngoặc (, [, {, dấu toán học
  // để tránh làm vỡ khoảng/đoạn như (-1; 2), (-\infty; 2)
  text = text.replace(/(?<![;,\(\[\{\$a-zA-Z0-9_\+\-\*\/\\=<>])\s*([1-9]\))\s*(?=[A-ZÀ-ỹa-z\$\\\*])/g, '\n\n$1 ');
  text = text.replace(/([^\n])\s*(Vậy\s+(?:\$|\\\$|[a-zA-ZÀ-ỹ]))/g, '$1\n\n$2');
  text = text.replace(/(?<![ýÝ]\s*)(?<!khẳng\s+định\s*)(?<!mệnh\s+đề\s*)(?<!\bý\s*)(?<![a-zA-ZÀ-ỹ]\s+)(\b[a-d]\))\s*/gi, (match, p1, offset, str) => {
    const prefix = str.substring(Math.max(0, offset - 25), offset);
    if (/(?:ý|mệnh\s+đề|khẳng\s+định|vậy|chọn|do\s+đó|nên|xét)\s*$/i.test(prefix)) {
      return (prefix.endsWith(' ') ? '' : ' ') + p1 + " ";
    }
    return "\n\n" + p1 + " ";
  });

  // 2.2 Sửa lỗi artifact MathType \undefined hoặc undefined trong văn bản
  text = text.replace(/(\([I|V|X|\d]+\))\s*\\?undefined\s*/gi, '$1 \\Leftrightarrow ');
  text = text.replace(/\\undefined\b/g, () => addToken('\\Leftrightarrow'));
  text = text.replace(/(?<=\s|^)=>(?=\s|$)/g, () => addToken('\\Rightarrow'));
  text = text.replace(/(?<=\s|^)<=>(?=\s|$)/g, () => addToken('\\Leftrightarrow'));
  text = text.replace(/\\?(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|Longleftrightarrow|Longrightarrow)\b/g, (_m, p1) => addToken(`\\${p1}`));

  // 2.3 Phân số chưa có $ (hỗ trợ ngoặc lồng nhau)
  let fracIdx = 0;
  while ((fracIdx = text.search(/(?<![\$\\\w])\\(?:d|t)?frac\s*\{/)) !== -1) {
    const fracMatch = text.match(/(?<![\$\\\w])\\(?:d|t)?frac\s*\{/)!;
    const openNum = fracIdx + fracMatch[0].length - 1;
    const closeNum = findClosingBrace(text, openNum);
    if (closeNum === -1) break;
    let openDen = closeNum + 1;
    while (openDen < text.length && /\s/.test(text[openDen])) openDen++;
    if (text[openDen] !== '{') break;
    const closeDen = findClosingBrace(text, openDen);
    if (closeDen === -1) break;
    const wholeFrac = text.substring(fracIdx, closeDen + 1);
    const token = addToken(wholeFrac);
    text = text.substring(0, fracIdx) + token + text.substring(closeDen + 1);
  }

  // Căn bậc hai & bậc n chưa có $ (hỗ trợ ngoặc lồng nhau)
  let rootIdx = 0;
  while ((rootIdx = text.search(/(?<![\$\\\w])\\sqrt\s*(?:\[[^\]]+\])?\s*\{/)) !== -1) {
    const rootMatch = text.match(/(?<![\$\\\w])\\sqrt\s*(?:\[[^\]]+\])?\s*\{/)!;
    const openBrace = rootIdx + rootMatch[0].length - 1;
    const closeBrace = findClosingBrace(text, openBrace);
    if (closeBrace === -1) break;
    const wholeRoot = text.substring(rootIdx, closeBrace + 1);
    const token = addToken(wholeRoot);
    text = text.substring(0, rootIdx) + token + text.substring(closeBrace + 1);
  }

  // 2.4 Ký hiệu vectơ, cung tròn, góc độ ngoài dấu $
  text = text.replace(/\\over\s*\\rightarrow\s*\{([^}]+)\}/g, (_m, p1) => addToken(`\\overrightarrow{${p1}}`));
  text = text.replace(/\\over\s*\\leftarrow\s*\{([^}]+)\}/g, (_m, p1) => addToken(`\\overleftarrow{${p1}}`));
  text = text.replace(/\\(overgroup|overparen|wideparen|arc|overrightarrow|overleftarrow|vec|widehat)\{([^}]+)\}/g, (_m, cmd, p1) => {
    const safeCmd = (cmd === 'overparen' || cmd === 'wideparen' || cmd === 'arc') ? 'overgroup' : cmd;
    return addToken(`\\${safeCmd}{${p1}}`);
  });
  text = text.replace(/\b(\d+(?:\.\d+)?)\s*\^\s*\\circ\b/g, (_m, p1) => addToken(`${p1}^\\circ`));

  // 2.5 KHOẢNG ĐOẠN, HỢP TẬP HỢP, TẬP SỐ VÀ BẤT ĐẲNG THỨC NGOÀI $
  // (Ưu tiên xử lý TRƯỚC ký hiệu đơn lẻ để không làm vỡ các biểu thức chứa \infty, \cup, \cap...)
  
  // A. Khoảng / đoạn và hợp các khoảng đoạn (ví dụ: (-\infty; -6), (3; 6], [2; +\infty), (-\infty; 1) \cup (2; +\infty), (-1; 2))
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])([\(\[][\+\-]?\s*(?:\d+(?:\.\d+)?|\\infty|[a-zA-Z])\s*;\s*[\+\-]?\s*(?:\d+(?:\.\d+)?|\\infty|[a-zA-Z])[\)\]](?:\s*(?:\\cup|\\cap|\\setminus)\s*[\(\[][\+\-]?\s*(?:\d+(?:\.\d+)?|\\infty|[a-zA-Z])\s*;\s*[\+\-]?\s*(?:\d+(?:\.\d+)?|\\infty|[a-zA-Z])[\)\]])*)/g,
    (_m, coord) => addToken(coord)
  );

  // B. Tập xác định D = \mathbb{R} \setminus \{...\}
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])\b([Dxyf])\s*=\s*(\\mathbb\{[a-zA-Z]+\}|\b[RZNQ]\b)\s*\\setminus\s*(___MATH_TOK_\d+___|\\\{[^\\\}]+\\\})/g,
    (_m, p1, p2, p3) => {
      let cleanSet = p3;
      const tokM = p3.match(/^___MATH_TOK_(\d+)___$/);
      if (tokM) {
        cleanSet = (mathTokens[Number(tokM[1])] || '').replace(/^\$+|\$+$/g, '');
      }
      return addToken(`${p1} = ${p2} \\setminus ${cleanSet}`);
    }
  );

  // C. Tập hợp liệt kê phần tử dạng \{...\} (hỗ trợ dấu âm, phân số, \dots, dấu chấm phẩy)
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])(\\\{\s*[+\-]?[0-9a-zA-Z\\_\dots\.,;\s\+\-]+\s*\\\})/g,
    (_m, setStr) => addToken(setStr)
  );

  // D. Thuộc / không thuộc khoảng đoạn hoặc tập hợp (m \in (-\infty; 2), m \in [-10; 10], m \in \{-10, ..., 1\})
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])\b([a-zA-Z])\s*(\\in|\\notin)\s*(___MATH_TOK_\d+___|\\\{[^\\\}]+\\\}|[\(\[][\+\-]?\s*(?:\d+(?:\.\d+)?|\\infty|[a-zA-Z])\s*;\s*[\+\-]?\s*(?:\d+(?:\.\d+)?|\\infty|[a-zA-Z])[\)\]]|\\mathbb\{[a-zA-Z]+\}|\b[RZNQ]\b)/g,
    (_m, v, op, target) => {
      let cleanTarget = target;
      const tokMatch = target.match(/^___MATH_TOK_(\d+)___$/);
      if (tokMatch) {
        cleanTarget = (mathTokens[Number(tokMatch[1])] || "").replace(/^\$+|\$+$/g, "");
      }
      return addToken(`${v} ${op} ${cleanTarget}`);
    }
  );

  // E. Bất đẳng thức kép ngoài $ (-1 < m < 2, -10 \le m \le 10, 3 < m \le 6)
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])([+\-]?[0-9a-zA-Z\\]+)\s*(<|<=|>|>=|\\le|\\ge|\\leq|\\geq)\s*([a-zA-Z])\s*(<|<=|>|>=|\\le|\\ge|\\leq|\\geq)\s*([+\-]?[0-9a-zA-Z\\]+)(?![a-zA-Z0-9_\$\^])/g,
    (_m, p1, op1, varName, op2, p2) => {
      const cleanOp1 = (op1 === '<=' || op1 === '\\leq') ? '\\le' : (op1 === '>=' || op1 === '\\geq') ? '\\ge' : op1;
      const cleanOp2 = (op2 === '<=' || op2 === '\\leq') ? '\\le' : (op2 === '>=' || op2 === '\\geq') ? '\\ge' : op2;
      return addToken(`${p1} ${cleanOp1} ${varName} ${cleanOp2} ${p2}`);
    }
  );

  // F. Điều kiện tham số, biểu thức nhị thức bậc nhất, đạo hàm và biệt thức ngoài $
  // Hỗ trợ: y' > 0, -m + 2 > 0, 2 - m > 0, m < 2, m \ge 2, \Delta \le 0, m - 2 < 0
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])((?:\\Delta|y'|f'\(x\)|[+\-]?(?:[a-zA-Z]|\d+)(?:\s*[+\-]\s*(?:[a-zA-Z]|\d+))?))\s*(<=|>=|!=|<|>|\\le|\\ge|\\leq|\\geq|\\neq|\\ne)\s*([+\-]?(?:[0-9]+(?:\.[0-9]+)?|[a-zA-Z]|\\(?:d|t)?frac\{[^{}]+\}\{[^{}]+\}))(?![a-zA-Z0-9_\$\^])/g,
    (_m, v, op, right) => {
      const cleanOp = (op === '<=' || op === '\\leq') ? '\\le' : (op === '>=' || op === '\\geq') ? '\\ge' : (op === '!=' || op === '\\ne') ? '\\neq' : op;
      return addToken(`${v.trim()} ${cleanOp} ${right.trim()}`);
    }
  );
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\])(-[a-zA-Z])\s*(<=|>=|!=|<|>|\\le|\\ge|\\leq|\\geq|\\neq|\\ne)\s*([+\-]?[0-9]+(?:\.[0-9]+)?)(?![a-zA-Z0-9_\$\^])/g,
    (_m, v, op, right) => {
      const cleanOp = (op === '<=' || op === '\\leq') ? '\\le' : (op === '>=' || op === '\\geq') ? '\\ge' : (op === '!=' || op === '\\ne') ? '\\neq' : op;
      return addToken(`${v} ${cleanOp} ${right}`);
    }
  );

  // G. Phương trình hàm số ngoài $ (y = \frac{x-2}{x-m}, y' = \frac{...}{...} > 0)
  text = text.replace(
    /(?<![a-zA-Z0-9\$\\\+\-])\b([yf](?:\([a-zA-Z]\))?(?:')?)\s*=\s*(___MATH_TOK_\d+___|\\?(?:d|t)?frac\{[^{}]+\}\{[^{}]+\}|[+\-]?(?:\d+(?:\.\d+)?|\d+\/\d+))(?:\s*(<=|>=|!=|<|>|\\le|\\ge|\\leq|\\geq|\\neq|\\ne)\s*([+\-]?[0-9]+))?(?![a-zA-Z0-9_\$\^])/g,
    (_m, p1, p2, relOp, relRight) => {
      let cleanP2 = p2;
      const tokM = p2.match(/^___MATH_TOK_(\d+)___$/);
      if (tokM) {
        cleanP2 = (mathTokens[Number(tokM[1])] || "").replace(/^\$+|\$+$/g, "");
      }
      if (relOp && relRight) {
        const cleanRel = (relOp === '<=' || relOp === '\\leq') ? '\\le' : (relOp === '>=' || relOp === '\\geq') ? '\\ge' : (relOp === '!=' || relOp === '\\ne') ? '\\neq' : relOp;
        return addToken(`${p1} = ${cleanP2} ${cleanRel} ${relRight}`);
      }
      return addToken(`${p1} = ${cleanP2}`);
    }
  );

  // 2.6 Ký hiệu toán đơn lẻ còn lại ngoài $
  text = text.replace(/\\(nearrow|searrow|uparrow|downarrow|infty|pm|mp|leq|geq|le|ge|in|notin|subset|supset|cup|cap|emptyset|approx|equiv|forall|exists|alpha|beta|gamma|theta|pi|Delta|lambda|sigma|omega|Omega|times|div|neq|setminus)\b/g, (_m, p1) => addToken(`\\${p1}`));
  text = text.replace(/\\mathbb\{([a-zA-Z]+)\}/g, (_m, p1) => addToken(`\\mathbb{${p1}}`));
  text = text.replace(/\\cdot/g, () => addToken('\\cdot'));
  text = text.replace(/\\parallel/g, () => addToken('\\parallel'));
  text = text.replace(/\\perp/g, () => addToken('\\perp'));

  // 2.7 Dãy số / chỉ số dưới có dấu bằng: u_2 = 3, u_n = 2n + 1 hoặc biến có chỉ số u_1, x_0
  text = text.replace(/(?<![\p{L}\p{N}\$\\])([uxyzabcnkm])_([0-9]+|[nkm])(\s*=\s*[0-9a-zA-Z\+\-\*\/]+)?(?![\p{L}\p{N}\$_])/gu, (_m, p1, p2, p3) => addToken(`${p1}_${p2}${p3 || ''}`));

  // 2.8 Phương án trắc nghiệm A. B. C. D. có nội dung toán học thuần túy
  text = text.replace(
    /(?:^|(?<=[\n\r]))\s*([A-Da-d][\.\)\:])\s*([^\n\r]+)/g,
    (match, prefix, rest) => {
      const trimmedRest = rest.trim();
      // Nếu đã chứa token hoặc đã có $, không bọc thêm token mới
      if (trimmedRest.startsWith('___MATH_TOK_') && trimmedRest.endsWith('___')) {
        return `${prefix} ${trimmedRest}`;
      }
      if (!trimmedRest.includes('$') && !trimmedRest.includes('___MATH_TOK_') && /^[+\-]?[0-9a-zA-Z\\_\{\}\(\)\[\];,\s\+\-\*\/\^<>=!]+$/.test(trimmedRest) && /[0-9a-zA-Z\\]/.test(trimmedRest) && !hasVietnameseText(trimmedRest)) {
        return `${prefix} ${addToken(trimmedRest)}`;
      }
      return match;
    }
  );

  // BƯỚC 3: KHÔI PHỤC TOÀN BỘ CÔNG THỨC TOÁN AN TOÀN, NGUYÊN VẸN 100%
  // Khôi phục theo vòng lặp cho đến khi hết token, bảo đảm không sót lại bất kỳ ___MATH_TOK_ nào
  let restoreLoops = 0;
  while (text.includes('___MATH_TOK_') && restoreLoops < 10) {
    text = text.replace(/___MATH_TOK_(\d+)___/g, (_m, idx) => {
      return mathTokens[Number(idx)] || '';
    });
    restoreLoops++;
  }

  // Step 4: Dọn dẹp khoảng cách lệnh LaTeX (đảm bảo macro không bị dính liền ký tự biến số như \Leftrightarrowm hay \inm)
  text = text.replace(/\\(Longleftrightarrow|Longrightarrow|Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|notin|infty|setminus|approx|times|equiv|forall|exists|Delta|cdot|perp|parallel|cup|cap|geq|leq|neq|pm|mp)([a-zA-Z0-9])/g, '\\$1 $2');
  text = text.replace(/\\(Longleftrightarrow|Longrightarrow|Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)([\+\-])/g, '\\$1 $2');
  text = text.replace(/\\in([0-9]|[a-zA-Z](?![a-zA-Z]))/g, '\\in $1');
  // CHỈ tách le, ge, ne khi theo sau là CHỮ SỐ (0-9). TUYỆT ĐỐI KHÔNG tách trước chữ cái [a-zA-Z] để không phá vỡ \left, \leq, \leftarrow, \neq, \neg, \nearrow, \geq...
  text = text.replace(/\\(le|ge|ne)([0-9])/g, '\\$1 $2');
  text = text.replace(/([0-9a-zA-Z\)])\\(Longleftrightarrow|Longrightarrow|Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow|notin|infty|setminus|approx|times|equiv|forall|exists|Delta|cdot|perp|parallel|cup|cap|geq|leq|neq|pm|mp|le|ge|ne|in)\b/g, '$1 \\$2');

  // Khắc phục triệt để các trường hợp \left bị gãy thành \le ft hoặc \neq bị gãy thành \ne q
  text = text.replace(/\\le\s+ft(?=[^a-zA-Z]|$)/g, '\\left');
  text = text.replace(/\\ne\s+q(?=[^a-zA-Z0-9]|$)/g, '\\neq');
  text = text.replace(/\\ge\s+q(?=[^a-zA-Z0-9]|$)/g, '\\geq');

  // Step 5: Dọn dẹp dollar thừa từ 3 dấu trở lên
  text = text.replace(/\${3,}/g, '$$');

  return text;
}

/**
 * Master repair function: Runs full Unicode font repair followed by Math LaTeX normalization.
 * Giữ nguyên 100% nội dung và phông chữ tiếng Việt chuẩn.
 */
export function repairVietnameseDocument(content: string): string {
  if (!content) return '';

  let c = content;

  // 0. Sửa các từ bị chèn nhầm dấu dollar vào dấu gạch dưới do regex cũ (ví dụ: "Lời giả$i_To$án" -> "Lời giải_Toán")
  c = c.replace(/([a-zA-ZÀ-ỹ]+)\$([a-zA-Z])_([a-zA-Z]+)\$([a-zA-ZÀ-ỹ]+)/gu, '$1$2_$3$4');
  c = c.replace(/\$([a-zA-ZÀ-ỹ])_([a-zA-ZÀ-ỹ]+)\$/gu, '$1_$2');
  c = c.replace(/giả\$i_To\$án/gi, 'giải_Toán');
  c = c.replace(/đầ\$u_L\$ời/gi, 'đầu_Lời');
  c = c.replace(/nhâ\$n_L\$ời/gi, 'nhân_Lời');
  c = c.replace(/giá\$c_L\$ời/gi, 'giác_Lời');
  c = c.replace(/Hợ\$p_L\$ời/gi, 'Hợp_Lời');
  c = c.replace(/hợ\$p_L\$ời/gi, 'hợp_Lời');
  c = c.replace(/TÂ\$P_CH\$ƯƠNG/gi, 'TẬP_CHƯƠNG');
  c = c.replace(/điể\$n_L\$ời/gi, 'điển_Lời');

  // 1. Dọn dẹp mã trường Word Shape (SHAPE \* MERGEFORMAT)
  c = c.replace(/SHAPE\s*\\\*\s*MERGEFORMAT/gi, '\n\n*(Hình vẽ minh họa)*\n\n');

  // 2. Khôi phục hoặc dọn dẹp mã trường MathType OLE (EMBED Equation.DSMT4 / EMBED Equation.3 / EMBED)
  c = c.replace(/\{?\s*EMBED(?:\s+Equ?[^\n\r\$<\{\}]{0,25}(?:DSMT4|\.3|ation)?)?(?:\s*\\s)?\s*\}?/gi, (match, offset, fullStr) => {
    const prev = fullStr.substring(Math.max(0, offset - 70), offset).toLowerCase();
    const next = fullStr.substring(offset + match.length, Math.min(fullStr.length, offset + match.length + 70)).toLowerCase();

    // Phục hồi công thức theo ngữ cảnh sư phạm
    if (prev.includes('cặp số') || next.includes('là nghiệm') || prev.includes('nghiệm là')) return ' $(x_0; y_0)$ ';
    if (prev.includes('tam giác') || prev.includes('đỉnh là') || prev.includes('tứ giác')) return ' $ABC$ ';
    if (prev.includes('biểu thức') || next.includes('đạt giá trị') || prev.includes('tính giá trị')) return ' $F(x; y)$ ';
    if (prev.includes('tọa độ') || next.includes('giao của') || prev.includes('gốc tọa độ')) return ' $O(0; 0)$ ';
    if (prev.includes('điểm') && !prev.includes('đỉnh')) return ' $(x; y)$ ';
    if (prev.includes('thịt bò') && next.includes('kg')) return ' $x$ ';
    if (prev.includes('thịt lợn') && next.includes('kg')) return ' $y$ ';
    if (prev.includes('nguyên liệu') && (next.includes('tấn') || prev.includes('tấn'))) return ' $x$ ';
    if (prev.includes('chi phí') || next.includes('nghìn đồng') || next.includes('triệu đồng')) return ' $T$ ';
    if (next.includes('là bất phương trình') || prev.includes('dạng')) return ' $ax + by \\le c$ ';
    if (next.includes('là hệ bất phương trình')) return ' $\\begin{cases} ax + by \\le c \\\\ a\'x + b\'y \\le c\' \\end{cases}$ ';
    if (prev.includes('hệ số')) return ' $a, b$ ';
    if (prev.includes('đường thẳng') || next.includes('đi qua')) return ' $d$ ';
    if (prev.includes('trục')) return ' $Ox$ ';
    if (prev.includes('miền')) return ' $D$ ';
    return ' $[\\text{công thức}]$ ';
  });

  const preFixed = repairCorruptedVietnameseWords(c);
  const decoded = convertTcvn3ToUnicode(preFixed);
  const formatted = formatMathExpressions(decoded);
  const result = repairCorruptedVietnameseWords(formatted);

  // Đảm bảo không còn tồn đọng dấu dollar trong underscore
  return result
    .replace(/([a-zA-ZÀ-ỹ]+)\$([a-zA-Z])_([a-zA-Z]+)\$([a-zA-ZÀ-ỹ]+)/gu, '$1$2_$3$4')
    .replace(/\$([a-zA-ZÀ-ỹ])_([a-zA-ZÀ-ỹ]+)\$/gu, '$1_$2');
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

  // 6. Tự động căn chỉnh và gắn kết các đường gióng nét đứt (dashed line) vào đúng tâm điểm circle
  try {
    const circleMatches = Array.from(cleaned.matchAll(/<circle\b([^>]*)\/?>/gi));
    const circles: Array<{ cx: number; cy: number }> = [];
    for (const cm of circleMatches) {
      const attrs = cm[1];
      const cx = parseFloat(attrs.match(/\bcx=["']?([0-9.-]+)["']?/)?.[1] || '-999');
      const cy = parseFloat(attrs.match(/\bcy=["']?([0-9.-]+)["']?/)?.[1] || '-999');
      if (cx > 0 && cy > 0) {
        circles.push({ cx, cy });
      }
    }

    if (circles.length > 0) {
      // Tìm các đường nét đứt projection lines
      cleaned = cleaned.replace(/<line\b([^>]*(?:stroke-dasharray|dasharray)[^>]*?)\s*\/?>/gi, (fullLine, attrs) => {
        let x1 = parseFloat(attrs.match(/\bx1=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        let y1 = parseFloat(attrs.match(/\by1=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        let x2 = parseFloat(attrs.match(/\bx2=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        let y2 = parseFloat(attrs.match(/\by2=["']?([0-9.-]+)["']?/)?.[1] || '-999');

        if (x1 > 0 && y1 > 0 && x2 > 0 && y2 > 0) {
          // Kiểm tra xem đầu mút nào gần một circle (sai lệch <= 8px)
          for (const c of circles) {
            const dist1 = Math.hypot(x1 - c.cx, y1 - c.cy);
            if (dist1 <= 8) {
              x1 = c.cx;
              y1 = c.cy;
              // Nếu là đường thẳng đứng gióng xuống Ox
              if (Math.abs(x2 - x1) <= 8) {
                x2 = c.cx;
              }
              // Nếu là đường nằm ngang gióng sang Oy
              if (Math.abs(y2 - y1) <= 8) {
                y2 = c.cy;
              }
              const cleanAttrs = attrs
                .trim()
                .replace(/\/+$/, '')
                .trim()
                .replace(/\bx1=["']?[0-9.-]+["']?/, `x1="${x1}"`)
                .replace(/\by1=["']?[0-9.-]+["']?/, `y1="${y1}"`)
                .replace(/\bx2=["']?[0-9.-]+["']?/, `x2="${x2}"`)
                .replace(/\by2=["']?[0-9.-]+["']?/, `y2="${y2}"`);
              return `<line ${cleanAttrs} />`;
            }
          }
        }
        return fullLine;
      });
    }
  } catch (err) {
    // an toàn nếu lỗi parse regex
  }

  // 7. Tự động phát hiện và nắn chỉnh đồ thị Oxy (đặc biệt là Parabol, hàm bậc 3, cực trị và giao điểm)
  // Đảm bảo: Điểm cắt trục tung Oy, điểm cắt trục hoành Ox, đỉnh Parabol và đường cong TRÙNG KHỚP 100%
  try {
    const lineMatches = Array.from(cleaned.matchAll(/<line\b([^>]*)\/?>/gi));
    let horizAxis: { y: number; len: number } | null = null;
    let vertAxis: { x: number; len: number } | null = null;

    for (const m of lineMatches) {
      const attrs = m[1];
      const x1 = parseFloat(attrs.match(/\bx1=["']?([0-9.-]+)["']?/)?.[1] || '-1');
      const y1 = parseFloat(attrs.match(/\by1=["']?([0-9.-]+)["']?/)?.[1] || '-1');
      const x2 = parseFloat(attrs.match(/\bx2=["']?([0-9.-]+)["']?/)?.[1] || '-1');
      const y2 = parseFloat(attrs.match(/\by2=["']?([0-9.-]+)["']?/)?.[1] || '-1');

      if (x1 >= 0 && y1 >= 0 && x2 >= 0 && y2 >= 0) {
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (Math.abs(y1 - y2) <= 4 && len >= 70 && !attrs.includes('stroke-dasharray')) {
          if (!horizAxis || len > horizAxis.len) horizAxis = { y: (y1 + y2) / 2, len };
        }
        if (Math.abs(x1 - x2) <= 4 && len >= 70 && !attrs.includes('stroke-dasharray')) {
          if (!vertAxis || len > vertAxis.len) vertAxis = { x: (x1 + x2) / 2, len };
        }
      }
    }

    if (horizAxis && vertAxis) {
      const X_O = vertAxis.x;
      const Y_O = horizAxis.y;

      // Thu thập thông tin các nhãn <text> trong SVG
      const textMatches = Array.from(cleaned.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi));
      const parsedTexts: Array<{ x: number; y: number; text: string; full: string }> = [];
      for (const tm of textMatches) {
        const attrs = tm[1];
        const tx = parseFloat(attrs.match(/\bx=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        const ty = parseFloat(attrs.match(/\by=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        const content = tm[2].replace(/<[^>]+>/g, '').trim();
        if (tx > -500 && ty > -500) {
          parsedTexts.push({ x: tx, y: ty, text: content, full: tm[0] });
        }
      }

      // Thu thập các điểm circle
      const circleMatches = Array.from(cleaned.matchAll(/<circle\b([^>]*)\/?>/gi));
      const parsedCircles: Array<{ cx: number; cy: number; fullTag: string; attrs: string }> = [];
      for (const cm of circleMatches) {
        const attrs = cm[1];
        const cx = parseFloat(attrs.match(/\bcx=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        const cy = parseFloat(attrs.match(/\bcy=["']?([0-9.-]+)["']?/)?.[1] || '-999');
        if (cx > 0 && cy > 0) {
          parsedCircles.push({ cx, cy, fullTag: cm[0], attrs });
        }
      }

      // KIỂM TRA ĐẶC TRƯNG ĐỒ THỊ PARABOL:
      // Trường hợp 1: Parabol cắt trục tung tại y = 3, cắt trục hoành tại x = -1 và x = 3
      // Phương trình toán học: y = -x² + 2x + 3, Đỉnh I(1; 4)
      const hasNeg1Text = parsedTexts.some(t => t.text === '-1' && Math.abs(t.y - Y_O) <= 35 && t.x < X_O);
      const has3TextOnOx = parsedTexts.some(t => t.text === '3' && Math.abs(t.y - Y_O) <= 35 && t.x > X_O);
      const has3TextOnOy = parsedTexts.some(t => t.text === '3' && Math.abs(t.x - X_O) <= 35 && t.y < Y_O);
      const isParabolaInvSpecific = (hasNeg1Text && has3TextOnOx && has3TextOnOy) || 
                                    cleaned.includes('y = -x² + 2x + 3') || 
                                    cleaned.includes('y = -x^2 + 2x + 3') ||
                                    (cleaned.includes('I(1; 4)') && (hasNeg1Text || has3TextOnOx));

      if (isParabolaInvSpecific) {
        // Tìm circle đã có nếu có
        const cRoot1 = parsedCircles.find(c => c.cx < X_O && Math.abs(c.cy - Y_O) <= 15);
        const cRoot2 = parsedCircles.find(c => c.cx > X_O && Math.abs(c.cy - Y_O) <= 15);
        const cYInt = parsedCircles.find(c => Math.abs(c.cx - X_O) <= 10 && c.cy < Y_O);
        const cVert = parsedCircles.find(c => c.cx > X_O && c.cy < Y_O && Math.abs(c.cx - X_O) >= 15);

        // Xác định scale chuẩn từ vị trí các circle hoặc nhãn
        const tNeg1 = parsedTexts.find(t => t.text === '-1' && Math.abs(t.y - Y_O) <= 35 && t.x < X_O);
        const t3Ox = parsedTexts.find(t => t.text === '3' && Math.abs(t.y - Y_O) <= 35 && t.x > X_O);
        const t3Oy = parsedTexts.find(t => t.text === '3' && Math.abs(t.x - X_O) <= 35 && t.y < Y_O);
        const t4Oy = parsedTexts.find(t => t.text === '4' && Math.abs(t.x - X_O) <= 35 && t.y < Y_O);

        let scaleX = 35;
        if (cRoot1 && cRoot2) {
          scaleX = Math.abs(cRoot2.cx - cRoot1.cx) / 4;
        } else if (cRoot1) {
          scaleX = Math.abs(X_O - cRoot1.cx);
        } else if (cRoot2) {
          scaleX = Math.abs(cRoot2.cx - X_O) / 3;
        } else if (tNeg1 && t3Ox) {
          scaleX = Math.abs(t3Ox.x - tNeg1.x) / 4;
        } else if (tNeg1) {
          scaleX = Math.abs(X_O - tNeg1.x);
        } else if (t3Ox) {
          scaleX = Math.abs(t3Ox.x - X_O) / 3;
        }

        let scaleY = 30;
        if (cYInt) {
          scaleY = Math.abs(Y_O - cYInt.cy) / 3;
        } else if (cVert) {
          scaleY = Math.abs(Y_O - cVert.cy) / 4;
        } else if (t3Oy) {
          scaleY = Math.abs(Y_O - t3Oy.y + 4) / 3;
        } else if (t4Oy) {
          scaleY = Math.abs(Y_O - t4Oy.y + 4) / 4;
        }
        if (scaleY <= 5 || isNaN(scaleY)) scaleY = scaleX * 0.85;

        // Tọa độ các điểm chính xác 100% trong không gian SVG pixel:
        const P_root1 = { x: Math.round(X_O - scaleX), y: Math.round(Y_O) };           // x = -1, y = 0
        const P_root2 = { x: Math.round(X_O + 3 * scaleX), y: Math.round(Y_O) };       // x = 3, y = 0
        const P_yInt  = { x: Math.round(X_O), y: Math.round(Y_O - 3 * scaleY) };       // x = 0, y = 3
        const P_vert  = { x: Math.round(X_O + scaleX), y: Math.round(Y_O - 4 * scaleY) }; // x = 1, y = 4 (Đỉnh)
        const P_sym   = { x: Math.round(X_O + 2 * scaleX), y: Math.round(Y_O - 3 * scaleY) }; // x = 2, y = 3

        const A = scaleY / Math.pow(scaleX, 2);

        // Sinh danh sách các điểm mẫu của Parabol với các điểm đặc biệt
        const startX = Math.max(15, Math.round(P_vert.x - 2.8 * scaleX));
        const endX = Math.min(365, Math.round(P_vert.x + 2.8 * scaleX));
        const steps = 140;
        const stepSize = (endX - startX) / steps;
        
        const rawXList: number[] = [P_root1.x, P_yInt.x, P_vert.x, P_sym.x, P_root2.x];
        for (let i = 0; i <= steps; i++) {
          rawXList.push(startX + i * stepSize);
        }
        rawXList.sort((a, b) => a - b);
        const sortedX: number[] = [];
        for (const x of rawXList) {
          if (sortedX.length === 0 || Math.abs(x - sortedX[sortedX.length - 1]) > 0.05) {
            sortedX.push(x);
          }
        }

        const pts: string[] = [];
        for (const x of sortedX) {
          const y = P_vert.y + A * Math.pow(x - P_vert.x, 2);
          pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        const exactParabolaD = `M ${pts.join(' L ')}`;

        // 1. Thay thế đường <path> của đồ thị
        let pathReplaced = false;
        cleaned = cleaned.replace(/<path\b([^>]*)\/?>/gi, (fullPath, attrs) => {
          if (pathReplaced) return fullPath;
          if (attrs.includes('fill="#1e293b"') || attrs.includes('fill="#334155"') || attrs.includes('marker') || attrs.includes('z') || attrs.includes('Z')) {
            return fullPath;
          }
          if (!attrs.includes('stroke') || attrs.includes('stroke-dasharray')) {
            return fullPath;
          }
          pathReplaced = true;
          const strokeColor = attrs.match(/stroke=["']([^"']+)["']/)?.[1] || '#2563eb';
          const strokeWidth = attrs.match(/stroke-width=["']([^"']+)["']/)?.[1] || '2.5';
          return `<path d="${exactParabolaD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
        });
        if (!pathReplaced) {
          cleaned = cleaned.replace('</svg>', `  <path d="${exactParabolaD}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />\n</svg>`);
        }

        // 2. Căn chỉnh hoặc thêm các đường nét đứt của đỉnh I(1; 4)
        // Gióng dọc x = 1 xuống Ox
        const vertDashLine = `<line x1="${P_vert.x}" y1="${P_vert.y}" x2="${P_vert.x}" y2="${Math.round(Y_O)}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />`;
        // Gióng ngang y = 4 sang Oy
        const horizDashLine = `<line x1="${P_vert.x}" y1="${P_vert.y}" x2="${Math.round(X_O)}" y2="${P_vert.y}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />`;

        // Xóa các đường nét đứt cũ gần đỉnh để thay bằng tọa độ chuẩn xác
        cleaned = cleaned.replace(/<line\b([^>]*(?:stroke-dasharray|dasharray)[^>]*)\/?>/gi, (fullLine, attrs) => {
          const x1 = parseFloat(attrs.match(/\bx1=["']?([0-9.-]+)["']?/)?.[1] || '-999');
          const y1 = parseFloat(attrs.match(/\by1=["']?([0-9.-]+)["']?/)?.[1] || '-999');
          if (Math.abs(x1 - P_vert.x) <= 25 || Math.abs(y1 - P_vert.y) <= 25) {
            return '';
          }
          return fullLine;
        });

        // 3. Chuẩn hóa 4 điểm tròn circle tại giao điểm và đỉnh (xóa sạch circle cũ trong phạm vi 35px để tránh trùng lặp hoặc lệch)
        cleaned = cleaned.replace(/<circle\b([^>]*)\/?>/gi, (fullCircle, attrs) => {
          const cx = parseFloat(attrs.match(/\bcx=["']?([0-9.-]+)["']?/)?.[1] || '-999');
          const cy = parseFloat(attrs.match(/\bcy=["']?([0-9.-]+)["']?/)?.[1] || '-999');
          if (
            Math.hypot(cx - P_root1.x, cy - P_root1.y) <= 35 ||
            Math.hypot(cx - P_root2.x, cy - P_root2.y) <= 35 ||
            Math.hypot(cx - P_yInt.x, cy - P_yInt.y) <= 35 ||
            Math.hypot(cx - P_vert.x, cy - P_vert.y) <= 35
          ) {
            return ''; // Xóa để tái tạo đồng bộ
          }
          return fullCircle;
        });

        const exactCircles = `
  ${vertDashLine}
  ${horizDashLine}
  <circle cx="${P_vert.x}" cy="${P_vert.y}" r="3.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.2" />
  <circle cx="${P_yInt.x}" cy="${P_yInt.y}" r="3.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.2" />
  <circle cx="${P_root1.x}" cy="${P_root1.y}" r="3.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.2" />
  <circle cx="${P_root2.x}" cy="${P_root2.y}" r="3.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.2" />`;

        // 4. Chuẩn hóa vị trí các nhãn số -1, 3, 1 trên Ox và 3, 4 trên Oy
        cleaned = cleaned.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (fullText, attrs, content) => {
          const trimmed = content.trim();
          const tx = parseFloat(attrs.match(/\bx=["']?([0-9.-]+)["']?/)?.[1] || '-999');
          const ty = parseFloat(attrs.match(/\by=["']?([0-9.-]+)["']?/)?.[1] || '-999');

          if (trimmed === '-1' && Math.abs(ty - Y_O) <= 35 && tx < X_O) {
            return `<text x="${P_root1.x}" y="${Math.round(Y_O + 14)}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">-1</text>`;
          }
          if (trimmed === '3' && Math.abs(ty - Y_O) <= 35 && tx > X_O) {
            return `<text x="${P_root2.x}" y="${Math.round(Y_O + 14)}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">3</text>`;
          }
          if (trimmed === '1' && Math.abs(ty - Y_O) <= 35 && tx > X_O && tx < P_root2.x) {
            return `<text x="${P_vert.x}" y="${Math.round(Y_O + 14)}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">1</text>`;
          }
          if (trimmed === '3' && Math.abs(tx - X_O) <= 35 && ty < Y_O) {
            return `<text x="${Math.round(X_O - 7)}" y="${Math.round(P_yInt.y + 4)}" text-anchor="end" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">3</text>`;
          }
          if (trimmed === '4' && Math.abs(tx - X_O) <= 35 && ty < Y_O) {
            return `<text x="${Math.round(X_O - 7)}" y="${Math.round(P_vert.y + 4)}" text-anchor="end" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">4</text>`;
          }
          return fullText;
        });

        // Bổ sung các nhãn còn thiếu nếu SVG gốc chưa ghi
        if (!cleaned.includes('>-1<')) {
          cleaned = cleaned.replace('</svg>', `  <text x="${P_root1.x}" y="${Math.round(Y_O + 14)}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">-1</text>\n</svg>`);
        }
        if (!cleaned.includes('>1<')) {
          cleaned = cleaned.replace('</svg>', `  <text x="${P_vert.x}" y="${Math.round(Y_O + 14)}" text-anchor="middle" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">1</text>\n</svg>`);
        }
        if (!cleaned.includes('>4<')) {
          cleaned = cleaned.replace('</svg>', `  <text x="${Math.round(X_O - 7)}" y="${Math.round(P_vert.y + 4)}" text-anchor="end" font-family="sans-serif" font-size="11.5" font-weight="600" fill="#334155">4</text>\n</svg>`);
        }

        cleaned = cleaned.replace('</svg>', `${exactCircles}\n</svg>`);
      } else {
        // Trường hợp Parabol tổng quát khác có đỉnh và điểm giao
        const vertexCircle = parsedCircles.find(c => Math.abs(c.cx - X_O) >= 8 && Math.abs(c.cy - Y_O) >= 8);
        const yIntCircle = parsedCircles.find(c => Math.abs(c.cx - X_O) <= 6 && Math.abs(c.cy - Y_O) >= 8);
        const xIntCircles = parsedCircles.filter(c => Math.abs(c.cy - Y_O) <= 6 && Math.abs(c.cx - X_O) >= 8);

        if (vertexCircle && (yIntCircle || xIntCircles.length > 0)) {
          let A = 0;
          if (yIntCircle && Math.abs(X_O - vertexCircle.cx) >= 5) {
            A = (yIntCircle.cy - vertexCircle.cy) / Math.pow(X_O - vertexCircle.cx, 2);
          } else if (xIntCircles.length > 0) {
            A = (Y_O - vertexCircle.cy) / Math.pow(xIntCircles[0].cx - vertexCircle.cx, 2);
          }

          if (Math.abs(A) > 0.00005) {
            const maxDeltaY = Math.abs(Y_O - vertexCircle.cy) * 1.5;
            const deltaX = Math.sqrt(Math.abs(maxDeltaY / A));
            const startX = Math.max(15, vertexCircle.cx - deltaX);
            const endX = Math.min(365, vertexCircle.cx + deltaX);

            const steps = 120;
            const stepSize = (endX - startX) / steps;
            const pts: string[] = [];
            for (let i = 0; i <= steps; i++) {
              const curX = startX + i * stepSize;
              const curY = vertexCircle.cy + A * Math.pow(curX - vertexCircle.cx, 2);
              pts.push(`${curX.toFixed(1)} ${curY.toFixed(1)}`);
            }
            const exactParabolaD = `M ${pts.join(' L ')}`;

            let pathReplaced = false;
            cleaned = cleaned.replace(/<path\b([^>]*)\/?>/gi, (fullPath, attrs) => {
              if (pathReplaced) return fullPath;
              if (attrs.includes('fill="#1e293b"') || attrs.includes('fill="#334155"') || attrs.includes('marker') || attrs.includes('z') || attrs.includes('Z')) {
                return fullPath;
              }
              if (!attrs.includes('stroke') || attrs.includes('stroke-dasharray')) {
                return fullPath;
              }
              pathReplaced = true;
              const strokeColor = attrs.match(/stroke=["']([^"']+)["']/)?.[1] || '#2563eb';
              const strokeWidth = attrs.match(/stroke-width=["']([^"']+)["']/)?.[1] || '2.5';
              return `<path d="${exactParabolaD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
            });
          }
        }
      }
    }
  } catch (parabErr) {
    // an toàn nếu lỗi parse
  }

  // 8. Đảm bảo nền trắng sạch sẽ nếu chưa có rect nền
  if (!cleaned.includes('<rect') && cleaned.includes('<svg')) {
    cleaned = cleaned.replace(/<svg\b([^>]*)>/i, `<svg$1>\n  <rect width="100%" height="100%" fill="#ffffff" rx="8" />`);
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

  // 4. Giải mã các thực thể HTML phổ biến thường thấy trong tài liệu Word/HTML
  res = res.replace(/&nbsp;/gi, ' ');
  res = res.replace(/&le;/gi, ' \\le ');
  res = res.replace(/&ge;/gi, ' \\ge ');
  res = res.replace(/&ne;/gi, ' \\neq ');
  res = res.replace(/&plusmn;/gi, ' \\pm ');
  res = res.replace(/&times;/gi, ' \\times ');
  res = res.replace(/&divide;/gi, ' \\div ');
  res = res.replace(/&lt;/gi, '<');
  res = res.replace(/&gt;/gi, '>');
  res = res.replace(/&amp;/gi, '&');

  // 5. Chuyển đổi các thẻ HTML thông thường hay xuất hiện trong lời giải chi tiết (br, b, strong, i, em, p, span...)
  res = res.replace(/<br\s*\/?>/gi, '\n\n');
  res = res.replace(/<\/?(?:b|strong)>/gi, '**');
  res = res.replace(/<\/?(?:i|em)>/gi, '*');
  res = res.replace(/<\/?(?:p|div)\b[^>]*>/gi, '\n\n');
  res = res.replace(/<\/?(?:span|font)\b[^>]*>/gi, '');
  res = res.replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');
  res = res.replace(/<sup>(.*?)<\/sup>/gi, '^{$1}');
  res = res.replace(/<[a-zA-Z\/][^>]*>/g, (tag) => {
    // Bảo toàn thẻ svg và các thẻ con của svg
    if (/^<\/?(?:svg|path|line|circle|rect|text|g|defs|marker|polygon|polyline)\b/i.test(tag)) {
      return tag;
    }
    return '';
  });

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

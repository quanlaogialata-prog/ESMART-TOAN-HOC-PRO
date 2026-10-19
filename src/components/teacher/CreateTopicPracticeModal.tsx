import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Clipboard, 
  FileText, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Loader2, 
  Calendar,
  ListOrdered
} from 'lucide-react';
import { TopicPractice } from '../../types/practice';
import { QuestionItem, QuestionType } from '../../types/test';
import { CURRICULUM_TOPICS_BY_GRADE } from '../../data/curriculumTopics';
import { getCurrentSchoolYear, getStandardSchoolYears } from '../../utils/schoolYear';
import { autoReconcileQuestion, stripOptionPrefix } from '../../utils/gradeEngine';
import { repairVietnameseDocument, convertTcvn3ToUnicode } from '../../lib/vietnameseFont';
import { 
  sortQuestionsStandard, 
  normalizePhieuText, 
  splitMcqOptions, 
  healQuestionOptions,
  stripQuestionPrefix,
  formatPracticeQuestionsAndSections,
  isPureSectionHeader,
  extractTheoryAndQuestionsText,
  isTheoryQuestion
} from '../../utils/practiceFormatter';
import MathText from '../MathText';

interface CreateTopicPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (practice: Omit<TopicPractice, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  initialGrade?: number;
}

export const SAMPLE_PRACTICE_LESSONS: Record<number, { title: string; topic: string; text: string }> = {
  12: {
    title: 'Cực trị của hàm số và ứng dụng thực tế',
    topic: 'Ứng dụng đạo hàm để khảo sát hàm số',
    text: `BÀI HỌC: CỰC TRỊ CỦA HÀM SỐ VÀ ỨNG DỤNG
Chuyên đề: Ứng dụng đạo hàm để khảo sát hàm số - Toán 12

I. TÓM TẮT KIẾN THỨC TRỌNG TÂM & PHƯƠNG PHÁP GIẢI
1. Định nghĩa cực trị:
- Cho hàm số y = f(x) xác định trên khoảng (a; b) và x0 thuộc (a; b).
- Nếu tồn tại h > 0 sao cho f(x) < f(x0) với mọi x thuộc (x0 - h; x0 + h) \\ {x0} thì x0 là điểm cực đại của hàm số.
- Nếu tồn tại h > 0 sao cho f(x) > f(x0) với mọi x thuộc (x0 - h; x0 + h) \\ {x0} thì x0 là điểm cực tiểu của hàm số.
2. Dấu hiệu cực trị (Dấu hiệu 1):
- Nếu f'(x) đổi dấu từ dương sang âm khi x qua x0 (từ trái sang phải) thì x0 là điểm cực đại.
- Nếu f'(x) đổi dấu từ âm sang dương khi x qua x0 (từ trái sang phải) thì x0 là điểm cực tiểu.

II. HỆ THỐNG CÂU HỎI VÀ BÀI TẬP ÔN LUYỆN

PHẦN I. CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (Mỗi câu chỉ chọn một phương án)
Câu 1: Cho hàm số y = f(x) có bảng biến thiên với đạo hàm đổi dấu từ dương sang âm tại x = 1 và từ âm sang dương tại x = 3. Điểm cực đại của hàm số đã cho là:
A. x = 1
B. x = 3
C. y = 1
D. x = -1
Đáp án: A
Lời giải: Theo dấu hiệu 1, đạo hàm f'(x) đổi dấu từ dương sang âm khi đi qua x = 1 nên x = 1 là điểm cực đại của hàm số.

Câu 2: Tìm tất cả giá trị thực của tham số m để hàm số y = x^3 - 3mx^2 + 3(m^2 - 1)x + 2 đạt cực tiểu tại x = 2:
A. m = 1
B. m = 3
C. m = -1
D. m = 2
Đáp án: B
Lời giải: Ta có y' = 3x^2 - 6mx + 3(m^2 - 1). Để hàm số đạt cực trị tại x = 2 thì y'(2) = 0 <=> 12 - 12m + 3m^2 - 3 = 0 <=> 3m^2 - 12m + 9 = 0 <=> m = 1 hoặc m = 3. Kiểm tra lại đạo hàm cấp hai y''(2) > 0 chỉ thỏa mãn với m = 3.

PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI (Mỗi ý chọn Đúng hoặc Sai)
Câu 3: Cho hàm số y = f(x) = x^4 - 2x^2 + 3. Xét tính đúng sai của các khẳng định sau:
a) Hàm số đã cho có đúng 3 điểm cực trị.
b) Điểm cực đại của đồ thị hàm số là (0; 3).
c) Giá trị cực tiểu của hàm số bằng 1.
d) Khoảng cách giữa hai điểm cực tiểu của đồ thị hàm số bằng 2.
Đáp án: a-Đ, b-Đ, c-S, d-Đ
Lời giải: Ta có y' = 4x^3 - 4x = 4x(x^2 - 1). y' = 0 <=> x = 0 hoặc x = 1 hoặc x = -1. Đồ thị có cực đại tại (0; 3) và 2 cực tiểu tại (-1; 2), (1; 2). Do đó giá trị cực tiểu bằng 2 (c sai). Khoảng cách giữa 2 cực tiểu là sqrt((1 - (-1))^2 + (2-2)^2) = 2 (d đúng).

PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN
Câu 4: Cho hàm số y = x^3 - 3x + 1. Tính tổng giá trị cực đại và giá trị cực tiểu của hàm số.
Đáp án: 2
Lời giải: y' = 3x^2 - 3 = 0 <=> x = 1 hoặc x = -1. y_CD = y(-1) = 3; y_CT = y(1) = -1. Tổng y_CD + y_CT = 3 + (-1) = 2.`
  },
  8: {
    title: 'Đa thức nhiều biến và Hằng đẳng thức',
    topic: 'Chương 1: Đa thức nhiều biến',
    text: `BÀI HỌC: ĐA THỨC NHIỀU BIẾN VÀ CÁC PHÉP TOÁN
Chuyên đề: Đại số và Một số yếu tố giải tích - Toán lớp 8

I. TÓM TẮT KIẾN THỨC TRỌNG TÂM & PHƯƠNG PHÁP GIẢI
1. Đơn thức nhiều biến: là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.
2. Đa thức nhiều biến: là một tổng của những đơn thức. Mỗi đơn thức trong tổng gọi là một hạng tử của đa thức đó.
3. Hằng đẳng thức đáng nhớ:
- $(a + b)^2 = a^2 + 2ab + b^2$
- $(a - b)^2 = a^2 - 2ab + b^2$
- $a^2 - b^2 = (a - b)(a + b)$

II. HỆ THỐNG CÂU HỎI VÀ BÀI TẬP ÔN LUYỆN

PHẦN I. CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (Thí sinh chọn 1 phương án đúng A, B, C hoặc D)
Câu 1: Biểu thức nào sau đây là đơn thức nhiều biến?
A. $2x^2y$
B. $x + 2y$
C. $\\frac{x}{y}$
D. $3x^2 - 1$
Đáp án: A
Lời giải: $2x^2y$ là tích giữa số 2 và các biến x, y nên là đơn thức nhiều biến.

Câu 2: Bậc của đa thức $P = x^4y + 2x^2y^2 - 3x^3 + 5$ là:
A. 4
B. 5
C. 3
D. 2
Đáp án: B
Lời giải: Hạng tử $x^4y$ có bậc là $4 + 1 = 5$ (cao nhất), do đó bậc của đa thức P là 5.

Câu 3: Khai triển hằng đẳng thức $(x + 2y)^2$ được kết quả là:
A. $x^2 + 4y^2$
B. $x^2 + 4xy + 4y^2$
C. $x^2 + 2xy + 4y^2$
D. $x^2 - 4xy + 4y^2$
Đáp án: B
Lời giải: Áp dụng $(a+b)^2 = a^2 + 2ab + b^2$ với $a = x, b = 2y$, ta có $(x+2y)^2 = x^2 + 4xy + 4y^2$.

PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI (Trong mỗi ý a, b, c, d, chọn Đúng hoặc Sai)
Câu 4: Cho hai đa thức $M = 2x^2 - xy + 3y^2$ và $N = x^2 + 2xy - y^2$.
a) Đa thức M có bậc bằng 2.
b) Giá trị của đa thức N tại $x = 1, y = -1$ bằng 0.
c) Tổng $M + N = 3x^2 + xy + 2y^2$.
d) Hiệu $M - N = x^2 - 3xy + 4y^2$.
Đáp án: a-Đ, b-S, c-Đ, d-Đ
Lời giải: a) Đúng. b) Sai vì N(1, -1) = -2. c) Đúng. d) Đúng.

PHẦN III. BÀI TẬP TỰ LUẬN (Trình bày lời giải chi tiết)
Câu 5: (2.0 điểm) Cho biểu thức $B = (x - 3)(x + 3) - (x - 2)^2$.
a) Rút gọn biểu thức B.
b) Tính giá trị của biểu thức B tại $x = 5$.
Đáp án: B = 4x - 13; B(5) = 7
Lời giải:
a) Ta có: $B = (x^2 - 9) - (x^2 - 4x + 4) = 4x - 13$.
b) Với $x = 5$, ta có $B = 4(5) - 13 = 7$.`
  }
};

export const SAMPLE_PRACTICE_LESSON_PASTE = SAMPLE_PRACTICE_LESSONS[8].text;

export default function CreateTopicPracticeModal({
  isOpen,
  onClose,
  onSave,
  initialGrade = 8
}: CreateTopicPracticeModalProps) {
  const [grade, setGrade] = useState<number>(initialGrade);
  const [lessonTitle, setLessonTitle] = useState<string>('Đa thức nhiều biến và Hằng đẳng thức');
  const [topicName, setTopicName] = useState<string>('Chương 1: Đa thức nhiều biến');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [schoolYear, setSchoolYear] = useState<string>(getCurrentSchoolYear());
  const [rawPastedText, setRawPastedText] = useState<string>('');
  
  // Converted state
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionError, setConversionError] = useState<string>('');
  const [isConverted, setIsConverted] = useState<boolean>(false);
  const [theorySummary, setTheorySummary] = useState<string>('');
  const [convertedQuestions, setConvertedQuestions] = useState<QuestionItem[]>([]);
  const [activeStep, setActiveStep] = useState<'paste' | 'preview'>('paste');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Curriculum topics for current grade
  const curriculumTopics = CURRICULUM_TOPICS_BY_GRADE[grade] || [];

  useEffect(() => {
    if (curriculumTopics.length > 0 && !topicName) {
      setTopicName(curriculumTopics[0].title);
    }
  }, [grade]);

  // Tên bài học là tiêu đề chính của phiếu in (bỏ tiêu đề phiếu ôn luyện chuyên đề và tên chuyên đề)
  const cleanLesson = normalizePhieuText(lessonTitle.trim() || 'Bài học môn Toán');
  const computedTitle = cleanLesson;

  // Copy from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawPastedText(text);
      }
    } catch (err) {
      alert('Trình duyệt chặn đọc Clipboard tự động. Vui lòng bấm Ctrl + V để dán.');
    }
  };

  // Convert pasted text into exam paper layout
  const handleConvertToExam = async () => {
    if (!rawPastedText || rawPastedText.trim().length < 20) {
      setConversionError('Vui lòng dán nội dung bài học hoặc bài tập (tối thiểu 20 ký tự) để chuyển đổi sang đề kiểm tra.');
      return;
    }

    setIsConverting(true);
    setConversionError('');

    try {
      // 1. Tự động bóc tách phần Tóm tắt lý thuyết độc lập (nếu có) ra khỏi văn bản đề bài
      // TUYỆT ĐỐI KHÔNG tách nhầm tóm tắt lý thuyết thành câu hỏi bài tập
      const { theory: extractedTheory, questionsText: textForQuestions } = extractTheoryAndQuestionsText(rawPastedText);
      if (extractedTheory) {
        setTheorySummary(extractedTheory);
      }

      // 2. Thử gọi API backend thông minh
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      let parsedQuestions: QuestionItem[] = [];

      try {
        const res = await fetch('/api/extract-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
          },
          body: JSON.stringify({
            extractedText: repairVietnameseDocument(convertTcvn3ToUnicode(textForQuestions || rawPastedText)),
            fileName: 'bai_on_luyen_chuyen_de.txt'
          })
        });

        if (res.ok) {
          const resJson = await res.json();
          const rawQ = Array.isArray(resJson) ? resJson : (resJson.questions || []);
          if (rawQ.length > 0) {
            parsedQuestions = rawQ.map((q: any) => autoReconcileQuestion(q).question);
          }
        }
      } catch (apiErr) {
        console.warn('API extract questions failed, falling back to client parser:', apiErr);
      }

      // 3. Fallback & đối chiếu với Client-Side Parser
      const localParsed = parseQuestionsLocally(textForQuestions || rawPastedText);
      
      // Nếu API trả về ít câu hơn parser cục bộ (bị sót câu) hoặc API lỗi: Dùng parser cục bộ để đảm bảo 100% không thiếu
      if (parsedQuestions.length === 0 || (localParsed.length > parsedQuestions.length && localParsed.length > 0)) {
        parsedQuestions = localParsed;
      }

      if (parsedQuestions.length === 0) {
        throw new Error('Chưa nhận diện được câu hỏi nào từ văn bản đã dán. Vui lòng kiểm tra lại nội dung bài ôn tập.');
      }

      // Tự động nhận diện tên bài học từ dòng đầu tiên nếu chưa nhập
      const firstLine = rawPastedText.split('\n')[0].replace(/^[\s#*=-]+/, '').trim();
      if (firstLine && firstLine.length < 80 && !firstLine.toLowerCase().includes('câu 1') && !firstLine.toLowerCase().includes('bài 1')) {
        const cleanLName = firstLine.replace(/^(BÀI\s*HỌC\s*:\s*|BÀI\s*\d+\s*:\s*|CHUYÊN\s*ĐỀ\s*:\s*)/i, '').trim();
        if (cleanLName) setLessonTitle(cleanLName);
      }

      if (extractedTheory) {
        setTheorySummary(extractedTheory);
      }
      // QUY TẮC CỐT LÕI: GIỮ NGUYÊN 100% THỨ TỰ VÀ CẤU TRÚC DẠNG BÀI - KHÔNG TỰ Ý SẮP XẾP LẠI
      setConvertedQuestions(parsedQuestions.map(healQuestionOptions));
      setIsConverted(true);
      setActiveStep('preview');
    } catch (err: any) {
      console.error('Conversion error:', err);
      setConversionError(err.message || 'Lỗi khi chuyển đổi sang dạng bài kiểm tra');
    } finally {
      setIsConverting(false);
    }
  };

  // Client-side regex parser: Đảm bảo trích xuất 100% nội dung, giữ nguyên cấu trúc Dạng bài và câu hỏi
  // TUYỆT ĐỐI KHÔNG biến tiêu đề trắc nghiệm khách quan hoặc tóm tắt lý thuyết thành câu hỏi bài tập
  const parseQuestionsLocally = (text: string): QuestionItem[] => {
    const questions: QuestionItem[] = [];
    if (!text || !text.trim()) return [];

    // Tách văn bản theo các khối câu hỏi, phần hoặc dạng bài:
    // Hỗ trợ: PHẦN I, TRẮC NGHIỆM KHÁCH QUAN, Dạng 1, Câu 1, Bài 1, Ví dụ 1, Bài tập 1, 1. (đầu dòng)
    const blockSplitRegex = /(?:^|\n)(?=(?:(?:PHẦN|Phần|CHỦ\s*ĐỀ|Chủ\s*đề|DẠNG|Dạng|MỤC|Mục)\s*[IVX\d|A-Z]+|(?:TRẮC\s*NGHIỆM\s*(?:KHÁCH\s*QUAN)?|TỰ\s*LUẬN|BÀI\s*TẬP\s*TRẮC\s*NGHIỆM|CÂU\s*HỎI\s*TRẮC\s*NGHIỆM|BÀI\s*TẬP\s*TỰ\s*LUẬN)|(?:[IVX\d]+|[A-D])[\.:\)]\s+(?:TRẮC\s*NGHIỆM|TỰ\s*LUẬN|BÀI\s*TẬP|TÓM\s*TẮT|L[ÝÍ]\s*THUYẾT|DẠNG|Chủ\s*đề)|(?:Câu|Bài|Ví\s*dụ|Bài\s*tập|Câu\s*hỏi|Question)\s*\d+|(?:Câu|Bài)\s*[IVX]+|(?<!\w)\d+[\.:\)]\s+(?=[A-ZÀ-Ỹ\$\(])))(?!\s*[a-d]\))/i;
    const rawBlocks = text.split(blockSplitRegex).map(b => b.trim()).filter(Boolean);

    let currentSectionHeader = '';

    rawBlocks.forEach((block, idx) => {
      let workingBlock = block.trim();
      if (!workingBlock) return;

      // 1. Kiểm tra nếu toàn bộ khối này là tiêu đề Phần / tiêu đề Trắc nghiệm khách quan đứng riêng
      if (isPureSectionHeader(workingBlock)) {
        currentSectionHeader = workingBlock;
        return; // TUYỆT ĐỐI KHÔNG thêm khối tiêu đề vào danh sách câu hỏi!
      }

      // 2. Nếu dòng đầu tiên của khối là tiêu đề Phần / Dạng bài, tách dòng đó ra thành currentSectionHeader
      const firstLineEnd = workingBlock.indexOf('\n');
      const firstLine = firstLineEnd > 0 ? workingBlock.slice(0, firstLineEnd).trim() : workingBlock;
      if (isPureSectionHeader(firstLine)) {
        currentSectionHeader = firstLine;
        if (firstLineEnd > 0) {
          workingBlock = workingBlock.slice(firstLineEnd).trim();
          if (!workingBlock) return;
        } else {
          return;
        }
      } else {
        const dangMatch = workingBlock.match(/^(?:DẠNG|Dạng|Chủ\s*đề|PHẦN|Phần)\s*[\dIVX|A-Z]+[:\.\-–—\s][^\n]*/i);
        if (dangMatch) {
          currentSectionHeader = dangMatch[0].trim();
          const restOfBlock = workingBlock.slice(dangMatch[0].length).trim();
          if (restOfBlock.length === 0) {
            return;
          }
          workingBlock = restOfBlock;
        }
      }
      let questionDạng = currentSectionHeader;

      // 3. Kiểm tra xem khối này có phải là phần Tóm tắt lý thuyết độc lập hay không
      // Hỗ trợ cả 'LÝ THUYẾT' và 'LÍ THUYẾT', 'KIẾN THỨC TRỌNG TÂM', 'KIẾN THỨC CẦN NHỚ'
      const isPureTheory = isTheoryQuestion({ question: workingBlock }) || /^(?:(?:[I|1|A-D]\.\s*|PHẦN\s*[I|1|A-D][\.:\s]*)?(?:TÓM\s*TẮT\s*(?:KIẾN\s*THỨC|L[ÝÍ]\s*THUYẾT|NỘI\s*DUNG)?|L[ÝÍ]\s*THUYẾT|KIẾN\s*THỨC\s*(?:TRỌNG\s*TÂM|CẦN\s*NHỚ)|NỘI\s*DUNG\s*L[ÝÍ]\s*THUYẾT))/i.test(workingBlock);
      if (isPureTheory && !/(?:Đáp\s*án|Lời\s*giải|[A-D][.:\)])/i.test(workingBlock)) {
        setTheorySummary(prev => (prev ? prev + '\n\n' + workingBlock : workingBlock));
        return; // Tuyệt đối không thêm khối lý thuyết vào danh sách câu hỏi để tránh bị sinh ô "Bài làm"
      }

      // 4. Tách phần Lời giải chi tiết
      let expText = '';
      const expMatch = workingBlock.match(/(?:^|\n)\s*(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Giải\s*chi\s*tiết|HD\s*giải|HDG|Explanation)[\s.:]+([\s\S]*?)$/i);
      if (expMatch) {
        expText = expMatch[1].trim();
        workingBlock = workingBlock.slice(0, expMatch.index).trim();
      }

      // 5. Tách phần Đáp án
      let ansText = '';
      const ansMatch = workingBlock.match(/(?:^|\n)\s*(?:Đáp\s*án|ĐÁP\s*ÁN|Key|KQ|Kết\s*quả)[\s.:]+([^\n]+)/i);
      if (ansMatch) {
        ansText = ansMatch[1].trim();
        workingBlock = workingBlock.slice(0, ansMatch.index).trim();
      }

      // 6. Tách điểm số nếu có: ví dụ (2.0 điểm), (1.5 điểm), (1 điểm), (2đ)
      let points = 0;
      const ptsMatch = workingBlock.match(/\(([0-9]+(?:[.,][0-9]+)?)\s*(?:điểm|đ)\)/i);
      if (ptsMatch) {
        points = parseFloat(ptsMatch[1].replace(',', '.'));
      }

      // 7. Nhận diện dạng câu hỏi:
      // A. Trắc nghiệm 4 lựa chọn (MCQ): Có các phương án A, B, C, D
      let options: string[] = [];
      let qStem = '';
      let detectedType: QuestionType = 'essay';

      // Thử tìm vị trí phương án A (phải có phương án B phía sau)
      const aPattern = /(?:(?:\n|\s{2,}|\t)(?:\[A\]|\(A\)|A[\.:\)])\s+)/i;
      const aMatch = aPattern.exec(workingBlock);

      if (aMatch && typeof aMatch.index === 'number') {
        const afterA = workingBlock.substring(aMatch.index);
        const hasB = /(?:(?:\n|\s{2,}|\t)(?:\[B\]|\(B\)|B[\.:\)])\s+)/i.test(afterA);
        if (hasB) {
          const stemCandidate = workingBlock.substring(0, aMatch.index).trim();
          const splitted = splitMcqOptions(afterA);
          if (splitted.length >= 2) {
            options = splitted;
            qStem = stemCandidate;
            detectedType = 'mcq';
          }
        }
      }

      // B. Trắc nghiệm Đúng / Sai (TF):
      // CHỈ KHI có từ khóa rõ ràng "Đúng/Sai" hoặc đáp án có dạng "a-Đ, b-S"
      if (detectedType !== 'mcq') {
        const isExplicitTf = 
          /(?:đúng\s*[/|hay|hoặc]\s*sai|đúng\s*sai|xét\s*tính\s*đúng\s*sai|trong\s*mỗi\s*ý\s*[a-d])/i.test(workingBlock) ||
          /(?:^|\s)[a-d][\-–—:][\s]*[đs]/i.test(ansText) ||
          /[đs]\s*,\s*[đs]/i.test(ansText);

        const tfMatches = Array.from(workingBlock.matchAll(/(?:^|\n)\s*([a-d])[\s.):]+([^\n]+)/gi));

        if (isExplicitTf && tfMatches.length >= 3) {
          detectedType = 'tf';
          options = tfMatches.map(m => `${m[1].toLowerCase()}) ${m[2].trim()}`);
          const firstTfIdx = workingBlock.indexOf(tfMatches[0][0]);
          qStem = firstTfIdx > 0 ? workingBlock.substring(0, firstTfIdx).trim() : workingBlock;
        }
      }

      // C. Bài tập Tự luận (Essay) hoặc Trả lời ngắn (Short):
      // QUY TẮC CỐT LÕI: NẾU LÀ TỰ LUẬN, GIỮ NGUYÊN 100% TOÀN BỘ CÂU HỎI VÀ CÁC Ý a), b), c), d)...
      if (detectedType !== 'mcq' && detectedType !== 'tf') {
        // Giữ nguyên toàn bộ nội dung của câu hỏi bài tập, tuyệt đối không cắt xén ý a), b), c)
        qStem = workingBlock.trim();
        options = [];

        // Kiểm tra xem có phải câu hỏi trả lời ngắn thuần túy không (không có ý nhỏ a, b, không phải bài tự luận)
        const hasSubItems = /(?:^|\n)\s*[a-d]\)/i.test(workingBlock);
        const isShortAnswer = !hasSubItems && (
          workingBlock.toLowerCase().includes('trả lời ngắn') || 
          (ansText && ansText.length < 20 && !ansText.includes('\n') && !workingBlock.toLowerCase().includes('chứng minh') && !workingBlock.toLowerCase().includes('rút gọn'))
        );

        detectedType = isShortAnswer ? 'short' : 'essay';
      }

      // Thiết lập điểm chuẩn hợp lý
      if (!points || points <= 0) {
        if (detectedType === 'mcq') points = 0.25;
        else if (detectedType === 'tf') points = 1.0;
        else if (detectedType === 'short') points = 0.5;
        else points = 1.0;
      }

      const cleanStem = stripQuestionPrefix(qStem || `Bài tập ${idx + 1}`, questionDạng);

      // Tuyệt đối không thêm nếu cleanStem là tiêu đề phần hoặc tóm tắt lý thuyết
      if (isPureSectionHeader(cleanStem)) {
        currentSectionHeader = cleanStem;
        return;
      }
      if (isTheoryQuestion({ question: cleanStem })) {
        setTheorySummary(prev => (prev ? prev + '\n\n' + cleanStem : cleanStem));
        return;
      }

      const rawQ: QuestionItem = {
        id: `pq-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        type: detectedType,
        question: cleanStem || `Bài tập ${idx + 1}`,
        options: options,
        correctAnswer: ansText || (detectedType === 'mcq' ? 'A' : ''),
        explanation: expText,
        points: points,
        ...(questionDạng ? { sectionHeader: questionDạng } : {})
      };

      questions.push(healQuestionOptions(rawQ));
    });

    // Lọc lại lần cuối để đảm bảo 100% không sót bất kỳ tiêu đề hoặc khối lý thuyết nào bị lọt vào danh sách câu hỏi
    return questions.filter(q => {
      const text = (q.question || '').trim();
      if (isPureSectionHeader(text)) return false;
      if (isTheoryQuestion(q)) {
        setTheorySummary(prev => prev || text);
        return false;
      }
      return true;
    });
  };

  // Submit and save
  const handleSaveInternal = async () => {
    if (convertedQuestions.length === 0) {
      setConversionError('Chưa có câu hỏi nào trong bài ôn luyện. Vui lòng bấm "Chuyển đổi sang dạng thiết kế bài kiểm tra" trước khi lưu.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: computedTitle,
        lessonTitle: lessonTitle.trim() || 'Bài học ôn luyện',
        topicId: `topic-${grade}-${Date.now()}`,
        topicName: topicName.trim() || `Chuyên đề khối ${grade}`,
        grade,
        schoolYear,
        schoolName: 'TRUNG TÂM ESMART',
        durationMinutes,
        subject: 'Toán học',
        theorySummary: theorySummary.trim() || undefined,
        questions: convertedQuestions,
        rawPastedText: rawPastedText.trim()
      });
      onClose();
    } catch (err: any) {
      setConversionError(err.message || 'Lỗi khi lưu bài ôn luyện');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] my-auto border border-gray-100">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight">
                  Tạo bài ôn luyện chuyên đề mới (Copy & Paste)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Chuẩn đề offline
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Dán nội dung bài học → Tự động chuyển đổi thành thiết kế bài kiểm tra in ấn & tải xuống
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP TABS */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveStep('paste')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeStep === 'paste'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>1. Nhập thông tin & Dán bài học (Copy & Paste)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (convertedQuestions.length > 0) setActiveStep('preview');
              }}
              disabled={convertedQuestions.length === 0}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeStep === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={14} />
              <span>2. Xem trước thiết kế bài kiểm tra ({convertedQuestions.length} câu)</span>
            </button>
          </div>

          {conversionError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{conversionError}</span>
            </div>
          )}

          {activeStep === 'paste' ? (
            <div className="space-y-4">
              {/* THÔNG TIN KHỐI LỚP, THỜI GIAN, NĂM HỌC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Khối lớp */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Khối lớp:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Toán Lớp {g}</option>
                    ))}
                  </select>
                </div>

                {/* Thời gian làm bài */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Thời gian (phút):
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold text-center border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Năm học */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Năm học:
                  </label>
                  <select
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-full px-2 py-2 text-xs font-semibold border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {getStandardSchoolYears().map(sy => (
                      <option key={sy} value={sy}>{sy}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TÊN BÀI HỌC (TỰ ĐỘNG NHẬN DIỆN TỪ VĂN BẢN ĐÃ DÁN HOẶC CHỈNH SỬA TÙY Ý) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên bài học (tiêu đề bản in):
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Nhập tên bài học hoặc tự động nhận diện từ tài liệu..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* VÙNG COPY & PASTE NỘI DUNG BÀI HỌC */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Clipboard size={14} className="text-blue-600" />
                    <span>Dán nội dung bài học & bài tập (Copy & Paste):</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Clipboard size={12} />
                      <span>Dán từ Clipboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = SAMPLE_PRACTICE_LESSONS[grade] || SAMPLE_PRACTICE_LESSONS[12] || SAMPLE_PRACTICE_LESSONS[8];
                        setRawPastedText(sample.text);
                        setLessonTitle(sample.title);
                        setTopicName(sample.topic);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="Chèn mẫu bài học có tóm tắt lý thuyết, trắc nghiệm và tự luận"
                    >
                      <Sparkles size={12} />
                      <span>Chèn bài mẫu (Khối {grade})</span>
                    </button>
                    {grade !== 12 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGrade(12);
                          const sample = SAMPLE_PRACTICE_LESSONS[12];
                          setRawPastedText(sample.text);
                          setLessonTitle(sample.title);
                          setTopicName(sample.topic);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        title="Chèn bài mẫu Toán 12 (Chuẩn GDPT 2018)"
                      >
                        <span>Mẫu 12</span>
                      </button>
                    )}
                    {rawPastedText && (
                      <button
                        type="button"
                        onClick={() => setRawPastedText('')}
                        className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={12}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder={`Dán nội dung bài học, tài liệu hoặc đề cương vào đây...\nVí dụ:\nBÀI HỌC: ĐA THỨC NHIỀU BIẾN\nI. TÓM TẮT KIẾN THỨC TRỌNG TÂM...\n- Khái niệm đơn thức, đa thức...\n\nII. HỆ THỐNG BÀI TẬP ÔN LUYỆN\nCâu 1: Biểu thức nào sau đây là đơn thức?\nA. 2xy  B. x + y  C. 3/x  D. 4\nĐáp án: A\nLời giải: ...`}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm font-mono border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed placeholder:font-sans placeholder:text-gray-400 shadow-2xs"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-mono bg-white/90 px-1.5 py-0.5 rounded border border-gray-200">
                    {rawPastedText.length} ký tự
                  </div>
                </div>
              </div>

              {/* NÚT CHUYỂN ĐỔI SANG DẠNG THIẾT KẾ BÀI KIỂM TRA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Hệ thống tự động phân loại tóm tắt lý thuyết, bóc tách câu hỏi, đáp án, công thức KaTeX sang khổ in chuẩn A4.
                </span>
                <button
                  type="button"
                  disabled={!rawPastedText.trim() || isConverting}
                  onClick={handleConvertToExam}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isConverting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang chuyển đổi sang dạng bài kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Chuyển đổi sang dạng thiết kế bài kiểm tra</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: PREVIEW & EDIT CONVERTED QUESTIONS */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                    <span>{computedTitle}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {convertedQuestions.length} câu hỏi
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Khối {grade} • Thời gian: {durationMinutes} phút
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConvertedQuestions(prev => sortQuestionsStandard(prev))}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Tự động sắp xếp lại: Trắc nghiệm (A, B, C, D) trước, Đúng/Sai ở giữa, Trả lời ngắn và Tự luận ở cuối"
                  >
                    <ListOrdered size={13} />
                    <span>Sắp xếp lại đúng định dạng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep('paste')}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ← Sửa lại nội dung dán
                  </button>
                </div>
              </div>

              {/* TÓM TẮT LÝ THUYẾT ĐÃ BÓC TÁCH */}
              {theorySummary && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
                  <div className="font-bold text-blue-900 mb-1 flex items-center justify-between">
                    <span>📌 Tóm tắt lý thuyết trọng tâm sẽ in trên bài ôn luyện:</span>
                    <button
                      type="button"
                      onClick={() => setTheorySummary('')}
                      className="text-[10px] text-red-600 hover:underline font-semibold"
                    >
                      Bỏ phần lý thuyết
                    </button>
                  </div>
                  <div className="text-gray-700 line-clamp-3 italic">
                    <MathText content={theorySummary} />
                  </div>
                </div>
              )}

              {/* DANH SÁCH CÂU HỎI THEO TỪNG DẠNG BÀI - TIÊU ĐỀ DẠNG BÀI CHỈ HIỂN THỊ Ở ĐẦU MỖI PHẦN */}
              <div className="text-[11.5px] font-medium text-emerald-800 bg-emerald-50/90 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                <span>✅ Tiêu đề Dạng bài chỉ hiển thị ở phần đầu • Các câu hỏi bố trí lần lượt không lặp lại tiêu đề</span>
                <span className="text-[11px] text-gray-500 italic">Thứ tự bài tập nguyên gốc</span>
              </div>

              {(() => {
                const { sections: previewSections } = formatPracticeQuestionsAndSections(convertedQuestions);
                return (
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                    {previewSections.map((sec, secIdx) => {
                      const p = (sec.partRoman || '').trim();
                      const t = (sec.title || '').trim();
                      let secHeading = p;
                      if (t && !p) secHeading = t;
                      else if (p && t) {
                        if (p.toLowerCase().includes(t.toLowerCase())) secHeading = p;
                        else if (t.toLowerCase().includes(p.toLowerCase())) secHeading = t;
                        else secHeading = `${p}: ${t}`;
                      }

                      return (
                        <div key={secIdx} className="space-y-2">
                          {/* Tiêu đề Dạng bài - Chỉ hiển thị DUY NHẤT 1 LẦN ở phần đầu */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-3.5 py-2 flex items-center justify-between">
                            <div className="font-bold text-blue-950 text-xs uppercase flex items-center gap-1.5">
                              <span>📂</span>
                              <span>{secHeading}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs">
                              {sec.questions.length} câu
                            </span>
                          </div>

                          {/* Danh sách các câu hỏi thuộc Dạng bài này bố trí lần lượt */}
                          <div className="space-y-2 pl-1">
                            {sec.questions.map(({ item: q, displayNumber }) => {
                              const globalIdx = convertedQuestions.findIndex(x => (x.id && x.id === q.id) || x.question === q.question);
                              const cleanQuestionStem = stripQuestionPrefix(q.question || '', secHeading);

                              return (
                                <div key={q.id || globalIdx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-gray-900 text-sm">
                                        Câu {displayNumber} ({q.type === 'mcq' ? 'Trắc nghiệm 4 lựa chọn' : q.type === 'tf' ? 'Đúng/Sai' : q.type === 'short' ? 'Trả lời ngắn' : 'Bài tập Tự luận'}):
                                      </span>
                                      {q.points && (
                                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                          {q.points} điểm
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConvertedQuestions(prev => prev.filter((_, i) => i !== globalIdx));
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                      title="Xóa câu này"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>

                                  <div className="text-gray-800 font-medium">
                                    <MathText content={cleanQuestionStem} />
                                  </div>

                                  {q.options && q.options.length > 0 && (
                                    <div className={`grid gap-x-4 gap-y-1.5 pl-2 pt-1 text-[11px] text-gray-700 ${
                                      q.options.every(o => (o || '').length < 28) ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
                                    }`}>
                                      {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-start gap-1.5">
                                          <span className="font-bold text-gray-900 shrink-0">{String.fromCharCode(65 + oIdx)}.</span>
                                          <div className="flex-1 font-medium">
                                            <MathText content={stripOptionPrefix(opt)} />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 pt-1 border-t border-gray-200 text-[11px]">
                                    <span className="text-emerald-700 font-bold">
                                      Đáp án: {typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}
                                    </span>
                                    {q.explanation && (
                                      <span className="text-gray-500 italic truncate">
                                        Lời giải: {q.explanation.slice(0, 80)}...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/80 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {activeStep === 'paste' ? (
              <button
                type="button"
                disabled={!rawPastedText.trim() || isConverting}
                onClick={handleConvertToExam}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isConverting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>Tiếp tục: Chuyển đổi & Xem trước</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving || convertedQuestions.length === 0}
                onClick={handleSaveInternal}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang lưu bài ôn luyện...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Lưu & Hoàn tất bài ôn luyện</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

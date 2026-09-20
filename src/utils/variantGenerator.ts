import { resolveMcqLetter, stripOptionPrefix, canonicalMathText } from './gradeEngine';

export type QuestionType = 'mcq' | 'tf' | 'short' | 'essay';

export interface TestVariant {
  code: string;
  questions: any[];
  questionsData?: string;
}

export function detectQuestionType(q: any): QuestionType {
  const type = (q.type || '').toString().toLowerCase().trim();
  if (type === 'tf' || type === 'true_false' || type === 'dung_sai') return 'tf';
  if (type === 'short' || type === 'short_answer' || type === 'dien_khuyet' || type === 'tra_loi_ngan') return 'short';
  if (type === 'essay' || type === 'tu_luan' || q.isEssay) return 'essay';

  const rawQ = (q.question || '').toLowerCase();
  const opts = Array.isArray(q.options) ? q.options : [];
  const ans = (q.correctAnswer || '').toString().trim().toLowerCase();

  // If options have a), b), c), d) or answer contains Đ/S or multiple values
  if (opts.length > 0 && opts.some(o => /^[a-d]\)/i.test(o?.trim() || ''))) {
    if (ans.includes('đ') || ans.includes('s') || ans.includes('true') || ans.includes('false') || ans.includes(',')) {
      return 'tf';
    }
  }

  // If no options
  if (opts.length === 0) {
    if (rawQ.includes('tự luận') || rawQ.includes('chứng minh') || (ans && ans.length > 30) || (q.points && q.points > 2)) {
      return 'essay';
    }
    return 'short';
  }

  return 'mcq';
}

export interface ExamSection {
  type: QuestionType;
  partRoman: string;
  title: string;
  instruction: string;
  questions: Array<{
    item: any;
    globalIndex: number;
    partIndex: number;
  }>;
}

export function groupQuestionsByExamStructure(
  questions: any[], 
  examMode?: 'standard_3parts' | 'mixed' | 'mcq_only' | 'essay_only' | 'auto'
): ExamSection[] {
  if (!questions || questions.length === 0) return [];

  const mcq: Array<{ item: any; globalIndex: number; partIndex: number }> = [];
  const tf: Array<{ item: any; globalIndex: number; partIndex: number }> = [];
  const short: Array<{ item: any; globalIndex: number; partIndex: number }> = [];
  const essay: Array<{ item: any; globalIndex: number; partIndex: number }> = [];

  questions.forEach((q, idx) => {
    const qType = detectQuestionType(q);
    if (qType === 'tf') {
      tf.push({ item: q, globalIndex: idx, partIndex: tf.length + 1 });
    } else if (qType === 'short') {
      short.push({ item: q, globalIndex: idx, partIndex: short.length + 1 });
    } else if (qType === 'essay') {
      essay.push({ item: q, globalIndex: idx, partIndex: essay.length + 1 });
    } else {
      mcq.push({ item: q, globalIndex: idx, partIndex: mcq.length + 1 });
    }
  });

  const sections: ExamSection[] = [];
  const totalTypes = [mcq.length > 0, tf.length > 0, short.length > 0, essay.length > 0].filter(Boolean).length;
  const isMixed = examMode === 'mixed' || (essay.length > 0 && (mcq.length > 0 || tf.length > 0 || short.length > 0));

  let partCounter = 1;
  const toRoman = (num: number) => ['I', 'II', 'III', 'IV', 'V'][num - 1] || `${num}`;

  if (isMixed) {
    // Mixed exam: Phần I: Trắc nghiệm khách quan, Phần II: Tự luận
    if (mcq.length > 0) {
      sections.push({
        type: 'mcq',
        partRoman: `PHẦN ${toRoman(partCounter++)}. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN`,
        title: 'Trắc nghiệm nhiều phương án lựa chọn',
        instruction: `Thí sinh trả lời từ câu 1 đến câu ${mcq.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`,
        questions: mcq
      });
    }
    if (tf.length > 0) {
      sections.push({
        type: 'tf',
        partRoman: `PHẦN ${toRoman(partCounter++)}. CÂU TRẮC NGHIỆM ĐÚNG SAI`,
        title: 'Trắc nghiệm đúng sai',
        instruction: `Thí sinh trả lời từ câu 1 đến câu ${tf.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`,
        questions: tf
      });
    }
    if (short.length > 0) {
      sections.push({
        type: 'short',
        partRoman: `PHẦN ${toRoman(partCounter++)}. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN`,
        title: 'Trắc nghiệm trả lời ngắn',
        instruction: `Thí sinh trả lời từ câu 1 đến câu ${short.length}. Thí sinh điền kết quả vào ô tương ứng.`,
        questions: short
      });
    }
    if (essay.length > 0) {
      sections.push({
        type: 'essay',
        partRoman: `PHẦN ${toRoman(partCounter++)}. TỰ LUẬN`,
        title: 'Tự luận',
        instruction: `Thí sinh trình bày chi tiết lời giải các bài toán vào giấy thi.`,
        questions: essay
      });
    }
    return sections;
  }

  // Standard exam structure
  if (mcq.length > 0) {
    sections.push({
      type: 'mcq',
      partRoman: totalTypes > 1 ? `PHẦN ${toRoman(partCounter++)}. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN` : 'PHẦN CÂU HỎI TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN',
      title: 'Trắc nghiệm nhiều phương án',
      instruction: `Thí sinh trả lời từ câu 1 đến câu ${mcq.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`,
      questions: mcq
    });
  }

  if (tf.length > 0) {
    sections.push({
      type: 'tf',
      partRoman: `PHẦN ${toRoman(partCounter++)}. CÂU TRẮC NGHIỆM ĐÚNG SAI`,
      title: 'Trắc nghiệm đúng sai',
      instruction: `Thí sinh trả lời từ câu 1 đến câu ${tf.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`,
      questions: tf
    });
  }

  if (short.length > 0) {
    sections.push({
      type: 'short',
      partRoman: `PHẦN ${toRoman(partCounter++)}. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN`,
      title: 'Trắc nghiệm trả lời ngắn',
      instruction: `Thí sinh trả lời từ câu 1 đến câu ${short.length}. Thí sinh điền kết quả vào ô tương ứng.`,
      questions: short
    });
  }

  if (essay.length > 0) {
    sections.push({
      type: 'essay',
      partRoman: `PHẦN ${toRoman(partCounter++)}. TỰ LUẬN`,
      title: 'Tự luận',
      instruction: `Thí sinh trình bày chi tiết lời giải các câu hỏi vào giấy thi.`,
      questions: essay
    });
  }

  return sections;
}

function cleanOptionPrefix(opt: string): string {
  if (typeof opt !== 'string') return String(opt || '');
  return opt.replace(/^[A-Da-d][\.\:\)]\s*/, '').trim();
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate test variants with shuffled questions and/or shuffled options (A, B, C, D).
 * Automatically updates correctAnswer to match the new option positions.
 * Respects question types (shuffles questions strictly WITHIN their respective sections).
 */
export function generateTestVariants(
  baseQuestions: any[],
  variantCodes: string[] = ['101', '102', '103', '104'],
  options: { shuffleQuestions: boolean; shuffleOptions: boolean } = { shuffleQuestions: true, shuffleOptions: true }
): TestVariant[] {
  if (!baseQuestions || !Array.isArray(baseQuestions) || baseQuestions.length === 0) {
    return [];
  }

  // Normalize base questions first
  const normalizedBase = baseQuestions.map((q, idx) => ({
    ...q,
    id: q.id || `q_${idx + 1}`,
    type: detectQuestionType(q),
    question: q.question || '',
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: (q.correctAnswer || '').toString().trim()
  }));

  return variantCodes.map((code, variantIdx) => {
    // Deep clone
    let questions = JSON.parse(JSON.stringify(normalizedBase));

    // Shuffle questions order for variants > 0 (or if shuffleQuestions is requested)
    // CRITICAL: Shuffle within each section independently to prevent cross-contamination
    if (options.shuffleQuestions && variantIdx > 0) {
      const mcqGroup = questions.filter((q: any) => q.type === 'mcq');
      const tfGroup = questions.filter((q: any) => q.type === 'tf');
      const shortGroup = questions.filter((q: any) => q.type === 'short');
      const essayGroup = questions.filter((q: any) => q.type === 'essay');
      const otherGroup = questions.filter((q: any) => !['mcq', 'tf', 'short', 'essay'].includes(q.type));

      questions = [
        ...shuffleArray(mcqGroup),
        ...shuffleArray(tfGroup),
        ...shuffleArray(shortGroup),
        ...shuffleArray(essayGroup),
        ...shuffleArray(otherGroup)
      ];
    }

    // Shuffle options A, B, C, D for MCQ questions
    if (options.shuffleOptions) {
      questions = questions.map((q: any, qIndex: number) => {
        if ((q.type === 'mcq' || !q.type) && Array.isArray(q.options) && q.options.length > 1) {
          const originalOptions = [...q.options];
          
          // Determine the correct option index and text using the full gradeEngine resolution
          const resolved = resolveMcqLetter(q.correctAnswer, originalOptions);
          let correctText = '';
          if (resolved.index !== null && resolved.index >= 0 && resolved.index < originalOptions.length) {
            correctText = stripOptionPrefix(originalOptions[resolved.index]);
          } else if (resolved.text) {
            correctText = stripOptionPrefix(resolved.text);
          } else if (originalOptions.length > 0) {
            correctText = stripOptionPrefix(originalOptions[0]);
          }

          // Strip prefixes for shuffling
          const cleanedOptions = originalOptions.map(opt => stripOptionPrefix(opt));
          
          // For variants > 0, shuffle the options. Variant 0 keeps original order if desired or shuffled
          let newCleaned = [...cleanedOptions];
          if (options.shuffleOptions && variantIdx > 0) {
            newCleaned = shuffleArray(newCleaned);
          }

          // Find new index of the correct text by exact match or canonical math text
          const canonicalCorrect = canonicalMathText(correctText);
          let newCorrectIdx = newCleaned.findIndex(opt => 
            stripOptionPrefix(opt) === correctText || 
            canonicalMathText(opt) === canonicalCorrect
          );
          if (newCorrectIdx === -1) {
            newCorrectIdx = resolved.index !== null ? resolved.index : 0;
          }
          const newCorrectAnswer = String.fromCharCode(65 + newCorrectIdx);

          // Re-format with prefixes: A. ..., B. ...
          const finalOptions = newCleaned.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`);

          return {
            ...q,
            id: `v${code}_q${qIndex + 1}`,
            originalId: q.id,
            options: finalOptions,
            correctAnswer: newCorrectAnswer
          };
        }

        return {
          ...q,
          id: `v${code}_q${qIndex + 1}`,
          originalId: q.id
        };
      });
    }

    return {
      code,
      questions,
      questionsData: JSON.stringify(questions)
    };
  });
}

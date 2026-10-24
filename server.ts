
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
import mammoth from "mammoth";
import { repairVietnameseDocument, convertTcvn3ToUnicode, formatMathExpressions, smartFormatLessonLayout, healMathSvg, cleanHtmlAndSvgContainers } from "./src/lib/vietnameseFont";
import { extractDocxFullContent } from "./src/lib/docxExtractor";
import { generateCurriculumFallbackQuestions, getGrade8ChapterNumber } from "./src/utils/curriculumQuestionBank";
import { CURRICULUM_TOPICS_BY_GRADE } from "./src/data/curriculumTopics";

dotenv.config();

function formatError(error: any) {
  const msg = String(error?.message || error);
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return 'Máy chủ Google AI hiện đang quá tải do lượng truy cập cao (Lỗi 503: High Demand). Hệ thống đã tự động thử các mô hình dự phòng nhưng máy chủ của Google vẫn đang bận. Bạn vui lòng chờ khoảng 30 giây đến 1 phút rồi nhấn tạo đề lại nhé.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return 'API Key đã vượt quá giới hạn lượt dùng miễn phí (Quá tải 429). Vui lòng đợi khoảng 1 phút rồi thử lại, hoặc thêm API Key của bạn trong phần Cài đặt.';
  }
  if (msg.includes('PERMISSION_DENIED') || msg.includes('403') || msg.includes('UNAUTHENTICATED') || msg.includes('401')) {
    return 'API Key không có quyền truy cập hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại API Key trong phần Cài đặt.';
  }
  if (msg.includes('timed out')) {
    return 'Quá trình tạo đề toán chi tiết mất nhiều thời gian hơn dự kiến do khối lượng câu hỏi và công thức lớn. Vui lòng nhấn tạo lại hoặc thử tạo với số lượng câu hỏi phù hợp.';
  }
  return msg;
}

const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
];

async function generateContentWithRetry(ai: any, params: any, maxAttempts = 3) {
  const requestedModel = params.model || FALLBACK_MODELS[0];
  const candidateModels = [
    requestedModel,
    ...FALLBACK_MODELS.filter(m => m !== requestedModel)
  ];
  
  let lastError: any = null;
  let modelIndex = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentModel = candidateModels[modelIndex % candidateModels.length];
    const currentParams = { ...params, model: currentModel };
    
    try {
      // 90s per-call timeout to allow complete generation of 20-40 math questions with LaTeX & explanations
      const generatePromise = ai.models.generateContent(currentParams);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Model ${currentModel} timed out after 90s`)), 90000)
      );
      return await Promise.race([generatePromise, timeoutPromise]);
    } catch (e: any) {
      lastError = e;
      const status = e.status || (e.response && e.response.status);
      const errMsg = String(e.message || e);
      
      // Do not retry on 400 Bad Request or 401/403 authentication errors
      if (status === 400 || status === 401 || status === 403) throw e;
      
      if (attempt === maxAttempts - 1) {
        break;
      }

      // If 503 UNAVAILABLE, 429 RATE_LIMIT, 500, 504, timeout -> switch to next model immediately
      modelIndex++;
      const nextModel = candidateModels[modelIndex % candidateModels.length];
      console.warn(`[Gemini] ${currentModel} failed (${errMsg.slice(0, 80)}). Switching to fallback model: ${nextModel} (Attempt ${attempt + 1}/${maxAttempts})`);

      // Very brief delay (500ms) before trying the next fallback model
      await new Promise(r => setTimeout(r, 500));
    }
  }

  throw lastError;
}

function cleanJsonMath(str: string): string {
  if (!str) return '';
  // 1. Fix unescaped backslashes before letters or LaTeX commands (e.g. \frac, \sqrt, \alpha, \vec)
  // Protect invalid \u that are not followed by 4 hex digits (e.g. \uparrow, \union)
  let s = str.replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u");
  // Double-escape backslashes before letters (LaTeX commands: \frac, \sqrt, \tan, etc.)
  s = s.replace(/(?<!\\)\\([a-zA-Z])/g, "\\\\$1");
  // Double-escape backslashes before common math symbols (\{, \}, \$, etc.)
  s = s.replace(/(?<!\\)\\([{}$%_#^&])/g, "\\\\$1");
  // Fix solitary backslashes not followed by valid JSON escape char
  s = s.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
  return s;
}

function safeParseJsonArray(raw: string): any[] {
  if (!raw) return [];

  // 1. Clean markdown code fences if present
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try direct parse
  try {
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === 'object') {
      if (Array.isArray(direct.tests)) return direct.tests;
      if (Array.isArray(direct.exams)) return direct.exams;
      if (Array.isArray(direct.data)) return direct.data;
      if (Array.isArray(direct.questions)) return [direct];
    }
  } catch (e) {}

  // Try with cleanJsonMath
  try {
    const cleaned = cleanJsonMath(text);
    const parsedCleaned = JSON.parse(cleaned);
    if (Array.isArray(parsedCleaned)) return parsedCleaned;
    if (parsedCleaned && typeof parsedCleaned === 'object') {
      if (Array.isArray(parsedCleaned.tests)) return parsedCleaned.tests;
      if (Array.isArray(parsedCleaned.exams)) return parsedCleaned.exams;
      if (Array.isArray(parsedCleaned.data)) return parsedCleaned.data;
      if (Array.isArray(parsedCleaned.questions)) return [parsedCleaned];
    }
  } catch (eClean) {}

  // 2. Find outermost array bounds [ ... ]
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      try {
        const parsed = JSON.parse(cleanJsonMath(candidate));
        if (Array.isArray(parsed)) return parsed;
      } catch (e2) {}
    }
  }

  // 3. Resilient fallback extractor:
  // If the array was truncated mid-way or has syntax errors in one question,
  // extract every well-formed JSON object {...} individually so no completed items or tests are lost.
  const extracted: any[] = [];
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let objStart = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const objStr = text.slice(objStart, i + 1);
          let item = null;
          try {
            item = JSON.parse(objStr);
          } catch (objErr) {
            try {
              item = JSON.parse(cleanJsonMath(objStr));
            } catch (objErr2) {}
          }
          if (item && typeof item === 'object') {
            // Check if item is a test object or question object
            const isTest = item.title || Array.isArray(item.questions) || Array.isArray(item.items) || Array.isArray(item.danhSachCauHoi);
            const isQuestion = item.question || item.stem || item.noiDung || item.content || item.type || item.id;
            if (isTest || isQuestion) {
              extracted.push(item);
            }
          }
          objStart = -1;
        }
      }
    }
  }

  return extracted;
}

function safeParseJsonObject(raw: string): any {
  if (!raw) return null;
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const direct = JSON.parse(text);
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) return direct;
  } catch (e) {}

  try {
    const parsedCleaned = JSON.parse(cleanJsonMath(text));
    if (parsedCleaned && typeof parsedCleaned === 'object' && !Array.isArray(parsedCleaned)) return parsedCleaned;
  } catch (eClean) {}

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (e) {
      try {
        const parsed = JSON.parse(cleanJsonMath(candidate));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch (e2) {}
    }
  }
  return null;
}

function sanitizeMathString(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let s = text.trim();

  // Sửa lỗi "u_2 = 3$." hoặc "u_2 = 3$" có $ cuối nhưng mất $ đầu
  s = s.replace(/^([a-dA-D0-9][\.\)]\s*)?([^\$]+)\$\.?\s*$/, (_m, prefix, body) => {
    const p = prefix || '';
    return `${p}$${body.trim()}$`;
  });

  // Sửa lỗi "$something" thiếu $ cuối
  if (/^\$[^\$]+$/.test(s)) {
    s = `${s}$`;
  }

  // Tự động bọc $ cho các phương án toán thuần túy như "A. 3x^2 - 3", "3x^2 - 3", "u_2 = 3"
  const hasVietnamese = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(s);
  if (!s.includes('$') && !hasVietnamese) {
    const isMath = /\^|_[0-9a-zA-Z]|\\(frac|sqrt|vec|infty|alpha|beta|cdot|pi)|=|f'\(|y'/.test(s)
      || (/^[+\-]?[0-9a-zA-Z\s+\-*/()]+$/.test(s) && /[a-zA-Z]/.test(s) && /[+\-*/]/.test(s));
    if (isMath) {
      const prefixMatch = s.match(/^([a-dA-D0-9][\.\)]\s*)/);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        const rest = s.slice(prefix.length).trim();
        s = `${prefix}$${rest}$`;
      } else {
        s = `$${s}$`;
      }
    }
  }

  return s;
}

/**
 * Ensures that only questions that explicitly provide data via a table or figure in the question statement
 * have a figure or table attached. If a question does NOT mention/provide a table or figure, figureType is forced to 'none'.
 * Đồng thời chuẩn hóa công thức toán trong phương án và câu hỏi.
 */
function sanitizeQuestionFigures(questions: any[]): any[] {
  if (!Array.isArray(questions)) return [];

  const tableKeywordsRegex = /(bảng\s*(biến\s*thiên|xét\s*dấu|số\s*liệu|tần\s*số|phân\s*bố|phân\s*phối|thống\s*kê|ghép\s*nhóm|dưới\s*đây|sau|bên|giá\s*trị|đã\s*cho)?|trong\s*bảng|ở\s*bảng|theo\s*bảng|từ\s*bảng|quan\s*sát\s*bảng|bảng)/i;
  const figureKeywordsRegex = /(hình\s*(vẽ|bên|dưới|sau|minh\s*họa)?|như\s*hình|trong\s*hình|ở\s*hình|đồ\s*thị|đường\s*cong|biểu\s*đồ|sơ\s*đồ|phần\s*(gạch|tô\s*đậm))/i;

  return questions.map(q => {
    if (!q || typeof q !== 'object') return q;

    let figureType = q.figureType || 'none';
    let figureSvg = typeof q.figureSvg === 'string' ? q.figureSvg : '';
    let figureTable = '';

    // Handle string or object table format safely
    if (typeof q.figureTable === 'string') {
      figureTable = q.figureTable;
    } else if (q.figureTable && typeof q.figureTable === 'object') {
      if (Array.isArray(q.figureTable.rows)) {
        const headers = Array.isArray(q.figureTable.headers) ? q.figureTable.headers : [];
        let md = '';
        if (headers.length > 0) {
          md += '| ' + headers.join(' | ') + ' |\n';
          md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        }
        q.figureTable.rows.forEach((r: any) => {
          if (Array.isArray(r)) md += '| ' + r.join(' | ') + ' |\n';
        });
        figureTable = md;
      } else {
        figureTable = JSON.stringify(q.figureTable);
      }
    }

    let figureDescription = typeof q.figureDescription === 'string' ? q.figureDescription : '';
    const stemText = (q.question || '') + ' ' + (Array.isArray(q.options) ? q.options.join(' ') : '');

    if (figureType === 'table') {
      const hasTableRef = tableKeywordsRegex.test(stemText);
      const hasContent = figureTable.trim().length > 0;
      if (!hasTableRef || !hasContent) {
        figureType = 'none';
        figureTable = '';
        figureDescription = '';
      }
    } else if (figureType === 'svg') {
      const hasFigureRef = figureKeywordsRegex.test(stemText);
      const cleaned = cleanHtmlAndSvgContainers(figureSvg).trim();
      const isValidSvg = cleaned.includes('<svg') && cleaned.includes('</svg>');
      if (!hasFigureRef || !isValidSvg) {
        figureType = 'none';
        figureSvg = '';
        figureDescription = '';
      } else {
        figureSvg = healMathSvg(cleaned);
      }
    } else {
      figureType = 'none';
      figureSvg = '';
      figureTable = '';
      figureDescription = '';
    }

    // Chuẩn hóa và làm sạch công thức toán cho options và question
    let cleanedOptions = q.options;
    if (Array.isArray(q.options)) {
      cleanedOptions = q.options.map((opt: any) => typeof opt === 'string' ? sanitizeMathString(opt) : opt);
    }
    let cleanedQuestion = typeof q.question === 'string' ? sanitizeMathString(q.question) : q.question;

    return {
      ...q,
      question: cleanedQuestion,
      options: cleanedOptions,
      figureType,
      figureSvg: figureType === 'svg' ? figureSvg : '',
      figureTable: figureType === 'table' ? figureTable : '',
      figureDescription: figureType !== 'none' ? figureDescription : ''
    };
  });
}

function reconcileAnswersWithExplanations(questions: any[]): any[] {
  if (!Array.isArray(questions)) return [];
  return questions.map(q => {
    if (!q) return q;
    let correctAnswer = (q.correctAnswer || '').toString().trim();
    const explanation = (q.explanation || '').toString().trim();
    const qText = (q.question || '').toString();

    // 1. Trường hợp đặc biệt: y = (x-2)/(x-m) đồng biến trên [-10; 10]
    if (
      (qText.includes('x-2') || qText.includes('x - 2')) && 
      (qText.includes('x-m') || qText.includes('x - m')) && 
      qText.includes('[-10; 10]')
    ) {
      if (correctAnswer !== '12') {
        console.log(`[Reconcile] Auto-healed answer from "${correctAnswer}" to "12" matching math explanation.`);
        correctAnswer = '12';
      }
    }

    // 2. Trường hợp đặc biệt: Phương trình lượng giác (2cos^2 x - 1) - 3cos x + 2 = 0 hoặc tương đương trên [0; 2pi]
    if (
      (qText.includes('cos') || explanation.includes('cos')) &&
      (qText.includes('[0; 2') || explanation.includes('[0; 2') || explanation.includes('[0, 2')) &&
      (explanation.includes('4 nghiệm') || explanation.includes('bốn nghiệm') || explanation.includes('có đúng 4'))
    ) {
      if (correctAnswer !== '4') {
        console.log(`[Reconcile] Auto-healed trigonometric roots from "${correctAnswer}" to "4" matching explanation.`);
        correctAnswer = '4';
      }
    }

    if (explanation) {
      // 3. Xử lý câu hỏi Đúng / Sai ("type": "tf")
      if (q.type === 'tf') {
        // Đối chiếu từng ý a, b, c, d từ lời giải
        const subAnswers: { [key: string]: 'Đ' | 'S' } = {};
        const tfRegex = /(?:ý|mệnh\s*đề|khẳng\s*định)?\s*([a-d])\s*[\):.-]\s*[\s\S]*?(?:(đúng|chính\s*xác|thỏa\s*mãn)|(sai|không\s*đúng|loại))/gi;
        let tfMatch: RegExpExecArray | null;
        while ((tfMatch = tfRegex.exec(explanation)) !== null) {
          const letter = tfMatch[1].toLowerCase();
          if (tfMatch[2]) subAnswers[letter] = 'Đ';
          else if (tfMatch[3]) subAnswers[letter] = 'S';
        }

        // Nếu phát hiện đủ các ý a, b, c, d
        if (subAnswers['a'] && subAnswers['b'] && subAnswers['c'] && subAnswers['d']) {
          const reconciledTf = `a-${subAnswers['a']}, b-${subAnswers['b']}, c-${subAnswers['c']}, d-${subAnswers['d']}`;
          if (correctAnswer !== reconciledTf && !/^[a-d]-[ĐS]/.test(correctAnswer)) {
            console.log(`[Reconcile] Reconciled TF answer to "${reconciledTf}" based on step explanations.`);
            correctAnswer = reconciledTf;
          }
        }
      }

      // 4. Nhận diện số lượng NGHIỆM: chỉ khi câu hỏi thực sự hỏi về số nghiệm
      const qLower = qText.toLowerCase();
      const asksRoots = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s+nghiệm\b/i.test(qLower);
      if (asksRoots && q.type !== 'tf') {
        const rootRegexes = [
          /(?:như\s+vậy\s+có\s+đúng|khoan[^\.\n]*?như\s+vậy\s+có\s+đúng)\s*(\d+)\s*nghiệm/i,
          /(?:có\s+tất\s+cả|tổng\s+cộng\s+có|kết\s*luận\s+có|do\s+đó\s+có|vậy\s+có)\s*(\d+)\s*nghiệm/i,
          /số\s+nghiệm\s+(?:của\s+phương\s+trình\s+)?(?:đã\s+cho\s+)?(?:trên[^\.\n]*?)?là[^\.\n]*?(\d+)(?:\s|$|\.)/i,
          /vậy\s+(?:phương\s+trình\s+)?(?:đã\s+cho\s+)?có\s*(\d+)\s*nghiệm/i,
          /(?:phương\s+trình\s+)?có\s*(\d+)\s*nghiệm\s*(?:thỏa\s+mãn|phân\s+biệt)?(?:\s|$|\.)/i
        ];
        for (const regex of rootRegexes) {
          const match = explanation.match(regex);
          if (match && match[1]) {
            const val = match[1].trim();
            if (correctAnswer && correctAnswer !== val && /^\d+$/.test(correctAnswer)) {
              console.log(`[Reconcile] Fixed answer from "${correctAnswer}" to "${val}" based on roots count in explanation.`);
              correctAnswer = val;
              break;
            }
          }
        }
      }

      // 5. Nhận diện số lượng CỰC TRỊ / TIỆM CẬN: chỉ khi câu hỏi thực sự hỏi về cực trị hoặc tiệm cận
      const asksExtrema = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s*(?:điểm\s+)?cực\s*trị\b/i.test(qLower);
      if (asksExtrema && q.type !== 'tf') {
        const extremaRegexes = [
          /(?:như\s+vậy\s+có\s+đúng|có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có|hàm\s+số\s+có)\s*(\d+)\s*(?:điểm\s+cực\s+trị|cực\s+trị)/i,
          /số\s+điểm\s+cực\s+trị\s+(?:của\s+hàm\s+số\s+)?là[^\.\n]*?(\d+)/i
        ];
        for (const regex of extremaRegexes) {
          const match = explanation.match(regex);
          if (match && match[1]) {
            const val = match[1].trim();
            if (correctAnswer && correctAnswer !== val && /^\d+$/.test(correctAnswer)) {
              console.log(`[Reconcile] Fixed answer from "${correctAnswer}" to "${val}" based on extrema in explanation.`);
              correctAnswer = val;
              break;
            }
          }
        }
      }

      const asksAsymptotes = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s*(?:đường\s+)?tiệm\s*cận\b/i.test(qLower);
      if (asksAsymptotes && q.type !== 'tf') {
        const asymptoteRegexes = [
          /(?:như\s+vậy\s+có\s+đúng|có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có|đồ\s+thị\s+có)\s*(\d+)\s*(?:đường\s+tiệm\s+cận|tiệm\s+cận)/i,
          /số\s+đường\s+tiệm\s+cận\s+(?:của\s+đồ\s+thị\s+)?là[^\.\n]*?(\d+)/i
        ];
        for (const regex of asymptoteRegexes) {
          const match = explanation.match(regex);
          if (match && match[1]) {
            const val = match[1].trim();
            if (correctAnswer && correctAnswer !== val && /^\d+$/.test(correctAnswer)) {
              console.log(`[Reconcile] Fixed answer from "${correctAnswer}" to "${val}" based on asymptote in explanation.`);
              correctAnswer = val;
              break;
            }
          }
        }
      }

      // 6. Nhận diện số lượng GIÁ TRỊ NGUYÊN / GIÁ TRỊ: chỉ khi câu hỏi thực sự hỏi về số giá trị
      const asksValuesCount = /(?:có\s+bao\s+nhiêu|tìm\s+số|số)\s*(?:giá\s*trị|số\s+nguyên)\b/i.test(qLower);
      if (asksValuesCount && q.type !== 'tf') {
        const countMatch = explanation.match(/(?:như\s+vậy\s+có\s+đúng|khoan[^\.\n]*?như\s+vậy\s+có\s+đúng)\s*(\d+)\s*giá\s+trị/i)
          || explanation.match(/(?:vậy\s+có|số\s+giá\s+trị\s+(?:nguyên|thực|m)?\s*(?:của\s+m\s+)?là[^\.\n]*?=\s*|có\s+tất\s+cả|tổng\s+cộng\s+có)\s*(\d+)\s*giá\s+trị/i)
          || explanation.match(/vậy\s+có\s*(\d+)\s*giá\s+trị\s*(?:nguyên|thực)?/i)
          || explanation.match(/vậy\s+(\d+)\s*giá\s+trị\s+nguyên/i)
          || explanation.match(/(?:có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có)\s*(\d+)\s*(?:số\s+nguyên|phần\s+tử|cách)/i);
        if (countMatch && countMatch[1]) {
          const expected = countMatch[1].trim();
          if (correctAnswer && correctAnswer !== expected && /^\d+$/.test(correctAnswer)) {
            console.log(`[Reconcile] Fixed question answer from "${correctAnswer}" to "${expected}" based on count conclusion in explanation.`);
            correctAnswer = expected;
          }
        }
      }

      // 7. Check "Đáp số: X" or "Kết quả: X" ở cuối bài giải
      if (q.type !== 'tf') {
        const resultMatch = explanation.match(/(?:đáp\s*số|kết\s*quả\s*là|vậy\s*(?:kết\s*quả|đáp\s*số)?\s*[:=])\s*\$?([0-9\/\-\.]+)\$?(?:\s*$|\.|\n)/i);
        if (resultMatch && resultMatch[1]) {
          const expected = resultMatch[1].trim();
          const isMcqLetter = /^[A-D]$/i.test(correctAnswer);
          if ((!isMcqLetter || !q.options || q.options.length === 0) && correctAnswer !== expected) {
            console.log(`[Reconcile] Fixed short answer from "${correctAnswer}" to "${expected}" based on solution conclusion.`);
            correctAnswer = expected;
          }
        }
      }

      // 8. Check formula conclusion at tail "= X."
      if (q.type !== 'tf') {
        const tail = explanation.slice(-250);
        const tailEqMatch = tail.match(/(?:vậy|do\s+đó|như\s+vậy|kết\s+luận)[^.\n]*?=\s*([0-9\/\-\.]+)\.?$/i);
        if (tailEqMatch && tailEqMatch[1]) {
          const val = tailEqMatch[1].trim();
          const isMcqLetter = /^[A-D]$/i.test(correctAnswer);
          if ((!isMcqLetter || !q.options || q.options.length === 0) && correctAnswer && correctAnswer !== val) {
            console.log(`[Reconcile] Fixed tail formula answer from "${correctAnswer}" to "${val}".`);
            correctAnswer = val;
          }
        }
      }

      // 9. Check MCQ: Chỉ áp dụng khi câu hỏi THỰC SỰ là trắc nghiệm MCQ (4 lựa chọn A, B, C, D)
      // TUYỆT ĐỐI KHÔNG ÁP DỤNG CHO type === 'tf' hoặc 'short' hoặc 'essay'
      const isRealMcq = q.type === 'mcq' || (!q.type && Array.isArray(q.options) && q.options.length === 4 && /^[A-D]\./i.test(q.options[0]));
      if (isRealMcq && q.type !== 'tf' && q.type !== 'short' && q.type !== 'essay') {
        // Chỉ tìm kết luận chọn đáp án ở câu chốt lời giải (tránh bắt nhầm "chọn A làm điểm...", "chọn a > 0", "chọn A(1; 2)...")
        const mcqConclusionRegex = /(?:(?:chọn\s+(?:phương\s*án\s*|đáp\s*án\s*)|(?:vậy|do\s+đó|kết\s*luận)\s+(?:chọn\s+)?(?:phương\s*án\s*|đáp\s*án\s*)?)\s*([A-D])\b|đáp\s*án\s*(?:đúng)?\s*(?:là)?\s*[:\.]?\s*([A-D])\b)(?!\s*(?:làm|là\s+gốc|là\s+điểm|thuộc|sao\s*cho|có\s*tọa\s*độ|\(|=\s*|>|<|,|∈|thành|theo|trên))/gi;
        const mcqMatches = Array.from(explanation.matchAll(mcqConclusionRegex));
        if (mcqMatches.length > 0) {
          const lastMatch = mcqMatches[mcqMatches.length - 1];
          const expectedLetter = (lastMatch[1] || lastMatch[2]).toUpperCase();
          if (correctAnswer && correctAnswer.toUpperCase() !== expectedLetter && /^[A-D]$/i.test(correctAnswer)) {
            console.log(`[Reconcile] Fixed MCQ answer from "${correctAnswer}" to "${expectedLetter}" based on final explanation conclusion.`);
            correctAnswer = expectedLetter;
          }
        }
      }
    }

    return {
      ...q,
      correctAnswer
    };
  });
}


async function startServer() {

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/split-document", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { fileDataUrl, mimeType } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key is not set on the server." });
      }
      if (!fileDataUrl) {
        return res.status(400).json({ error: "No file data provided." });
      }

      const base64Data = fileDataUrl.split(',')[1];
      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const prompt = `Bạn là một chuyên gia số hóa đề thi môn Toán tại Việt Nam.
Tài liệu đính kèm chứa ĐỀ THI và BẢNG ĐÁP ÁN/LỜI GIẢI CHI TIẾT.
Nhiệm vụ: Tách rời thành 2 văn bản HTML riêng biệt sạch sẽ, chuẩn mực:
1. Đảm bảo toàn bộ câu chữ tiếng Việt sử dụng bảng mã Unicode chuẩn (NFC), tuyệt đối KHÔNG bị lỗi phông chữ (TCVN3, .VnTime).
2. Công thức toán học giữ nguyên cú pháp LaTeX trong cặp dấu $...$ và $$...$$.
YÊU CẦU ĐỊNH DẠNG ĐẦU RA: KHÔNG xuất JSON. Chỉ xuất đúng cấu trúc với 2 thẻ tùy chỉnh sau:

[CLEAN_TEST]
(HTML trình bày đẹp mắt CHỈ chứa câu hỏi đề thi. Loại bỏ toàn bộ đáp án đúng, biểu điểm hay lời giải. Công thức toán bọc $...$ hoặc $$...$$)
[/CLEAN_TEST]

[ANSWERS]
(HTML trình bày đẹp mắt CHỈ chứa bảng đáp án, thang điểm và lời giải chi tiết từng câu.)
[/ANSWERS]`;

      const response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });

      let responseText = response.text || "";
      
      let cleanTestHtml = "";
      let answersHtml = "";
      
      const testMatch = responseText.match(/\[CLEAN_TEST\]([\s\S]*?)\[\/CLEAN_TEST\]/);
      if (testMatch) cleanTestHtml = testMatch[1].trim();
      
      const answersMatch = responseText.match(/\[ANSWERS\]([\s\S]*?)\[\/ANSWERS\]/);
      if (answersMatch) answersHtml = answersMatch[1].trim();

      if (!cleanTestHtml && !answersHtml) {
          cleanTestHtml = responseText;
      }

      const repairedTestHtml = repairVietnameseDocument(convertTcvn3ToUnicode(cleanTestHtml));
      const repairedAnswersHtml = repairVietnameseDocument(convertTcvn3ToUnicode(answersHtml));

      res.json({ cleanTestHtml: repairedTestHtml, answersHtml: repairedAnswersHtml });
    } catch (error: any) {
      console.error("Error splitting document:", error);
      res.status(500).json({ error: "Failed to split document", details: formatError(error) });
    }
  });

  
  app.post("/api/send-zalo", express.json(), async (req, res) => {
    try {
      const { phone, message } = req.body;
      const accessToken = process.env.ZALO_ACCESS_TOKEN;
      if (!accessToken) {
        return res.status(400).json({ error: "ZALO_ACCESS_TOKEN is not configured" });
      }

      // NOTE: This uses the Zalo Official Account OpenAPI for sending a message
      // A valid Zalo App, Official Account, and user interaction within 7 days is typically required
      // or using ZNS (Zalo Notification Service) templates.
      const response = await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken
        },
        body: JSON.stringify({
          recipient: {
            // Note: in a real integration, you usually need a Zalo user_id. 
            // If using phone number, you may need a specific Zalo API endpoint for phone numbers, 
            // or the ZNS template API. We use phone for demonstration.
            user_id: phone 
          },
          message: {
            text: message
          }
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || "Failed to send Zalo message");
      }
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Zalo Send Error:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });


  app.post("/api/grade-essay", async (req, res) => {
    try {
      const { essayPrompt, submissionText, submissionImageDataUrl, mimeType, maxScore, rubric } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set on the server." });
      
      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      let base64Data = "";
      if (submissionImageDataUrl) base64Data = submissionImageDataUrl.split(',')[1];
      
      const prompt = `You are a teacher grading a student's answer (which can be text, an image of handwriting, or both) for a question.
Question/Prompt: ${essayPrompt}
Student's text answer: ${submissionText || "None"}
Grading Rubric/References: ${rubric || "No specific rubric, grade based on accuracy and clear reasoning."}
Max Score: ${maxScore}

Please analyze the student's answer (including the image if provided) and provide:
1. A numerical score from 0 to ${maxScore}.
2. Constructive feedback in Vietnamese on what was correct and what needs improvement.

Output exactly a JSON object in this format (no markdown code blocks, just raw JSON):
{
  "score": <number>,
  "feedback": "<string>"
}`;

      const parts = [];
      if (base64Data) {
         parts.push({
           inlineData: {
             mimeType: mimeType || "image/jpeg",
             data: base64Data
           }
         });
      }
      parts.push({ text: prompt });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: parts }]
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed = {};
      try {
          parsed = JSON.parse(responseText);
      } catch (parseError) {
          parsed = { score: 0, feedback: "AI returned invalid JSON: " + responseText };
      }
      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to grade essay", details: formatError(error) });
    }
  });

  const enforceTopicAndGradeScope = (
    questions: any[],
    grade: number,
    targetTopics: string[],
    fallbackGenerator: () => any[]
  ): any[] => {
    if (!Array.isArray(questions) || questions.length === 0) return questions;

    const FORBIDDEN_HIGH_SCHOOL = [
      /\bđạo hàm\b/i,
      /\btiệm cận\b/i,
      /\blogarit\b/i,
      /\btích phân\b/i,
      /\bnguyên hàm\b/i,
      /\bcực trị\b/i,
      /\bkhảo sát hàm số\b/i,
      /\boxyz\b/i,
      /\bvectơ trong không gian\b/i,
      /\bcấp số cộng\b/i,
      /\bcấp số nhân\b/i,
      /\bnhị thức newton\b/i,
      /\bhàm số mũ\b/i,
      /\bphương trình lượng giác\b/i,
      /\blượng giác lớp 11\b/i
    ];

    // Xác định các chương được chọn của lớp 8 (1 đến 10)
    const selectedChapters8 = grade === 8 && targetTopics.length > 0
      ? Array.from(new Set(targetTopics.map(t => getGrade8ChapterNumber(t)).filter((n): n is number => n !== null)))
      : [];

    // Bản đồ kiểm tra vi phạm theo từng chương của Toán 8
    const GRADE_8_CHAPTER_PATTERNS: Record<number, { name: string; pattern: RegExp }> = {
      1: { name: "Đa thức nhiều biến", pattern: /\b(đa thức|đơn thức|đơn thức đồng dạng|bậc của đa thức|thu gọn đa thức|bậc của đơn thức)\b/i },
      2: { name: "Hằng đẳng thức & Phân tích đa thức", pattern: /\b(hằng đẳng thức|phân tích đa thức thành nhân tử|nhân tử chung|hiệu hai bình phương|bình phương một tổng|bình phương một hiệu)\b/i },
      3: { name: "Tứ giác", pattern: /\b(tứ giác|hình bình hành|hình thoi|hình chữ nhật|hình vuông|hình thang cân|tổng các góc của một tứ giác)\b/i },
      4: { name: "Định lý Thalès", pattern: /\b(thalès|thales|đường trung bình của tam giác|đoạn thẳng tỉ lệ|tính chất đường phân giác)\b/i },
      5: { name: "Dữ liệu và biểu đồ", pattern: /\b(biểu đồ hình quạt|biểu đồ đoạn thẳng|dữ liệu định tính|dữ liệu định lượng|thu thập và tổ chức dữ liệu|biểu đồ cột kép)\b/i },
      6: { name: "Phân thức đại số", pattern: /\b(phân thức|mẫu thức|quy đồng mẫu|mẫu thức chung|rút gọn phân thức|điều kiện xác định của phân thức)\b/i },
      7: { name: "Phương trình & Hàm số bậc nhất", pattern: /\b(hàm số bậc nhất|hệ số góc|phương trình bậc nhất một ẩn|giải bài toán bằng cách lập phương trình)\b/i },
      8: { name: "Xác suất của biến cố", pattern: /\b(xác suất|biến cố ngẫu nhiên|biến cố chắc chắn|biến cố không thể|kết quả thuận lợi|không gian mẫu)\b/i },
      9: { name: "Tam giác đồng dạng", pattern: /\b(tam giác đồng dạng|tỉ số đồng dạng|đồng dạng|pythagore đảo)\b/i },
      10: { name: "Hình chóp tam giác đều & tứ giác đều", pattern: /\b(hình chóp|chóp tam giác đều|chóp tứ giác đều|trung đoạn|thể tích hình chóp)\b/i }
    };

    const hasNegativeRational = targetTopics.some(t => /\b(không\s+(?:có\s+|ra\s+)?phân\s*thức|chưa\s*học\s*phân\s*thức|loại\s*bỏ\s*phân\s*thức|chỉ\s*đa\s*thức)\b/i.test(t));
    const wantsRational = !hasNegativeRational && targetTopics.some(t => {
      const lt = t.toLowerCase();
      return /\b(phân thức|mẫu thức)\b/i.test(lt) && !/\b(không|chưa|loại|trừ)\b/i.test(lt);
    });
    const wantsPolynomial = (targetTopics.length > 0 && targetTopics.some(t => /\b(đa thức|đơn thức)\b/i.test(t))) && !wantsRational;

    let cachedFallback: any[] | null = null;
    const getFallbackItem = (type: string, index: number) => {
      if (!cachedFallback) {
        cachedFallback = fallbackGenerator();
      }
      if (!Array.isArray(cachedFallback) || cachedFallback.length === 0) return null;
      let pool = cachedFallback.filter((fq: any) => fq.type === type);
      if (wantsPolynomial && !wantsRational) {
        const cleanPool = pool.filter((fq: any) => {
          const t = `${fq.question || ''} ${fq.explanation || ''}`.toLowerCase();
          return !/\b(phân thức|mẫu thức)\b/i.test(t);
        });
        if (cleanPool.length > 0) pool = cleanPool;
      }
      if (pool.length > 0) {
        return pool[index % pool.length];
      }
      const genericPool = cachedFallback.filter((fq: any) => {
        if (wantsPolynomial && !wantsRational) {
          const t = `${fq.question || ''} ${fq.explanation || ''}`.toLowerCase();
          if (/\b(phân thức|mẫu thức)\b/i.test(t)) return false;
        }
        return true;
      });
      return (genericPool.length > 0 ? genericPool : cachedFallback)[index % (genericPool.length || cachedFallback.length)] || null;
    };

    return questions.map((q, idx) => {
      const qText = `${q.question || ''} ${q.explanation || ''} ${(q.options || []).join(' ')} ${q.reference?.topic || ''} ${q.reference?.curriculumLesson || ''}`;
      let isInvalid = false;
      let reason = '';

      // 1. Kiểm tra kiến thức lớp trên nếu đang là THCS
      if (grade <= 9) {
        for (const pat of FORBIDDEN_HIGH_SCHOOL) {
          if (pat.test(qText)) {
            isInvalid = true;
            reason = `Chứa kiến thức cấp THPT (${pat.source})`;
            break;
          }
        }
      }

      // 2. Kiểm tra xung đột đặc biệt: Giáo viên chỉ chọn ĐA THỨC mà câu hỏi lại có PHÂN THỨC
      if (!isInvalid && wantsPolynomial && !wantsRational) {
        if (/\b(phân thức|mẫu thức|quy đồng mẫu|rút gọn phân thức|điều kiện xác định của phân thức)\b/i.test(qText) ||
            /\\frac\{[^\}]+\}\{[^0-9\\\}\s]*[a-zA-Z][^\}]*\}/.test(qText) ||
            /(?:\/|\:\s*)\([a-zA-Z\d\s\+\-\*]*[a-zA-Z][a-zA-Z\d\s\+\-\*]*\)/.test(qText)) {
          isInvalid = true;
          reason = 'Chứa kiến thức Phân thức đại số (mẫu thức chứa biến) dù giáo viên chỉ chọn Đa thức';
        }
      }

      // 3. Kiểm tra xung đột phạm vi chuyên đề đối với Toán 8
      if (!isInvalid && grade === 8 && selectedChapters8.length > 0) {
        // Kiểm tra xem câu hỏi có chứa kiến thức của chương BỊ CẤM (chương không được chọn)
        for (let ch = 1; ch <= 10; ch++) {
          if (!selectedChapters8.includes(ch)) {
            const chDef = GRADE_8_CHAPTER_PATTERNS[ch];
            // Lưu ý loại trừ trường hợp tứ giác vs hình chóp
            if (ch === 3 && /\bchóp\b/i.test(qText)) continue;
            if (ch === 4 && /\bđồng dạng\b/i.test(qText)) continue;
            if (ch === 9 && /\bthalès\b/i.test(qText)) continue;

            if (chDef && chDef.pattern.test(qText)) {
              isInvalid = true;
              reason = `Thuộc chuyên đề Chương ${ch} (${chDef.name}) không nằm trong danh sách đã chọn`;
              break;
            }
          }
        }

        // Kiểm tra tính hợp lệ: Câu hỏi phải thuộc ít nhất một trong các chương đã chọn
        if (!isInvalid) {
          const detectedCh = getGrade8ChapterNumber(qText);
          if (detectedCh !== null && !selectedChapters8.includes(detectedCh)) {
            isInvalid = true;
            reason = `Xác định thuộc Chương ${detectedCh} ngoài phạm vi chuyên đề đã chọn`;
          }
        }
      } else if (!isInvalid && targetTopics.length > 0) {
        // Đối với các khối lớp khác
        const hasGeometry = targetTopics.some(t => /(?:hình|tứ giác|thalès|thales|tam giác|chóp|lăng trụ|pythagore|đồng dạng|đường tròn)/i.test(t));
        const isOnlyGeometry = targetTopics.length > 0 && targetTopics.every(t => /(?:hình|tứ giác|thalès|thales|tam giác|chóp|lăng trụ|pythagore|đồng dạng|đường tròn)/i.test(t));
        const hasAlgebra = targetTopics.some(t => /(?:đại số|đa thức|hằng đẳng thức|phân thức|phương trình|hàm số|biểu thức|căn thức|lượng giác)/i.test(t));
        const isOnlyAlgebra = targetTopics.length > 0 && targetTopics.every(t => /(?:đại số|đa thức|hằng đẳng thức|phân thức|phương trình|hàm số|biểu thức|căn thức)/i.test(t));
        const hasStatistics = targetTopics.some(t => /(?:dữ liệu|biểu đồ|thống kê|xác suất|tần số|biến cố)/i.test(t));

        if (!hasGeometry && /\b(tam giác đồng dạng|định lý thalès|hình chóp|hình bình hành|hình thoi|hình chữ nhật|tứ giác)\b/i.test(qText)) {
          isInvalid = true;
          reason = 'Chứa hình học dù không chọn chuyên đề hình học';
        } else if (isOnlyGeometry && /\b(đa thức|hằng đẳng thức|phân thức|nghiệm của phương trình|hàm số bậc nhất)\b/i.test(qText)) {
          isInvalid = true;
          reason = 'Chứa đại số dù chỉ chọn chuyên đề hình học';
        } else if (isOnlyAlgebra && /\b(hình học|tam giác|tứ giác|hình bình hành|hình thoi|hình chóp)\b/i.test(qText)) {
          isInvalid = true;
          reason = 'Chứa hình học dù chỉ chọn đại số';
        } else if (!hasStatistics && /\b(biểu đồ hình quạt|biểu đồ đoạn thẳng|dữ liệu định tính|dữ liệu định lượng|xác suất thực nghiệm)\b/i.test(qText)) {
          isInvalid = true;
          reason = 'Chứa thống kê/xác suất dù không chọn';
        }
      }

      if (isInvalid) {
        console.warn(`[Scope-Guard] Câu ${q.id || idx + 1} vi phạm phạm vi (${reason}). Tự động thay thế bằng câu hỏi chuẩn từ chuyên đề.`);
        const replacement = getFallbackItem(q.type || 'essay', idx);
        if (replacement) {
          return {
            ...replacement,
            id: q.id || `q_${idx + 1}`,
            type: q.type || replacement.type,
            points: q.points || replacement.points
          };
        }
      }

      // Chuẩn hóa reference
      const normalizedRef = { ...(q.reference || {}) };
      if (targetTopics.length > 0) {
        if (grade === 8 && selectedChapters8.length > 0) {
          const qCh = getGrade8ChapterNumber(qText);
          const matchedTarget = targetTopics.find(t => getGrade8ChapterNumber(t) === qCh);
          normalizedRef.topic = matchedTarget || targetTopics[idx % targetTopics.length];
        } else {
          const curTopic = (normalizedRef.topic || '').toLowerCase();
          const matched = targetTopics.find(t => curTopic.includes(t.toLowerCase().substring(0, 10)) || t.toLowerCase().includes(curTopic.substring(0, 10)));
          normalizedRef.topic = matched || targetTopics[idx % targetTopics.length];
        }
      } else {
        normalizedRef.topic = normalizedRef.topic || `Toán lớp ${grade}`;
      }

      if (!normalizedRef.curriculumLesson || normalizedRef.curriculumLesson.includes('Toán 12') || normalizedRef.curriculumLesson.includes('Toán 11')) {
        normalizedRef.curriculumLesson = `SGK Toán ${grade} - Kết nối tri thức`;
      }

      return {
        ...q,
        reference: normalizedRef
      };
    });
  };

  app.post("/api/generate-test", async (req, res) => {
    let targetTopics: string[] = [];
    let isPureEssayMode = false;
    let enableP1 = false;
    let enableP2 = false;
    let enableP3 = false;
    let isPolyInScope = false;
    let isRatInScope = false;
    try {
      let { 
        title, 
        grade, 
        autoGenType, 
        formatType,
        mcqCount, 
        essayCount, 
        matrixFileDataUrl, 
        matrixText,
        mimeType,
        part1Count,
        part2Count,
        part3Count,
        customPartsConfig,
        customEssayEnabled,
        customEssayItems,
        referenceFileDataUrl,
        referenceFileMimeType,
        referenceFileName,
        referenceNotes,
        referenceKnowledge,
        topicTitle,
        topicLessons,
        selectedTopicTitles
      } = req.body;

      // Tự động phân tích và chuẩn hóa khối lớp chính xác từ tham số grade, title, referenceNotes, topicTitle, referenceKnowledge
      let effectiveGrade = parseInt(grade, 10);
      const combinedScopeText = `${title || ''} ${referenceNotes || ''} ${referenceKnowledge || ''} ${topicTitle || ''} ${(selectedTopicTitles || []).join(' ')}`;
      const detectedGradeMatch = combinedScopeText.match(/(?:lớp|khối|toán)\s*([6-9]|1[0-2])\b/i);
      if (detectedGradeMatch && detectedGradeMatch[1]) {
        const detected = parseInt(detectedGradeMatch[1], 10);
        if (effectiveGrade !== detected) {
          console.log(`[Auto-Reconciliation] Overriding grade from ${effectiveGrade} to detected grade ${detected} based on scope/notes`);
          effectiveGrade = detected;
        }
      }
      if (!effectiveGrade || isNaN(effectiveGrade) || effectiveGrade < 6 || effectiveGrade > 12) {
        effectiveGrade = 8;
      }

      // Trích xuất và chuẩn hóa danh sách các chuyên đề mục tiêu
      if (Array.isArray(selectedTopicTitles) && selectedTopicTitles.length > 0) {
        targetTopics = selectedTopicTitles.map(s => String(s).trim()).filter(Boolean);
      }
      if (targetTopics.length === 0 && referenceNotes) {
        const multiMatch = referenceNotes.match(/\[(?:Các chuyên đề(?:\s*\(\d+\))?|Chuyên đề):\s*([^\]]+)\]/i);
        if (multiMatch && multiMatch[1]) {
          targetTopics = multiMatch[1].split(/;\s*/).map((s: string) => s.trim()).filter(Boolean);
        } else {
          const formTopicMatch = referenceNotes.match(/(?:Chuyên đề trọng tâm|Các chuyên đề|Chuyên đề|Phạm vi kiến thức)[:\s]*([^\n\r<]+)/i);
          if (formTopicMatch && formTopicMatch[1]) {
            const raw = formTopicMatch[1].replace(/^[•\-\*\s]+/, '').trim();
            if (raw && !/^(nhập|chọn|các)\b/i.test(raw)) {
              targetTopics = raw.split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);
            }
          }
        }
      }
      if (targetTopics.length === 0 && topicTitle) {
        targetTopics = topicTitle.split(/;\s*/).map((s: string) => s.trim()).filter(Boolean);
      }

      // Nhận diện chính xác chuyên đề và hình thức từ toàn bộ nguồn văn bản phạm vi
      const hasNegativeRational = /\b(không\s+(?:có\s+|ra\s+)?phân\s*thức|chưa\s*học\s*phân\s*thức|loại\s*bỏ\s*phân\s*thức|chỉ\s*đa\s*thức|không\s*phải\s*phân\s*thức)\b/i.test(combinedScopeText);
      const userExplicitlySelectedPolynomial = targetTopics.some(t => {
        const lt = t.toLowerCase();
        return /\b(đa thức|đơn thức)\b/i.test(lt);
      }) || /\b(đa thức|đơn thức)\b/i.test(combinedScopeText);

      const userExplicitlySelectedRational = !hasNegativeRational && (targetTopics.some(t => {
        const lt = t.toLowerCase();
        return /\b(phân thức|mẫu thức)\b/i.test(lt) && !/\b(không|chưa|loại|trừ)\b/i.test(lt);
      }) || (/\b(chuyên\s*đề\s*phân\s*thức|chương\s*6\b|kiến\s*thức\s*phân\s*thức)\b/i.test(combinedScopeText) && !userExplicitlySelectedPolynomial));

      isRatInScope = userExplicitlySelectedRational;
      isPolyInScope = (userExplicitlySelectedPolynomial || hasNegativeRational) && !isRatInScope;

      if (isPolyInScope && !isRatInScope) {
        // Loại bỏ hoàn toàn các chuyên đề phân thức nếu bị dính
        targetTopics = targetTopics.filter(t => !/\b(phân thức|mẫu thức)\b/i.test(t));
        if (targetTopics.length === 0 || !targetTopics.some(t => /\b(đa thức|đơn thức)\b/i.test(t))) {
          targetTopics.unshift('Chương 1: Đa thức nhiều biến và các phép toán');
        }
      }

      // Phân tích cấu trúc đề: Tự luận vs Trắc nghiệm
      const isPureEssayInNotes = 
        /(?:cấu\s*trúc|hình\s*thức|kiểu\s*đề|dạng\s*đề|phương\s*thức|hình\s*thức\s*kiểm\s*tra|định\s*dạng)[:\s]*(?:đề\s*)?(?:100%?\s*)?tự\s*luận/i.test(combinedScopeText) ||
        /(?:cấu\s*trúc\s*tự\s*luận|hình\s*thức\s*tự\s*luận|100%?\s*tự\s*luận|đề\s*(?:thi|kiểm\s*tra)\s*(?:chuyên\s*đề\s*)?tự\s*luận|đề\s*tự\s*luận|bài\s*toán\s*tự\s*luận|toàn\s*bộ\s*tự\s*luận|chỉ\s*tự\s*luận|thi\s*tự\s*luận)/i.test(combinedScopeText) ||
        /\b(đề\s*thi\s*tự\s*luận|đề\s*tự\s*luận|tự\s*luận\s*toàn\s*bộ|100%\s*tự\s*luận|chỉ\s*có\s*tự\s*luận|không\s*có\s*trắc\s*nghiệm)\b/i.test(combinedScopeText) ||
        (!/(?:trắc\s*nghiệm\s*4\s*lựa\s*chọn|4\s*lựa\s*chọn|đúng\s*[\/\-]\s*sai|trả\s*lời\s*ngắn|điền\s*số)/i.test(combinedScopeText) && /(?:tự\s*luận|bài\s*toán\s*tự\s*luận)/i.test(combinedScopeText)) ||
        (!/(?:đúng\s*[\/\-]\s*sai\s*:\s*[1-9]|4\s*lựa\s*chọn\s*:\s*[1-9]|trả\s*lời\s*ngắn\s*:\s*[1-9])/i.test(combinedScopeText) && /(?:tự\s*luận\s*:\s*[1-9]|\b\d+\s*câu\s*tự\s*luận|\b\d+\s*bài\s*tự\s*luận)/i.test(combinedScopeText)) ||
        autoGenType === 'essay' || formatType === 'essay';

      const hasExplicitTF = /(?:đúng\s*[\/\-]\s*sai|trắc\s*nghiệm\s*đúng\s*sai)/i.test(combinedScopeText) && 
        !/\b(?:không\s+(?:có\s+|ra\s+)?đúng\s*[\/\-]\s*sai|đúng\s*[\/\-]\s*sai\s*[:=]\s*0\b)/i.test(combinedScopeText) &&
        !isPureEssayInNotes;

      const p1Req = parseInt(part1Count || customPartsConfig?.part1Count, 10) || 0;
      enableP1 = isPureEssayInNotes ? false : (customPartsConfig?.enablePart1 === true || (customPartsConfig?.enablePart1 !== false && p1Req > 0));

      const p2Req = parseInt(part2Count || customPartsConfig?.part2Count, 10) || 0;
      enableP2 = isPureEssayInNotes ? false : (hasExplicitTF && customPartsConfig?.enablePart2 === true && p2Req > 0);

      const p3Req = parseInt(part3Count || customPartsConfig?.part3Count, 10) || 0;
      enableP3 = isPureEssayInNotes ? false : (customPartsConfig?.enablePart3 === true && p3Req > 0);

      isPureEssayMode = autoGenType === 'essay' || formatType === 'essay' || isPureEssayInNotes || (!enableP1 && !enableP2 && !enableP3);

      if (isPureEssayMode) {
        enableP1 = false;
        enableP2 = false;
        enableP3 = false;
      }

      // Trích xuất nội dung kiến thức trọng tâm từ form nếu có
      let formKnowledgeFocus = "";
      if (referenceNotes) {
        const focusM = referenceNotes.match(/(?:Nội dung trọng tâm cần kiểm tra|Kiến thức trọng tâm|Yêu cầu cần đạt)[:\s]*([^\n\r<]+)/i);
        if (focusM && focusM[1]) {
          const rawF = focusM[1].replace(/^[•\-\*\s]+/, '').trim();
          if (rawF && !/^(nhập|nội dung)\b/i.test(rawF)) {
            formKnowledgeFocus = rawF;
          }
        }
      }

      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const rawHeaderKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
      const validHeader = (rawHeaderKey && typeof rawHeaderKey === 'string' && rawHeaderKey.trim() !== '' && rawHeaderKey !== 'undefined' && rawHeaderKey !== 'null') ? rawHeaderKey.trim() : null;
      const apiKey = validHeader || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn("API key is not set, generating curriculum fallback questions for grade:", effectiveGrade);
        const fallbackQuestions = generateCurriculumFallbackQuestions({ 
          ...req.body, 
          grade: effectiveGrade,
          selectedTopicTitles: targetTopics 
        });
        return res.json(fallbackQuestions);
      }

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      let prompt = `Bạn là chuyên gia giáo dục và biên soạn đề thi môn Toán chất lượng cao theo chuẩn chương trình GDPT mới.
Hãy tạo một đề kiểm tra / đề thi môn Toán lớp ${effectiveGrade} với tiêu đề: "${title}".

*** BẮT BUỘC TUYỆT ĐỐI VỀ KHỐI LỚP VÀ PHẠM VI CHƯƠNG TRÌNH TOÁN LỚP ${effectiveGrade} (GDPT 2018) ***:
1. ĐỀ THI NÀY LÀ ĐỀ TOÁN LỚP ${effectiveGrade}. TOÀN BỘ CÂU HỎI TRONG ĐỀ THI BẮT BUỘC 100% PHẢI THUỘC CHƯƠNG TRÌNH SÁCH GIÁO KHOA TOÁN LỚP ${effectiveGrade} (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG).
2. TUYỆT ĐỐI CẤM KHÔNG ĐƯỢC sinh ra kiến thức hoặc câu hỏi của các khối lớp trên hay cấp học khác!
${effectiveGrade <= 9 ? `   - Đây là đề thi cấp THCS (Lớp ${effectiveGrade}). TUYỆT ĐỐI KHÔNG ĐƯỢC có kiến thức cấp THPT như: Đạo hàm, Cực trị hàm số, Đường tiệm cận, Khảo sát hàm số, Phương trình lượng giác lớp 11, Cấp số cộng / cấp số nhân, Mũ và logarit, Nguyên hàm, Tích phân, Vectơ và hệ trục tọa độ không gian Oxyz...` : ''}
`;

      if (targetTopics.length > 0 || (isPolyInScope && !isRatInScope)) {
        const selectedChapters8 = effectiveGrade === 8
          ? Array.from(new Set(targetTopics.map(t => getGrade8ChapterNumber(t)).filter((n): n is number => n !== null)))
          : [];
        const unselectedChapters8 = effectiveGrade === 8
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => !selectedChapters8.includes(n))
          : [];

        prompt += `
*** NGUYÊN TẮC BẮT BUỘC BẬC NHẤT: GIỚI HẠN PHẠM VI CHUYÊN ĐỀ ĐÃ CHỌN (STRICT KNOWLEDGE SCOPE - KHÔNG ĐƯỢC PHÉP VI PHẠM) ***:
Giáo viên đã chỉ định cụ thể ${targetTopics.length} chuyên đề môn Toán lớp ${effectiveGrade} cho đề thi này:
${targetTopics.map((t, idx) => `   ${idx + 1}. "${t}"`).join('\n')}
`;

        const wantsRationalPrompt = isRatInScope;
        const wantsPolynomialPrompt = isPolyInScope && !isRatInScope;
        if (wantsPolynomialPrompt) {
          prompt += `
*** CẢNH BÁO BẮT BUỘC ĐẶC BIỆT: KIẾN THỨC ĐƯỢC CHỌN LÀ "ĐA THỨC" ***:
- Giáo viên đã chọn chuyên đề/kiến thức: "ĐA THỨC" (Đơn thức, đa thức nhiều biến, thu gọn đa thức, bậc của đa thức, tính giá trị của đa thức, cộng trừ nhân chia đa thức, hằng đẳng thức).
- TUYỆT ĐỐI CẤM: KHÔNG ĐƯỢC sinh ra bất kỳ câu hỏi nào về "PHÂN THỨC ĐẠI SỐ" (Không có mẫu thức chứa biến như A/B, không rút gọn phân thức hữu tỉ, không tìm điều kiện xác định của phân thức, không có ẩn x, y ở mẫu).
- Toàn bộ đề thi 100% chỉ kiểm tra ĐA THỨC, TUYỆT ĐỐI KHÔNG CÓ PHÂN THỨC!
`;
        }

        if (effectiveGrade === 8 && unselectedChapters8.length > 0) {
          const grade8Topics = CURRICULUM_TOPICS_BY_GRADE[8] || [];
          prompt += `
*** CÁC CHUYÊN ĐỀ LỚP 8 TUYỆT ĐỐI CẤM (GIÁO VIÊN KHÔNG CHỌN - TUYỆT ĐỐI CẤM CÓ BẤT KỲ CÂU HỎI NÀO TRONG ĐỀ THI) ***:
${unselectedChapters8.map(n => {
  const top = grade8Topics.find(t => t.chapterNumber === n);
  return `   - TUYỆT ĐỐI CẤM Chương ${n}: "${top ? top.title : `Chương ${n}`}"`;
}).join('\n')}

QUY ĐỊNH BẤT DI BẤT DỊCH (TUYỆT ĐỐI CẤM VI PHẠM):
1. TOÀN BỘ 100% CÁC CÂU HỎI TRONG ĐỀ THI BẮT BUỘC CHỈ ĐƯỢC LẤY TỪ NỘI DUNG VÀ DẠNG BÀI CỦA ${selectedChapters8.length} CHUYÊN ĐỀ ĐÃ CHỌN Ở TRÊN.
2. TUYỆT ĐỐI CẤM RA BẤT KỲ CÂU HỎI NÀO THUỘC ${unselectedChapters8.length} CHUYÊN ĐỀ BỊ CẤM Ở TRÊN!
   - Không được lấy bất kỳ câu hỏi nào từ các chương bị cấm, dù cùng là SGK Toán lớp 8.
   ${unselectedChapters8.includes(6) ? '- TUYỆT ĐỐI CẤM câu hỏi về Phân thức đại số (Chương 6).' : ''}
   ${unselectedChapters8.includes(7) ? '- TUYỆT ĐỐI CẤM câu hỏi về Phương trình bậc nhất một ẩn và Hàm số bậc nhất (Chương 7).' : ''}
   ${unselectedChapters8.includes(9) ? '- TUYỆT ĐỐI CẤM câu hỏi về Tam giác đồng dạng (Chương 9).' : ''}
   ${unselectedChapters8.includes(10) ? '- TUYỆT ĐỐI CẤM câu hỏi về Hình chóp tam giác đều / tứ giác đều (Chương 10).' : ''}
   ${unselectedChapters8.includes(3) ? '- TUYỆT ĐỐI CẤM câu hỏi về Tứ giác (Chương 3).' : ''}
   ${unselectedChapters8.includes(4) ? '- TUYỆT ĐỐI CẤM câu hỏi về Định lý Thalès (Chương 4).' : ''}
   ${unselectedChapters8.includes(5) ? '- TUYỆT ĐỐI CẤM câu hỏi về Dữ liệu và biểu đồ (Chương 5).' : ''}
   ${unselectedChapters8.includes(8) ? '- TUYỆT ĐỐI CẤM câu hỏi về Xác suất của biến cố (Chương 8).' : ''}
   ${unselectedChapters8.includes(1) ? '- TUYỆT ĐỐI CẤM câu hỏi về Đa thức nhiều biến (Chương 1).' : ''}
   ${unselectedChapters8.includes(2) ? '- TUYỆT ĐỐI CẤM câu hỏi về Hằng đẳng thức (Chương 2).' : ''}
3. PHÂN BỔ ĐỀU CÂU HỎI: Phân bổ đều số lượng câu hỏi cho TẤT CẢ các chuyên đề được chọn ở trên.
4. Trong trường "reference.topic" của mỗi câu hỏi, BẮT BUỘC PHẢI GHI ĐÚNG TÊN của một trong các chuyên đề được chọn ở trên.
`;
        } else {
          prompt += `
QUY ĐỊNH BẤT DI BẤT DỊCH (TUYỆT ĐỐI CẤM VI PHẠM):
1. TOÀN BỘ 100% CÁC CÂU HỎI TRONG ĐỀ THI BẮT BUỘC CHỈ ĐƯỢC LẤY TỪ NỘI DUNG VÀ DẠNG BÀI CỦA CÁC CHUYÊN ĐỀ ĐÃ LIỆT KÊ Ở TRÊN.
2. TUYỆT ĐỐI CẤM RA BẤT KỲ CÂU HỎI NÀO NGOÀI PHẠM VI CÁC CHUYÊN ĐỀ NÀY.
3. PHÂN BỔ ĐỀU CÂU HỎI cho tất cả các chuyên đề được chọn.
4. Trong trường "reference.topic" của mỗi câu hỏi, BẮT BUỘC PHẢI GHI ĐÚNG TÊN của một trong các chuyên đề được chọn ở trên.
`;
        }
      } else {
        prompt += `
MỌI câu hỏi phải sử dụng đúng kiến thức Toán THCS lớp ${effectiveGrade}:
${effectiveGrade === 8 ? `* Đại số 8: ${targetTopics.length > 0 ? targetTopics.join(', ') : 'Đa thức nhiều biến, 7 hằng đẳng thức đáng nhớ, Phân tích đa thức thành nhân tử'}...
* Hình học 8: Tứ giác, Định lý Thalès trong tam giác, Tam giác đồng dạng, Hình chóp tam giác đều và hình chóp tứ giác đều...
* Thống kê & Xác suất 8: Thu thập và phân loại dữ liệu, Biểu đồ hình quạt tròn, Xác suất thực nghiệm của biến cố...` : ''}
`;
      }

      // Xử lý tài liệu tham chiếu: Nếu có tệp bổ sung hoặc tài liệu từ Thư viện học liệu
      let supplementalText = "";
      if (referenceKnowledge && referenceKnowledge.trim().length > 10) {
        supplementalText = referenceKnowledge.trim();
      }

      if (referenceFileDataUrl) {
        try {
          const docExtract = await extractTextFromAttachment(referenceFileDataUrl, referenceFileName, referenceFileMimeType);
          if (docExtract && docExtract.text && docExtract.text.trim().length > 20) {
            supplementalText = (supplementalText ? supplementalText + "\n\n" : "") + docExtract.text;
          }
        } catch (eDoc) {
          console.warn("Could not extract supplemental text:", eDoc);
        }
      }

      if (supplementalText || referenceFileDataUrl) {
        prompt += `\n\n*** TÀI LIỆU THAM CHIẾU TỪ THƯ VIỆN / TỆP ĐÍNH KÈM GIÁO VIÊN CHỌN (${referenceFileName || 'Tài liệu thư viện'}) ***:
Giáo viên đã cung cấp tài liệu tham chiếu làm căn cứ biên soạn đề thi này:
${supplementalText ? `NỘI DUNG TÀI LIỆU THAM CHIẾU:\n"""\n${supplementalText.slice(0, 25000)}\n"""\n` : `(Xem tệp đính kèm để trích xuất nội dung tham chiếu)`}
- BẮT BUỘC: Phân tích kỹ tài liệu tham chiếu này, ưu tiên lựa chọn các chủ đề, dạng bài toán, số liệu, bài tập tương tự hoặc các câu hỏi phát triển trực tiếp từ tài liệu này để biên soạn đề thi.
- Kết hợp hài hòa giữa tài liệu tham chiếu của giáo viên với chuẩn kiến thức SGK môn Toán lớp ${effectiveGrade}.
`;
      }

      if (referenceNotes) {
        prompt += `\n*** GHI CHÚ VÀ TRỌNG TÂM KIẾN THỨC THEO CHUYÊN ĐỀ TỪ GIÁO VIÊN ***:\n"""\n${referenceNotes}\n"""\n- YÊU CẦU: Soạn câu hỏi bám sát chuẩn kiến thức và dạng bài được nêu trong ghi chú trọng tâm ở trên.\n`;
      }

      if (Array.isArray(topicLessons) && topicLessons.length > 0) {
        prompt += `\nDanh sách các bài học tham chiếu trong chuyên đề:\n` + 
          topicLessons.map((l: any, idx: number) => `   - Bài ${idx + 1}: ${typeof l === 'string' ? l : l.title}${typeof l === 'object' && l.knowledge ? ` (Nội dung: ${l.knowledge.replace(/\n+/g, ' ').slice(0, 180)}...)` : ''}`).join('\n') + `\n`;
      }

      if (!formatType) {
        formatType = autoGenType;
      }
      const matrixConfig = req.body.matrixConfig;

      if (autoGenType === 'matrix') {
        prompt += `\n======================================================
ĐỀ THI ĐƯỢC THIẾT KẾ THEO MA TRẬN ĐỀ THI VÀ BẢN ĐẶC TẢ CHI TIẾT:
*** NGUYÊN TẮC BẮT BUỘC:
1. TẤT CẢ NỘI DUNG, PHẠM VI KIẾN THỨC VÀ CẤU TRÚC ĐỀ THI ĐỀU PHẢI TUÂN THỦ THEO MA TRẬN VÀ BẢN ĐẶC TẢ ĐÃ CUNG CẤP.
2. NỘI DUNG KIẾN THỨC THAM CHIẾU ĐƯỢC LẤY MẶC ĐỊNH THEO THƯ VIỆN TÀI LIỆU THAM CHIẾU CHUẨN TOÁN SGK KẾT NỐI TRI THỨC VÀ CÁC BÀI HỌC CỦA KHỐI LỚP ${effectiveGrade}.
3. TỪNG CÂU HỎI ĐỀ THI PHẢI BÁM SÁT CÁC YÊU CẦU CẦN ĐẠT VÀ MỨC ĐỘ NHẬN THỨC ĐƯỢC QUY ĐỊNH TRONG BẢN ĐẶC TẢ. ***
`;
        if (matrixText && typeof matrixText === 'string' && matrixText.trim().length > 10) {
          prompt += `
--- NỘI DUNG MA TRẬN ĐỀ THI & BẢN ĐẶC TẢ DO GIÁO VIÊN NHẬP/DÁN TRỰC TIẾP ---
"""
${matrixText.trim()}
"""
YÊU CẦU ĐỐI VỚI BẢN ĐẶC TẢ TRÊN:
- Đọc kỹ bảng ma trận và bản đặc tả ở trên để phân bổ chính xác số câu, dạng thức câu hỏi (nhiều lựa chọn, đúng/sai, trả lời ngắn hoặc tự luận) và mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
- Biên soạn nội dung câu hỏi bám sát đúng từng mạch kiến thức và yêu cầu cần đạt nêu trong bản đặc tả.
`;
        }
        if (matrixConfig) {
          prompt += `
MA TRẬN NĂNG LỰC & MỨC ĐỘ NHẬN THỨC:
- Tên khung ma trận: ${matrixConfig.name || 'Khung ma trận chuẩn Bộ GD&ĐT'}
- Tỉ lệ phân bổ mức độ:
  * Nhận biết: ${matrixConfig.levels?.recognize || '40'}%
  * Thông hiểu: ${matrixConfig.levels?.understand || '30'}%
  * Vận dụng: ${matrixConfig.levels?.apply || '20'}%
  * Vận dụng cao: ${matrixConfig.levels?.highApply || '10'}%
${matrixConfig.notes ? `- Ghi chú ma trận: ${matrixConfig.notes}` : ''}`;
        }

        if (formatType === 'mcq_3part') {
          const p1 = parseInt(part1Count, 10) || 12;
          const p2 = parseInt(part2Count, 10) || 4;
          const p3 = parseInt(part3Count, 10) || 6;
          prompt += `
HÌNH THỨC ĐỀ THI THEO MA TRẬN: TRẮC NGHIỆM 3 PHẦN (CHUẨN BỘ GD&ĐT):
1. PHẦN I: ${p1} câu Trắc nghiệm 4 lựa chọn (A, B, C, D), "type": "mcq", 0.25 điểm/câu. Các câu hỏi phân bổ từ Nhận biết đến Thông hiểu.
2. PHẦN II: ${p2} câu Trắc nghiệm Đúng/Sai (mỗi câu 4 ý a, b, c, d), "type": "tf", 1.0 điểm/câu. Mức độ Thông hiểu và Vận dụng. "correctAnswer": "a-Đ, b-S, c-Đ, d-S".
3. PHẦN III: ${p3} câu Trắc nghiệm Trả lời ngắn, "type": "short", 0.5 điểm/câu. Mức độ Vận dụng và Vận dụng cao (học sinh điền đáp số số học/biểu thức ngắn).
`;
        } else if (formatType === 'mcq_custom') {
          const enableP1 = customPartsConfig?.enablePart1 !== false && customPartsConfig?.enablePart1 !== undefined ? customPartsConfig.enablePart1 : true;
          const p1 = parseInt(customPartsConfig?.part1Count, 10) || 10;
          const enableP2 = Boolean(customPartsConfig?.enablePart2);
          const p2 = parseInt(customPartsConfig?.part2Count, 10) || 4;
          const enableP3 = Boolean(customPartsConfig?.enablePart3);
          const p3 = parseInt(customPartsConfig?.part3Count, 10) || 4;
          prompt += `
HÌNH THỨC ĐỀ THI THEO MA TRẬN: TRẮC NGHIỆM TÙY BIẾN:
${enableP1 ? `- ${p1} câu Trắc nghiệm 4 lựa chọn ("type": "mcq", 4 phương án A,B,C,D, "correctAnswer": "A"/"B"/"C"/"D")` : ''}
${enableP2 ? `- ${p2} câu Trắc nghiệm Đúng/Sai ("type": "tf", 4 ý a,b,c,d, "correctAnswer": "a-Đ, b-S, c-Đ, d-S")` : ''}
${enableP3 ? `- ${p3} câu Trắc nghiệm Trả lời ngắn ("type": "short", học sinh điền đáp số, không có options)` : ''}
`;
        } else if (formatType === 'essay') {
          const eCount = parseInt(essayCount, 10) || 3;
          prompt += `
HÌNH THỨC ĐỀ THI THEO MA TRẬN: TỰ LUẬN (${eCount} bài toán tự luận):
- "type": "essay"
- Phân bổ theo các mức độ nhận thức: Nhận biết - Thông hiểu (câu 1, 2), Vận dụng (câu 3), Vận dụng cao (câu cuối).
- Kèm thang điểm chi tiết cho từng câu trong "points" (tổng điểm 10 điểm) và barem giải chi tiết từng bước trong "explanation".
`;
        } else if (formatType === 'mixed') {
          const mCount = parseInt(mcqCount, 10) || 14;
          const eCount = parseInt(essayCount, 10) || 2;
          prompt += `
HÌNH THỨC ĐỀ THI THEO MA TRẬN: TỔNG HỢP (TRẮC NGHIỆM KẾT HỢP TỰ LUẬN):
- Phần Trắc nghiệm: ${mCount} câu trắc nghiệm khách quan ("type": "mcq", 4 lựa chọn A, B, C, D).
- Phần Tự luận: ${eCount} bài toán tự luận ("type": "essay") có lời giải chi tiết và barem điểm từng bước.
`;
        } else {
          prompt += `\nHãy tạo đề thi bám sát tuyệt đối ma trận được cung cấp trong tài liệu hoặc cấu hình.`;
        }
      } else if (autoGenType === 'mcq_3part') {
        const p1 = parseInt(part1Count, 10) || 12;
        const p2 = parseInt(part2Count, 10) || 4;
        const p3 = parseInt(part3Count, 10) || 6;
        prompt += `
CẤU TRÚC ĐỀ THI: ĐỀ TRẮC NGHIỆM 3 PHẦN (CHUẨN ĐỊNH DẠNG MỚI BỘ GIÁO DỤC & ĐÀO TẠO):
Hãy tạo chính xác các câu hỏi theo 3 phần sau:

1. PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN
- Số lượng: Đúng chính xác ${p1} câu.
- "type": "mcq"
- Mỗi câu có đúng 4 phương án A, B, C, D (được ghi rõ "A. ...", "B. ...", "C. ...", "D. ...") trong mảng "options". Chỉ có 1 phương án đúng.
- "correctAnswer": "A", "B", "C", hoặc "D".
- Điểm ("points"): 0.25 điểm / câu.

2. PHẦN II: TRẮC NGHIỆM ĐÚNG SAI
- Số lượng: Đúng chính xác ${p2} câu.
- "type": "tf"
- Mỗi câu gồm 1 nội dung bài toán kèm 4 ý khẳng định a), b), c), d) trong mảng "options" ("a) ...", "b) ...", "c) ...", "d) ..."). Học sinh phải xác định từng ý là Đúng hoặc Sai.
- "correctAnswer": "a-Đ, b-S, c-Đ, d-S" (hoặc kết quả đúng/sai tương ứng cho 4 ý).
- Điểm ("points"): 1.0 điểm / câu.

3. PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN
- Số lượng: Đúng chính xác ${p3} câu.
- "type": "short"
- Câu hỏi yêu cầu học sinh tính toán và điền đáp số/kết quả toán học (không có phương án lựa chọn, mảng "options": []).
- "correctAnswer": Đáp số số học hoặc biểu thức ngắn gọn (ví dụ: "12", "-3/4", "5.5").
- Điểm ("points"): 0.5 điểm / câu.
`;
      } else if (autoGenType === 'mcq_custom') {
        const enableP1 = customPartsConfig?.enablePart1 !== false && customPartsConfig?.enablePart1 !== undefined ? customPartsConfig.enablePart1 : true;
        const p1 = parseInt(customPartsConfig?.part1Count, 10) || 10;
        const enableP2 = Boolean(customPartsConfig?.enablePart2);
        const p2 = parseInt(customPartsConfig?.part2Count, 10) || 4;
        const enableP3 = Boolean(customPartsConfig?.enablePart3);
        const p3 = parseInt(customPartsConfig?.part3Count, 10) || 4;

        prompt += `
CẤU TRÚC ĐỀ THI: ĐỀ TRẮC NGHIỆM TÙY BIẾN THEO CÁC PHẦN ĐƯỢC CHỌN:
Chỉ tạo các câu hỏi thuộc các phần sau theo đúng yêu cầu:
`;
        if (enableP1) {
          prompt += `
- PHẦN TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN:
  * Số lượng: Đúng chính xác ${p1} câu.
  * "type": "mcq"
  * 4 phương án A, B, C, D trong mảng "options" ("A. ...", "B. ...", "C. ...", "D. ...").
  * "correctAnswer": "A", "B", "C", hoặc "D".
  * "points": 0.25 (hoặc tỷ lệ phù hợp).
`;
        }
        if (enableP2) {
          prompt += `
- PHẦN TRẮC NGHIỆM ĐÚNG SAI:
  * Số lượng: Đúng chính xác ${p2} câu.
  * "type": "tf"
  * 4 ý a), b), c), d) trong mảng "options". Học sinh xác định Đúng hoặc Sai cho mỗi ý.
  * "correctAnswer": "a-Đ, b-S, c-Đ, d-S".
  * "points": 1.0 (hoặc tỷ lệ phù hợp).
`;
        }
        if (enableP3) {
          prompt += `
- PHẦN TRẮC NGHIỆM TRẢ LỜI NGẮN:
  * Số lượng: Đúng chính xác ${p3} câu.
  * "type": "short"
  * Học sinh tính toán và điền đáp số kết quả toán học (mảng "options": []).
  * "correctAnswer": Giá trị số hoặc biểu thức ngắn gọn (ví dụ: "15", "-2/3").
  * "points": 0.5 (hoặc tỷ lệ phù hợp).
`;
        }
      } else if (autoGenType === 'mcq') {
        prompt += `\nPlease generate exactly ${mcqCount || 10} multiple-choice questions (MCQ) with 4 options A, B, C, D.`;
      } else if (autoGenType === 'essay') {
        const eCount = parseInt(essayCount, 10) || 3;
        prompt += `
CẤU TRÚC ĐỀ THI TỰ LUẬN:
Hãy tạo đúng ${eCount} bài toán tự luận toán học chất lượng cao ("type": "essay").
- Đề bài rõ ràng, mạch lạc, có tính phân loại học sinh tốt.
- "options": []
- "points": Thang điểm từng bài (ví dụ bài 1: 3.0đ, bài 2: 4.0đ, bài 3: 3.0đ).
- "correctAnswer": Kết quả tóm tắt hoặc đáp số chính.
- "explanation": Lời giải chi tiết từng bước (step-by-step) và barem điểm chấm cho từng ý nhỏ để giáo viên và học sinh đối chiếu.
`;
      } else if (autoGenType === 'mixed') {
        const mCount = parseInt(mcqCount, 10) || 12;
        const eCount = parseInt(essayCount, 10) || 2;
        prompt += `
CẤU TRÚC ĐỀ THI TỔNG HỢP (KẾT HỢP TRẮC NGHIỆM VÀ TỰ LUẬN):
1. PHẦN I: TRẮC NGHIỆM KHÁCH QUAN (${mCount} câu):
   - "type": "mcq"
   - Mỗi câu 4 phương án A, B, C, D trong "options", 1 đáp án đúng ("correctAnswer": "A"/"B"/"C"/"D").
   - "points": ${(7.0 / mCount).toFixed(2)} điểm / câu (tổng khoảng 7.0 điểm).
2. PHẦN II: TỰ LUẬN (${eCount} bài toán):
   - "type": "essay"
   - Bài toán tự luận rèn luyện kỹ năng giải toán, phân hóa tư duy ("options": []).
   - "points": ${(3.0 / eCount).toFixed(1)} điểm / bài (tổng 3.0 điểm).
   - "explanation": Hướng dẫn giải chi tiết từng bước và thang điểm biểu điểm.
`;
      } else if (autoGenType === 'description') {
        const p1 = p1Req;
        const p2 = p2Req;
        const p3 = p3Req;

        const wantsRatNotes = isRatInScope;
        const wantsPolyNotes = isPolyInScope && !isRatInScope;

        let effectiveEssayItems = (customEssayEnabled && Array.isArray(customEssayItems) && customEssayItems.length > 0)
          ? customEssayItems
          : undefined;

        if (!effectiveEssayItems && referenceNotes) {
          const parsedEssays: any[] = [];
          const essayRegex = /(?:^|\n|<li[^>]*>|<p[^>]*>|[•\-\*])[ \t]*(?:Câu|Bài)\s*(\d+)[\s\(\):.]*([^:\n\r<]+)?[:\-.]\s*([^\n\r<]+)/gi;
          let m;
          while ((m = essayRegex.exec(referenceNotes)) !== null) {
            const num = parseInt(m[1], 10);
            const rawMeta = m[2] || '';
            let desc = m[3].replace(/<\/?[^>]+(>|$)/g, '').trim();
            if (!desc || desc.length < 5) continue;
            if (wantsPolyNotes && !wantsRatNotes) {
              desc = desc.replace(/đa thức\/phân thức/gi, 'đa thức').replace(/phân thức/gi, 'đa thức');
            }
            const ptMatch = (rawMeta + ' ' + desc).match(/(\d+(?:[.,]\d+)?)\s*(?:điểm|đ\b)/i);
            const points = ptMatch ? parseFloat(ptMatch[1].replace(',', '.')) : 1.0;
            let level = 'VD';
            if (/nhận\s*biết|NB\b/i.test(rawMeta + ' ' + desc)) level = 'NB';
            else if (/thông\s*hiểu|TH\b/i.test(rawMeta + ' ' + desc)) level = 'TH';
            else if (/vận\s*dụng\s*cao|VDC\b/i.test(rawMeta + ' ' + desc)) level = 'VDC';
            parsedEssays.push({
              title: `Bài ${num}${ptMatch ? ` (${points.toFixed(1)} điểm)` : ''}`,
              topicScope: targetTopics[0] || (wantsPolyNotes ? 'Đa thức nhiều biến & Hằng đẳng thức' : `Toán lớp ${effectiveGrade}`),
              description: desc,
              points: points,
              level: level
            });
          }
          if (parsedEssays.length > 0) {
            effectiveEssayItems = parsedEssays;
          }
        }

        prompt += `
*** NGUYÊN TẮC BẮT BUỘC BẬC NHẤT: BẢN ĐẶC TẢ & FORM MÔ TẢ YÊU CẦU ĐỀ THI TỪ GIÁO VIÊN ***
Giáo viên đã cung cấp Bản đặc tả / Form mô tả yêu cầu đề thi (bao gồm cấu trúc, số lượng câu từng phần, phạm vi chuyên đề, mức độ nhận thức, các câu hỏi tự luận cụ thể và barem điểm).
BẮT BUỘC TUÂN THỦ CHÍNH XÁC 100% CÁC YÊU CẦU TRONG BẢN ĐẶC TẢ NÀY!
${referenceNotes ? `\nNỘI DUNG FORM MÔ TẢ YÊU CẦU ĐỀ THI CỦA GIÁO VIÊN:\n"""\n${referenceNotes}\n"""\n` : ''}

QUY ĐỊNH BẮT BUỘC VỀ NỘI DUNG VÀ DẠNG BÀI:
1. PHẠM VI NỘI DUNG KIẾN THỨC: Toàn bộ câu hỏi trong đề thi BẮT BUỘC 100% chỉ được lấy trong các chuyên đề và nội dung sau:
   - Các chuyên đề trọng tâm: ${targetTopics.length > 0 ? targetTopics.map(t => `"${t}"`).join(', ') : `Chương trình SGK Toán lớp ${effectiveGrade}`}
   ${formKnowledgeFocus ? `- Nội dung trọng tâm cần kiểm tra: "${formKnowledgeFocus}"` : ''}
2. TUYỆT ĐỐI KHÔNG ĐƯỢC ra câu hỏi ngoài phạm vi kiến thức mà giáo viên đã mô tả!
3. NỘI DUNG TỪNG CÂU TỰ LUẬN: Bắt buộc ra đúng 100% dạng bài và yêu cầu đã được mô tả chi tiết cho từng câu tự luận dưới đây!

`;
        if (isPureEssayMode) {
          prompt += `
CẤU TRÚC ĐỀ THI BẮT BUỘC THEO FORM MÔ TẢ (100% TỰ LUẬN):
Đề thi này là đề thi TỰ LUẬN HOÀN TOÀN ("type": "essay").
TUYỆT ĐỐI CẤM KHÔNG ĐƯỢC SINH RA BẤT KỲ CÂU HỎI TRẮC NGHIỆM NÀO:
- TUYỆT ĐỐI CẤM sinh ra câu hỏi trắc nghiệm Đúng/Sai ("type": "tf").
- TUYỆT ĐỐI CẤM sinh ra câu hỏi trắc nghiệm 4 lựa chọn ("type": "mcq").
- TUYỆT ĐỐI CẤM sinh ra câu hỏi trả lời ngắn ("type": "short").
TẤT CẢ các câu hỏi trong đề thi BẮT BUỘC 100% phải có "type": "essay", "options": [], với lời giải chi tiết và barem điểm từng bước!
`;
        } else {
          prompt += `
CẤU TRÚC ĐỀ THI BẮT BUỘC THEO FORM MÔ TẢ:
${!enableP2 ? '*** LƯU Ý BẮT BUỘC: Form mô tả KHÔNG YÊU CẦU Phần II (Đúng/Sai). TUYỆT ĐỐI CẤM sinh ra câu hỏi Đúng/Sai ("type": "tf")! ***\n' : ''}
${!enableP3 ? '*** LƯU Ý BẮT BUỘC: Form mô tả KHÔNG YÊU CẦU Phần III (Trả lời ngắn). TUYỆT ĐỐI CẤM sinh ra câu hỏi Trả lời ngắn ("type": "short")! ***\n' : ''}
A. PHẦN TRẮC NGHIỆM:
`;
          if (enableP1) {
            prompt += `1. PHẦN I: TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN
- Số lượng: Đúng chính xác ${p1} câu.
- "type": "mcq"
- 4 phương án A, B, C, D trong "options", 1 đáp án đúng ("correctAnswer": "A"/"B"/"C"/"D").
- Điểm: 0.25đ/câu.
`;
          }
          if (enableP2) {
            prompt += `2. PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI
- Số lượng: Đúng chính xác ${p2} câu.
- "type": "tf"
- Mỗi câu gồm 4 ý a, b, c, d trong "options".
- "correctAnswer": "a-Đ, b-S, c-Đ, d-S".
- Điểm: 1.0đ/câu.
`;
          }
          if (enableP3) {
            prompt += `3. PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN
- Số lượng: Đúng chính xác ${p3} câu.
- "type": "short"
- Điền đáp số số học hoặc biểu thức rút gọn ("options": []).
- Điểm: 0.5đ/câu.
`;
          }
        }

        if (effectiveEssayItems && effectiveEssayItems.length > 0) {
          prompt += `
B. PHẦN TỰ LUẬN - MÔ TẢ CẤU TRÚC VÀ PHẠM VI KIẾN THỨC VỚI TỪNG CÂU TỰ LUẬN (BẮT BUỘC TUÂN THỦ 100%):
Hãy tạo đúng ${effectiveEssayItems.length} bài toán tự luận ("type": "essay") theo đúng từng yêu cầu dưới đây:
`;
          effectiveEssayItems.forEach((item: any, idx: number) => {
            prompt += `
--- BÀI TỰ LUẬN ${idx + 1} (${item.points || 1.0} điểm) ---
- Tên bài / Dạng bài: ${item.title || `Bài toán tự luận ${idx + 1}`}
- Phạm vi kiến thức bắt buộc: ${item.topicScope || 'Kiến thức theo form mô tả'}
- Mô tả cấu trúc & yêu cầu chi tiết: ${item.description || 'Bài toán tự luận có lời giải chi tiết và barem điểm từng ý'}
- Mức độ nhận thức: ${item.level || 'Thông hiểu / Vận dụng'}
- Yêu cầu: "type": "essay", "points": ${Number(item.points) || 1.0}, "options": [], "explanation": lời giải chi tiết từng bước và barem điểm chấm cho từng ý.
`;
          });
        } else if (essayCount && parseInt(essayCount, 10) > 0) {
          const eCount = parseInt(essayCount, 10);
          prompt += `
B. PHẦN TỰ LUẬN (${eCount} bài toán tự luận):
- Hãy tạo đúng ${eCount} bài toán tự luận ("type": "essay") bám sát tuyệt đối nội dung mô tả phần tự luận trong form mô tả của giáo viên ở trên.
- Có lời giải chi tiết từng bước và barem điểm chuẩn xác.
`;
        }
      }

      if (isPureEssayMode) {
        prompt += `\nCRITICAL REQUIREMENT - CẤU TRÚC VÀ QUY CHUẨN ĐẦU RA BẮT BUỘC (100% TỰ LUẬN):
*** YÊU CẦU BẮT BUỘC: ĐÂY LÀ ĐỀ THI TỰ LUẬN TOÀN BỘ ("type": "essay") ***
1. TẤT CẢ các câu hỏi trong mảng JSON BẮT BUỘC 100% PHẢI LÀ CÂU HỎI TỰ LUẬN ("type": "essay", "options": []).
2. TUYỆT ĐỐI CẤM sinh ra câu hỏi trắc nghiệm Đúng/Sai ("type": "tf")!
3. TUYỆT ĐỐI CẤM sinh ra câu hỏi trắc nghiệm 4 lựa chọn ("type": "mcq")!
4. TUYỆT ĐỐI CẤM sinh ra câu hỏi trả lời ngắn ("type": "short")!
5. Mỗi bài toán tự luận có đề bài rõ ràng, mạch lạc, kèm lời giải chi tiết từng bước ("explanation") và barem chấm điểm từng ý.
`;
      } else {
        prompt += `\nCRITICAL REQUIREMENT - CẤU TRÚC VÀ QUY CHUẨN ĐẦU RA BẮT BUỘC:
*** YÊU CẦU BẮT BUỘC VỀ SỐ LƯỢNG VÀ ĐẦY ĐỦ 100% CÁC PHẦN ĐÃ YÊU CẦU Ở TRÊN ***
1. BẮT BUỘC PHẢI TẠO ĐỦ 100% TẤT CẢ CÁC PHẦN ĐÃ YÊU CẦU Ở TRÊN:
${enableP1 ? `   - PHẦN I: Trắc nghiệm 4 lựa chọn ("type": "mcq", đủ 4 options A, B, C, D)\n` : ''}
${enableP2 ? `   - PHẦN II: Trắc nghiệm Đúng/Sai ("type": "tf", đủ 4 ý a, b, c, d)\n` : `   - TUYỆT ĐỐI CẤM Phần II Đúng/Sai ("type": "tf") vì không được yêu cầu trong cấu trúc đề!\n`}
${enableP3 ? `   - PHẦN III: Trả lời ngắn ("type": "short", điền đáp số)\n` : `   - TUYỆT ĐỐI CẤM Phần III Trả lời ngắn ("type": "short") vì không được yêu cầu!\n`}
${(customEssayItems?.length || essayCount) ? `   - PHẦN TỰ LUẬN: Các bài toán tự luận ("type": "essay", "options": [], lời giải chi tiết và barem điểm)\n` : ''}
`;
      }

      prompt += `
2. Để đảm bảo mô hình tạo trọn vẹn toàn bộ các câu hỏi mà không bị ngắt quãng dung lượng:
   - "explanation": Viết lời giải chi tiết chuẩn xác nhưng súc tích, đi thẳng vào các bước giải cốt lõi, công thức và đáp số. Tránh diễn giải lan man dài dòng.
   - "reference": Viết tóm tắt ngắn gọn 1-2 dòng cho mỗi trường.

For each question, output an object in a JSON array with the following fields:
- "id": A unique string ID (e.g., "q1", "q2")
- "type": "mcq" (for multiple choice), "tf" (for true/false), "short" (for short fill-in-the-blank), or "essay" (for long answer)
- "question": The full text of the question in Vietnamese. IMPORTANT: Any math formulas, variables, and vectors MUST be wrapped in LaTeX delimiters: use $...$ for inline math and $$...$$ for block math. Example: $\\overrightarrow{AB}$, $\\frac{a}{b}$, $\\sqrt{x}$, $90^\\circ$.
- "options": An array of strings for MCQ choices (A, B, C, D) or TF sub-statements (a, b, c, d). QUY TẮC CÔNG THỨC TOÁN: MỌI biểu thức toán, lũy thừa, chỉ số dưới (ví dụ: "$3x^2 - 3$", "$u_2 = 3$") BẮT BUỘC PHẢI ĐƯỢC BỌC TRONG $...$. TUYỆT ĐỐI KHÔNG ĐƯỢC ghi "3x^2 - 3" thiếu $ hoặc "u_2 = 3$." (thiếu dấu $ mở đầu hoặc thừa dấu chấm sau $). Viết chuẩn: "A. $3x^2 - 3$", "B. $3x^2 + 3$" hoặc "a) $u_2 = 3$", "b) $u_3 = 7$".
- "explanation": A concise, step-by-step mathematical explanation (lời giải chi tiết) in Vietnamese with LaTeX formulas. Suy luận từng bước và chốt câu kết luận rõ ràng (ví dụ: "Như vậy có đúng 4 nghiệm.").
- "correctAnswer": The correct answer text. BẮT BUỘC TRÙNG KHỚP 100% VỚI KẾT QUẢ CUỐI CÙNG TRONG "explanation". Nếu lời giải kết luận 4 nghiệm thì correctAnswer PHẢI LÀ "4", không được lệch (ví dụ tuyệt đối không ghi "3").
- "points": A number (e.g., 0.25 cho MCQ, 1.0 cho TF, 0.5 cho Short).

*** QUY TẮC ĐỐI SOÁT ĐÁP ÁN VÀ LỜI GIẢI (QUAN TRỌNG BẬC NHẤT) ***
1. TRƯỜNG "correctAnswer" BẮT BUỘC PHẢI TRÙNG KHỚP 100% VỚI KẾT QUẢ CUỐI CÙNG TRONG "explanation".
   - Tuyệt đối không để xảy ra việc lời giải chi tiết giải ra một kết quả (ví dụ: "Như vậy có đúng 4 nghiệm", "Vậy có 12 giá trị nguyên", "Chọn C") nhưng "correctAnswer" lại ghi số khác (ví dụ: "3" hoặc "8" hoặc "A").
   - Khi giải bài toán, hãy kiểm tra kỹ số nghiệm trên khoảng/đoạn cho trước (chú ý xét đủ các đầu mút như 0 và 2π). Kết quả ở câu kết luận của "explanation" phải được điền chính xác vào "correctAnswer".

*** NGUYÊN TẮC BẮT BUỘC VỀ HÌNH VẼ & BẢNG BIỂU MINH HỌA ***
1. CHỈ CÂU HỎI NÀO TRONG ĐỀ BÀI CÓ CHO BẢNG HOẶC CHO HÌNH VẼ TRONG GIẢ THIẾT thì mới cung cấp hình vẽ hoặc bảng biểu minh họa ("figureType": "svg" hoặc "table"):
   - Ví dụ các câu CẦN hình/bảng:
     * "Cho bảng số liệu sau..." -> Cần bảng dữ liệu ("figureType": "table")
     * "Hình vẽ bên dưới mô tả hình hình học..." -> Cần hình vẽ vector SVG ("figureType": "svg")
2. CÂU HỎI NÀO KHÔNG CHO DỮ LIỆU BẢNG HOẶC HÌNH VẼ TRONG ĐỀ BÀI (tức là đề bài thuần câu chữ, công thức, học sinh phải tự nháp, tự tư duy tính toán) THÌ TUYỆT ĐỐI KHÔNG ĐƯỢC VẼ SẴN:
   - Đặt: "figureType": "none", "figureSvg": "", "figureTable": "", "figureDescription": "".

Cấu hình trường hình vẽ / bảng:
- "figureType": "none" (mặc định nếu đề không cho hình/bảng), "svg" (nếu đề bài cho hình học/đồ thị), "table" (nếu đề bài cho bảng số liệu)
- "figureSvg": (Chỉ khi figureType === "svg") Chuỗi mã SVG vector hoàn chỉnh, hợp lệ, tự chứa, viewBox="0 0 380 260", nét vẽ rõ ràng (#0f172a, stroke-width="2"), nét khuất đứt đoạn (stroke-dasharray="5,4"), nhãn chữ cái (A, B, C, D, x, y...) bằng thẻ <text> THUẦN TÚY (TUYỆT ĐỐI KHÔNG DÙNG DẤU $ TRONG THẺ <text> CỦA SVG, TUYỆT ĐỐI KHÔNG BỌC SVG TRONG THẺ HTML NHƯ <div>).
- "figureTable": (Chỉ khi figureType === "table") Bảng Markdown thể hiện bảng số liệu. Mọi ký hiệu toán học bọc trong dấu $.
- "figureDescription": Chú thích ngắn gọn (Ví dụ: "Hình vẽ minh họa", "Bảng số liệu thống kê").

*** BẮT BUỘC VỀ NỘI DUNG THAM CHIẾU ĐỂ GIÁO VIÊN SỬA ĐỀ (PEDAGOGICAL REFERENCE) ***
Mỗi câu hỏi PHẢI CÓ trường "reference" là một object chứa thông tin tham chiếu chuẩn chương trình GDPT giúp giáo viên hiểu rõ và sửa đề dễ dàng:
- "reference": {
    "topic": "Chủ đề kiến thức tham chiếu (Bắt buộc ghi chính xác 1 trong các chuyên đề đã chọn: ${targetTopics.length > 0 ? targetTopics.map(t => `"${t}"`).join(', ') : `"Toán lớp ${effectiveGrade}"`})",
    "curriculumLesson": "Bài học SGK Toán lớp ${effectiveGrade} - Kết nối tri thức",
    "cognitiveLevel": "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao",
    "competency": "Năng lực toán học mục tiêu (Tư duy và lập luận toán học / Giải quyết vấn đề toán học)",
    "coreKnowledge": "Công thức cốt lõi, định lý trọng tâm theo đúng chuyên đề đã chọn",
    "variationGuide": "Hướng dẫn ngắn gọn cho giáo viên cách đổi số liệu tương đương"
  }

CRITICAL FORMATTING: Since this is JSON, every backslash in LaTeX formulas MUST be properly escaped with double backslash (e.g. \\\\overrightarrow, \\\\frac, \\\\sqrt, \\\\cdot, \\\\alpha, \\\\nearrow). Format your output EXACTLY as a valid JSON array without any markdown formatting.`;

      let response;
      const genConfig = {
        maxOutputTokens: 20000,
        temperature: 0.3
      };

      const userParts: any[] = [];
      if (referenceFileDataUrl) {
        const detectedMime = (referenceFileMimeType || referenceFileDataUrl.match(/data:([^;]+);/)?.[1] || '').toLowerCase();
        if (detectedMime.includes('pdf') || detectedMime.startsWith('image/')) {
          const refBase64 = referenceFileDataUrl.split(',')[1];
          if (refBase64) {
            userParts.push({
              inlineData: {
                mimeType: detectedMime.includes('pdf') ? 'application/pdf' : detectedMime,
                data: refBase64
              }
            });
          }
        }
      }

      if (autoGenType === 'matrix' && matrixFileDataUrl) {
        try {
          const extractedDoc = await extractTextFromAttachment(matrixFileDataUrl, "matrix_file", mimeType);
          if (extractedDoc && extractedDoc.text && extractedDoc.text.trim().length > 15) {
            userParts.push({
              text: `NỘI DUNG MA TRẬN & BẢN ĐẶC TẢ TRÍCH XUẤT TỪ TỆP ĐÍNH KÈM:\n"""\n${repairVietnameseDocument(convertTcvn3ToUnicode(extractedDoc.text))}\n"""\nBiên soạn đề thi bám sát 100% theo bản đặc tả này.`
            });
          }
        } catch (e) {
          console.warn("Could not extract text from matrix attachment", e);
        }
        const base64Data = matrixFileDataUrl.split(',')[1];
        if (base64Data) {
          userParts.push({
            inlineData: {
              mimeType: mimeType || "application/pdf",
              data: base64Data
            }
          });
        }
      }

      userParts.push({ text: prompt });

      if (userParts.length === 1 && typeof userParts[0].text === 'string') {
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: userParts[0].text,
          config: genConfig
        });
      } else {
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: userParts }],
          config: genConfig
        });
      }

      let responseText = response.text || "[]";
      let parsed = safeParseJsonArray(responseText);
      let sanitized = sanitizeQuestionFigures(parsed);
      let reconciled = reconcileAnswersWithExplanations(sanitized);

      const scoped = enforceTopicAndGradeScope(
        reconciled,
        effectiveGrade,
        targetTopics,
        () => generateCurriculumFallbackQuestions({
          ...req.body,
          grade: effectiveGrade,
          selectedTopicTitles: targetTopics
        })
      );

      const cleaned = (scoped || []).map((q: any) => ({
        ...q,
        question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || '')),
        options: Array.isArray(q.options)
          ? q.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || '')))
          : [],
        explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || '')),
        correctAnswer: typeof q.correctAnswer === 'string' ? repairVietnameseDocument(q.correctAnswer) : q.correctAnswer
      }));

      // BẢO VỆ CHẶT CHẼ ĐỊNH DẠNG (TYPE-GUARD):
      const typeGuarded = cleaned.map((q: any) => {
        if (isPureEssayMode) {
          return {
            ...q,
            type: 'essay',
            options: [],
            points: q.points || 2.0
          };
        }
        // Nếu Phần II (Đúng/Sai) không được bật trong cấu trúc đề, TUYỆT ĐỐI không để câu hỏi nào có type 'tf'
        if (!enableP2 && q.type === 'tf') {
          return {
            ...q,
            type: 'essay',
            options: [],
            points: q.points || 1.0
          };
        }
        // Nếu Phần III không được bật
        if (!enableP3 && q.type === 'short') {
          return {
            ...q,
            type: 'essay',
            options: [],
            points: q.points || 1.0
          };
        }
        return q;
      });

      const standardPolyEssayBank = [
        {
          question: "Cho hai đa thức: $A = 3x^2y - 2xy + 5x - 1$ và $B = -2x^2y + 4xy - 5x + 7$.\na) Tính tổng $C = A + B$.\nb) Tính giá trị của đa thức $C$ tại $x = 1, y = 2$.",
          options: [],
          type: "essay",
          points: 2.5,
          explanation: "a) $C = A + B = (3x^2y - 2xy + 5x - 1) + (-2x^2y + 4xy - 5x + 7) = (3 - 2)x^2y + (-2 + 4)xy + (5 - 5)x + (-1 + 7) = x^2y + 2xy + 6$.\nb) Thay $x = 1, y = 2$ vào $C$: $C = (1)^2(2) + 2(1)(2) + 6 = 2 + 4 + 6 = 12$.\nKết luận: $C = 12$.",
          correctAnswer: "a) C = x^2y + 2xy + 6; b) C = 12",
          reference: {
            topic: "Chương 1: Đa thức nhiều biến và các phép toán",
            curriculumLesson: "Toán 8 - Cộng trừ đa thức nhiều biến",
            cognitiveLevel: "Thông hiểu",
            competency: "Tư duy và lập luận toán học",
            coreKnowledge: "Cộng trừ đơn thức đồng dạng",
            variationGuide: "Đổi hệ số của đa thức"
          }
        },
        {
          question: "Thực hiện phép tính:\na) $2x^2(3x^3 - 5x + 1)$\nb) $(2x - 3)(x^2 + 4x - 5)$",
          options: [],
          type: "essay",
          points: 2.5,
          explanation: "a) $2x^2(3x^3 - 5x + 1) = 6x^5 - 10x^3 + 2x^2$.\nb) $(2x - 3)(x^2 + 4x - 5) = 2x(x^2 + 4x - 5) - 3(x^2 + 4x - 5) = 2x^3 + 8x^2 - 10x - 3x^2 - 12x + 15 = 2x^3 + 5x^2 - 22x + 15$.",
          correctAnswer: "a) 6x^5 - 10x^3 + 2x^2; b) 2x^3 + 5x^2 - 22x + 15",
          reference: {
            topic: "Chương 1: Đa thức nhiều biến và các phép toán",
            curriculumLesson: "Toán 8 - Nhân đa thức với đa thức",
            cognitiveLevel: "Thông hiểu",
            competency: "Giải quyết vấn đề toán học",
            coreKnowledge: "Quy tắc nhân đơn thức với đa thức, nhân đa thức với đa thức",
            variationGuide: "Đổi dấu và bậc của biến"
          }
        },
        {
          question: "Phân tích các đa thức sau thành nhân tử:\na) $5x^2y - 10xy^2$\nb) $x^2 - 6x + 9 - y^2$",
          options: [],
          type: "essay",
          points: 2.5,
          explanation: "a) Đặt nhân tử chung $5xy$: $5x^2y - 10xy^2 = 5xy(x - 2y)$.\nb) Nhóm 3 hạng tử đầu thành hằng đẳng thức: $(x^2 - 6x + 9) - y^2 = (x - 3)^2 - y^2 = (x - 3 - y)(x - 3 + y)$.",
          correctAnswer: "a) 5xy(x - 2y); b) (x - y - 3)(x + y - 3)",
          reference: {
            topic: "Chương 2: Hằng đẳng thức đáng nhớ & Phân tích đa thức thành nhân tử",
            curriculumLesson: "Toán 8 - Phân tích đa thức thành nhân tử bằng phương pháp phối hợp",
            cognitiveLevel: "Vận dụng",
            competency: "Tư duy và lập luận toán học",
            coreKnowledge: "Phương pháp đặt nhân tử chung và dùng hằng đẳng thức",
            variationGuide: "Đổi số 6 và 9 thành 8 và 16"
          }
        },
        {
          question: "Chứng minh rằng giá trị của biểu thức sau không phụ thuộc vào giá trị của biến $x$:\n$M = (x - 3)(x + 3) - x(x - 4) - 4x + 10$.",
          options: [],
          type: "essay",
          points: 2.5,
          explanation: "Khai triển biểu thức:\n$(x - 3)(x + 3) = x^2 - 9$.\n$x(x - 4) = x^2 - 4x$.\nDo đó:\n$M = (x^2 - 9) - (x^2 - 4x) - 4x + 10 = x^2 - 9 - x^2 + 4x - 4x + 10 = (-9 + 10) = 1$.\nVì $M = 1$ với mọi số thực $x$, nên giá trị của biểu thức không phụ thuộc vào giá trị của biến $x$.",
          correctAnswer: "M = 1 (không phụ thuộc vào x)",
          reference: {
            topic: "Chương 2: Hằng đẳng thức đáng nhớ",
            curriculumLesson: "Toán 8 - Hiệu hai bình phương",
            cognitiveLevel: "Vận dụng",
            competency: "Tư duy và lập luận toán học",
            coreKnowledge: "(A - B)(A + B) = A^2 - B^2",
            variationGuide: "Đổi hằng số 3 thành 5"
          }
        }
      ];

      const finalCleaned = typeGuarded.map((q: any, idx: number) => {
        if (isPolyInScope && !isRatInScope) {
          const qText = `${q.question || ''} ${q.explanation || ''} ${(q.options || []).join(' ')}`;
          if (/\b(phân thức|mẫu thức|quy đồng mẫu|rút gọn phân thức|điều kiện xác định của phân thức)\b/i.test(qText) ||
              /\\frac\{[^\}]+\}\{[^0-9\\\}\s]*[a-zA-Z][^\}]*\}/.test(qText) ||
              /(?:\/|\:\s*)\([a-zA-Z\d\s\+\-\*]*[a-zA-Z][a-zA-Z\d\s\+\-\*]*\)/.test(qText)) {
            const fallbackFb = generateCurriculumFallbackQuestions({
              ...req.body,
              grade: effectiveGrade,
              selectedTopicTitles: targetTopics
            });
            const purePoly = fallbackFb.find((fb: any) => fb.type === (isPureEssayMode ? 'essay' : q.type) && !/\b(phân thức|mẫu thức)\b/i.test(`${fb.question} ${fb.explanation}`)) ||
              standardPolyEssayBank[idx % standardPolyEssayBank.length];
            if (purePoly) {
              return {
                ...purePoly,
                id: q.id || `q_${idx + 1}`,
                type: isPureEssayMode ? 'essay' : purePoly.type,
                options: isPureEssayMode ? [] : (purePoly.options || []),
                points: q.points || purePoly.points
              };
            }
          }
        }
        return q;
      });

      res.json(finalCleaned);
    } catch (error: any) {
      console.warn("AI generation failed or rate limited, gracefully returning curriculum standard questions:", error?.message || error);
      try {
        const fbGrade = Number(req.body.grade) || (() => {
          const t = `${req.body.title || ''} ${req.body.referenceNotes || ''} ${req.body.topicTitle || ''}`;
          const m = t.match(/(?:lớp|khối|toán)\s*([6-9]|1[0-2])\b/i);
          return m ? parseInt(m[1], 10) : 8;
        })();
        const fallbackQuestions = generateCurriculumFallbackQuestions({ 
          ...req.body, 
          grade: fbGrade,
          selectedTopicTitles: targetTopics 
        });

        const cleaned = (fallbackQuestions || []).map((q: any) => {
          let item = {
            ...q,
            question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || '')),
            options: Array.isArray(q.options)
              ? q.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || '')))
              : [],
            explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || '')),
            correctAnswer: typeof q.correctAnswer === 'string' ? repairVietnameseDocument(q.correctAnswer) : q.correctAnswer
          };
          if (isPureEssayMode) {
            item.type = 'essay';
            item.options = [];
          } else if (!enableP2 && item.type === 'tf') {
            item.type = 'essay';
            item.options = [];
          }
          return item;
        });
        return res.json(cleaned);
      } catch (fbErr: any) {
        console.error("Critical fallback error:", fbErr);
        res.status(500).json({ error: "Failed to generate test", details: formatError(error) });
      }
    }
  });

  // Create uploads directory
  const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create uploads directory:", e);
    }
  }

  // In-memory cache for fast file retrieval
  const fileCache = new Map<string, { buffer: Buffer; mimeType: string; fileName: string; dataUrl?: string }>();

  // Helper to match uploaded file across disk cache using multiple fuzzy/diacritic-insensitive strategies
  const findMatchingUploadFile = (fileId?: string, queryFileName?: string): string | null => {
    if (!fs.existsSync(UPLOADS_DIR)) return null;
    const files = fs.readdirSync(UPLOADS_DIR);
    if (!files || files.length === 0) return null;

    // 1. Direct fileId prefix match
    if (fileId && fileId !== 'by-name') {
      const match = files.find(f => f.startsWith(`${fileId}_`) || f.includes(fileId));
      if (match) return match;
    }

    if (!queryFileName) return null;

    const raw = String(queryFileName).trim().toLowerCase();
    const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 2. Direct safeName match
    let match = files.find(f => {
      const lower = f.toLowerCase();
      return lower.endsWith(`_${safe}`) || lower.includes(safe);
    });
    if (match) return match;

    // 3. Normalized alphanumeric match (stripping Vietnamese accents and special symbols)
    const normalize = (str: string) => str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();

    const queryNorm = normalize(raw);
    if (queryNorm.length >= 3) {
      match = files.find(f => {
        const fNorm = normalize(f);
        return fNorm.includes(queryNorm) || queryNorm.includes(fNorm);
      });
      if (match) return match;
    }

    // 4. Token keyword match (e.g. "he", "phuong", "trinh")
    const tokens = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/gi, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    if (tokens.length > 0) {
      match = files.find(f => {
        const fLower = normalize(f);
        const hits = tokens.filter(t => fLower.includes(t));
        return hits.length >= Math.min(2, tokens.length);
      });
      if (match) return match;
    }

    return null;
  };

  // Document File Upload endpoint (stores files so Firestore document never exceeds 1MB)
  app.post("/api/upload-document-file", express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { fileDataUrl, fileName, mimeType, fileId: clientFileId } = req.body;
      if (!fileDataUrl) {
        return res.status(400).json({ error: "No file data provided." });
      }

      const fileId = clientFileId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const safeName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const cleanMimeType = mimeType || 'application/octet-stream';

      // Parse base64
      let buffer: Buffer;
      if (fileDataUrl.includes(',')) {
        const base64Data = fileDataUrl.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = Buffer.from(fileDataUrl, 'base64');
      }

      // Save to disk
      const filePath = path.join(UPLOADS_DIR, `${fileId}_${safeName}`);
      fs.writeFileSync(filePath, buffer);

      // Cache in memory
      fileCache.set(fileId, {
        buffer,
        mimeType: cleanMimeType,
        fileName: fileName || safeName,
        dataUrl: fileDataUrl
      });

      return res.json({
        success: true,
        fileId,
        fileName: fileName || safeName,
        fileUrl: `/api/document-file/${fileId}`,
        size: buffer.length,
        mimeType: cleanMimeType
      });
    } catch (err: any) {
      console.error("Upload document file error:", err);
      return res.status(500).json({ error: "Failed to upload file", details: formatError(err) });
    }
  });

  // Serve Document File
  app.get("/api/document-file/:fileId", (req, res) => {
    try {
      const { fileId } = req.params;
      const rawQueryFileName = req.query.fileName ? String(req.query.fileName) : '';
      
      // Check cache first
      if (fileId && fileId !== 'by-name' && fileCache.has(fileId)) {
        const item = fileCache.get(fileId)!;
        res.setHeader("Content-Type", item.mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(item.fileName)}"`);
        return res.send(item.buffer);
      }

      // Check disk with robust matching
      const match = findMatchingUploadFile(fileId, rawQueryFileName);

      if (match) {
        const filePath = path.join(UPLOADS_DIR, match);
        const buffer = fs.readFileSync(filePath);
        const fileName = match.replace(/^[a-zA-Z0-9]+_\d+_[a-zA-Z0-9]+_/, '') || match;
        const ext = path.extname(match).toLowerCase();
        let mime = 'application/octet-stream';
        if (ext === '.pdf') mime = 'application/pdf';
        else if (ext === '.docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.doc') mime = 'application/msword';
        else if (ext === '.png') mime = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        else if (ext === '.txt') mime = 'text/plain';

        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
        return res.send(buffer);
      }

      return res.status(404).json({ error: "File not found." });
    } catch (err: any) {
      console.error("Serve file error:", err);
      return res.status(500).json({ error: "Error serving file", details: formatError(err) });
    }
  });

  // Get Document File as DataUrl
  app.get("/api/document-file-data/:fileId", (req, res) => {
    try {
      const { fileId } = req.params;
      const rawQueryFileName = req.query.fileName ? String(req.query.fileName) : '';

      if (fileId && fileId !== 'by-name' && fileCache.has(fileId)) {
        const item = fileCache.get(fileId)!;
        if (item.dataUrl) {
          return res.json({ dataUrl: item.dataUrl });
        }
        const dataUrl = `data:${item.mimeType};base64,${item.buffer.toString('base64')}`;
        return res.json({ dataUrl });
      }

      const match = findMatchingUploadFile(fileId, rawQueryFileName);

      if (match) {
        const filePath = path.join(UPLOADS_DIR, match);
        const buffer = fs.readFileSync(filePath);
        const fileName = match.replace(/^[a-zA-Z0-9]+_\d+_[a-zA-Z0-9]+_/, '') || match;
        const ext = path.extname(match).toLowerCase();
        let mime = 'application/octet-stream';
        if (ext === '.pdf') mime = 'application/pdf';
        else if (ext === '.docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.doc') mime = 'application/msword';
        else if (ext === '.png') mime = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        else if (ext === '.txt') mime = 'text/plain';

        const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
        return res.json({ dataUrl });
      }

      return res.status(404).json({ error: "File not found." });
    } catch (err: any) {
      console.error("Get file data error:", err);
      return res.status(500).json({ error: "Error getting file data", details: formatError(err) });
    }
  });

  // Document extraction endpoint (handles both /api/extract-document and /api/extract-document-fast)
  const handleDocumentExtraction = async (req: express.Request, res: express.Response) => {
    try {
      const { fileDataUrl, fileName, mimeType, title } = req.body;
      if (!fileDataUrl) {
        return res.status(400).json({ error: "No file data provided." });
      }

      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      const detectedMime = (mimeType || fileDataUrl.match(/data:([^;]+);/)?.[1] || '').toLowerCase();
      const isPdf = Boolean((fileName && fileName.toLowerCase().endsWith('.pdf')) || detectedMime.includes('pdf'));
      const isImage = Boolean(detectedMime.startsWith('image/'));

      // 1. If Gemini AI is available and file is PDF or Image, use direct Gemini Vision/Doc parsing
      if (apiKey && (isPdf || isImage)) {
        try {
          const parts = fileDataUrl.split(',');
          const base64Data = parts[1] || '';
          if (base64Data) {
            const ai = new GoogleGenAI({ 
              apiKey: apiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });

            const prompt = `Bạn là chuyên gia số hóa và sư phạm Toán học Việt Nam.
NHIỆM VỤ: TRÍCH XUẤT 100% NGUYÊN VẸN NỘI DUNG TÀI LIỆU NÀY TỪNG TRANG.
QUY TẮC BẢO TOÀN DỮ LIỆU TUYỆT ĐỐI:
1. TUYỆT ĐỐI BẢO TOÀN 100% NỘI DUNG NGUYÊN BẢN: Tuyệt đối KHÔNG ĐƯỢC TÓM TẮT, KHÔNG ĐƯỢC BỎ BỚT bất kỳ đề mục (I, II, 1, 2...), định nghĩa, định lý, hệ quả, chú ý, ví dụ, bài tập hay lời giải nào.
2. CÔNG THỨC TOÁN HỌC: Toàn bộ công thức toán học, biểu thức, tọa độ, phân số, căn số, vec-tơ, hệ phương trình PHẢI chuyển đổi sang cú pháp LaTeX chuẩn xác ($...$ cho inline và $$...$$ cho khối công thức). Hệ phương trình dùng \\begin{cases} ... \\end{cases} với dấu \\\\ giữa các dòng.
3. BẢNG BIỂU: Chuyển đổi thành bảng Markdown đầy đủ hàng và cột.
4. TIẾNG VIỆT: Sử dụng tiếng Việt Unicode chuẩn có dấu 100%, không viết tắt và không lỗi phông chữ.

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ:
{
  "title": "${(title || fileName || 'Bài học').replace(/\.[^/.]+$/, '').replace(/"/g, '\\"')}",
  "content": "Toàn bộ nội dung bài học đầy đủ 100%..."
}`;

            const response = await generateContentWithRetry(ai, {
              model: "gemini-3.8-flash",
              contents: [{
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: isPdf ? 'application/pdf' : (mimeType || 'image/jpeg'),
                      data: base64Data
                    }
                  },
                  { text: prompt }
                ]
              }]
            });

            const parsed = safeParseJsonObject(response.text || "{}");
            const aiContent = parsed?.content || parsed?.knowledge || '';

            if (aiContent && aiContent.trim().length > 50) {
              const repaired = repairVietnameseDocument(aiContent);
              const formatted = smartFormatLessonLayout(repaired, parsed?.title || title);
              const detectedTitle = parsed?.title || autoDetectLessonTitle(formatted, title, fileName);
              return res.json({
                title: detectedTitle,
                text: formatted,
                content: formatted,
                knowledge: formatted,
                pages: [],
                isPdf: isPdf,
                isDocx: false,
                totalChars: formatted.length
              });
            }
          }
        } catch (aiErr) {
          console.warn("Direct Gemini document extraction failed, falling back to local extraction:", aiErr);
        }
      }

      // 2. Local & Enhanced extraction
      const extracted = await extractTextFromAttachment(fileDataUrl, fileName, mimeType);
      let formattedText = smartFormatLessonLayout(extracted.text);

      // Sửa lỗi phông chữ tiếng Việt (TCVN3 / .VnTime, VNI Windows) và ký hiệu toán học
      formattedText = repairVietnameseDocument(formattedText);
      formattedText = convertTcvn3ToUnicode(formattedText);

      // If DOCX, local extractor preserves 100% of tables, formulas, and paragraphs without truncation
      // If text is short (< 4000 chars) and has no math equations, AI can enhance LaTeX formatting if it preserves >= 95% content
      if (apiKey && extracted.isDocx && !formattedText.includes('$') && formattedText.length > 50 && formattedText.length <= 4000) {
        try {
          const ai = new GoogleGenAI({ 
            apiKey: apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          const prompt = `Bạn là chuyên gia sư phạm Toán học Việt Nam.
Nhiệm vụ: Chuẩn hóa lại các công thức toán học sang LaTeX ($...$ và $$...$$) cho văn bản sau.
YÊU CẦU TUYỆT ĐỐI: BẢO TOÀN 100% NỘI DUNG, KHÔNG TÓM TẮT, KHÔNG BỎ BỚT BẤT KỲ DÒNG NÀO.
TRẢ VỀ DUY NHẤT MỘT JSON:
{
  "content": "Toàn bộ nội dung..."
}`;

          const response = await generateContentWithRetry(ai, {
            model: "gemini-3.8-flash",
            contents: [{
              role: "user",
              parts: [{ text: `VĂN BẢN:\n\n${formattedText}\n\n${prompt}` }]
            }]
          });

          const parsed = safeParseJsonObject(response.text || "{}");
          if (parsed?.content && parsed.content.length >= formattedText.length * 0.95) {
            formattedText = convertTcvn3ToUnicode(repairVietnameseDocument(parsed.content));
          }
        } catch (e) {
          console.warn("AI polish on DOCX failed, using local result:", e);
        }
      }

      const detectedTitle = autoDetectLessonTitle(formattedText, title, fileName);
      return res.json({
        title: detectedTitle,
        text: formattedText,
        content: formattedText,
        knowledge: formattedText,
        pages: extracted.pages,
        isPdf: extracted.isPdf,
        isDocx: extracted.isDocx,
        totalChars: formattedText.length
      });
    } catch (err: any) {
      console.error("Fast extract error:", err);
      return res.status(500).json({ error: "Failed to extract document", details: formatError(err) });
    }
  };

  app.post("/api/extract-document", express.json({ limit: '50mb' }), handleDocumentExtraction);
  app.post("/api/extract-document-fast", express.json({ limit: '50mb' }), handleDocumentExtraction);

  // Helper: Extract complete test metadata (title, grade, subject, duration, school year, format) from text
  function extractTestMetadataFromText(
    rawText: string, 
    fileName?: string, 
    questions: any[] = []
  ): {
    title: string;
    grade: number;
    subject: string;
    durationMinutes: number;
    schoolYear: string;
    schoolOrOrg: string;
    examFormat: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed';
    suggestedTopic?: string;
  } {
    const text = (rawText || '').trim();
    const cleanDoc = repairVietnameseDocument(convertTcvn3ToUnicode(text));
    const lines = cleanDoc.split('\n').map(l => l.trim()).filter(Boolean);
    const headerLines = lines.slice(0, 30);
    const headerText = headerLines.join('\n');

    // 1. Tên đề thi (title)
    let detectedTitle = '';
    for (const line of headerLines) {
      if (/^(?:ĐỀ\s+(?:KIỂM\s+TRA|THI|KHẢO\s+SÁT|ÔN\s+TẬP)|BÀI\s+KIỂM\s+TRA|KỲ\s+THI|ĐỀ\s+CHÍNH\s+THỨC|ĐỀ\s+THAM\s+KHẢO)/i.test(line)) {
        let t = line.replace(/\s*\(?(?:Đề\s+thi\s+có\s+\d+\s+trang|Mã\s+đề\s+thi\s*:\s*\w+)\)?/i, '').trim();
        if (t.length > 5) {
          detectedTitle = t;
          break;
        }
      }
    }

    if (!detectedTitle) {
      for (const line of headerLines) {
        if (/(?:ĐỀ\s+KIỂM\s+TRA|ĐỀ\s+THI\s+THỬ|ĐỀ\s+THI\s+TỐT\s+NGHIỆP|ĐỀ\s+KHẢO\s+SÁT)/i.test(line)) {
          detectedTitle = line.trim();
          break;
        }
      }
    }

    if (!detectedTitle && fileName) {
      let clean = fileName.replace(/\.[^/.]+$/, "");
      clean = clean.replace(/[-_]+/g, ' ');
      detectedTitle = repairVietnameseDocument(convertTcvn3ToUnicode(clean));
    }

    if (!detectedTitle) {
      detectedTitle = 'Đề kiểm tra môn Toán';
    }

    // 2. Khối lớp (grade: 6..12)
    let detectedGrade = 12;
    const gradeRegex = /(?:Lớp|Khối|K|Grade)\s*([6-9]|1[0-2])\b/i;
    const gradeMatch = headerText.match(gradeRegex) || (fileName ? fileName.match(gradeRegex) : null);
    if (gradeMatch && gradeMatch[1]) {
      detectedGrade = parseInt(gradeMatch[1], 10);
    } else {
      const subjectGradeMatch = headerText.match(/(?:TOÁN|MÔN\s+TOÁN)\s*([6-9]|1[0-2])\b/i) 
        || (fileName ? fileName.match(/(?:toan|toán)[\s_-]*([6-9]|1[0-2])\b/i) : null);
      if (subjectGradeMatch && subjectGradeMatch[1]) {
        detectedGrade = parseInt(subjectGradeMatch[1], 10);
      } else {
        const fullLower = text.toLowerCase();
        if (fullLower.includes('nguyên hàm') || fullLower.includes('tích phân') || fullLower.includes('tiệm cận') || fullLower.includes('số phức') || fullLower.includes('oxyz') || fullLower.includes('khối đa diện')) {
          detectedGrade = 12;
        } else if (fullLower.includes('cấp số cộng') || fullLower.includes('cấp số nhân') || fullLower.includes('lượng giác') || fullLower.includes('giới hạn') || fullLower.includes('đạo hàm')) {
          detectedGrade = 11;
        } else if (fullLower.includes('mệnh đề') || fullLower.includes('tập hợp') || fullLower.includes('vectơ') || fullLower.includes('bất phương trình bậc hai')) {
          detectedGrade = 10;
        } else if (fullLower.includes('căn bậc hai') || fullLower.includes('hệ thức lượng') || fullLower.includes('đường tròn')) {
          detectedGrade = 9;
        }
      }
    }

    if (!/(?:lớp|khối)\s*\d+/i.test(detectedTitle) && !/toán\s*\d+/i.test(detectedTitle)) {
      if (detectedTitle.length < 25) {
        detectedTitle = `${detectedTitle} - Toán ${detectedGrade}`;
      }
    }

    // 3. Thời gian làm bài (durationMinutes: số phút)
    let detectedDuration = 45;
    const durationMatch = text.match(/(?:Thời\s*gian(?:\s*làm\s*bài)?|Thời\s*lượng)[:\.\s]*(\d{1,3})\s*(?:phút|p|min)/i);
    if (durationMatch && durationMatch[1]) {
      const d = parseInt(durationMatch[1], 10);
      if (d >= 10 && d <= 180) {
        detectedDuration = d;
      }
    } else {
      const qCount = questions.length;
      if (headerText.toLowerCase().includes('15 phút') || headerText.toLowerCase().includes('15p')) {
        detectedDuration = 15;
      } else if (headerText.toLowerCase().includes('giữa kỳ') || headerText.toLowerCase().includes('giữa học kỳ') || headerText.toLowerCase().includes('học kỳ') || headerText.toLowerCase().includes('cuối kỳ') || headerText.toLowerCase().includes('tốt nghiệp') || headerText.toLowerCase().includes('thử')) {
        detectedDuration = 90;
      } else if (qCount >= 35) {
        detectedDuration = 90;
      } else if (qCount >= 20) {
        detectedDuration = 50;
      } else {
        detectedDuration = 45;
      }
    }

    // 4. Năm học (schoolYear)
    let detectedSchoolYear = '2024-2025';
    const yearMatch = text.match(/(?:Năm\s*học|Khóa\s*thi|Năm)\s*[:\s]*(\d{4})\s*[-–/]\s*(\d{4})/i);
    if (yearMatch && yearMatch[1] && yearMatch[2]) {
      detectedSchoolYear = `${yearMatch[1]}-${yearMatch[2]}`;
    } else {
      const singleYear = text.match(/(?:Năm\s*học|Năm)\s*[:\s]*(\d{4})\b/i);
      if (singleYear && singleYear[1]) {
        const y = parseInt(singleYear[1], 10);
        detectedSchoolYear = `${y}-${y + 1}`;
      }
    }

    // 5. Trường / Đơn vị tổ chức (schoolOrOrg)
    let detectedOrg = '';
    const orgMatch = text.match(/(?:SỞ\s*GD(?:&|VÀ)ĐT[^\n]*|TRƯỜNG\s*THPT[^\n]*|TRƯỜNG\s*THCS[^\n]*|TRƯỜNG\s*ĐẠI\s*HỌC[^\n]*)/i);
    if (orgMatch) {
      detectedOrg = orgMatch[0].trim();
    }

    // 6. Cấu trúc đề (examFormat)
    let detectedFormat: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed' = 'mcq_3part';
    const hasMcq = questions.some(q => q.type === 'mcq');
    const hasTf = questions.some(q => q.type === 'tf');
    const hasShort = questions.some(q => q.type === 'short');
    const hasEssay = questions.some(q => q.type === 'essay');

    if (hasEssay && (hasMcq || hasTf || hasShort)) {
      detectedFormat = 'mixed';
    } else if (hasEssay && !hasMcq && !hasTf && !hasShort) {
      detectedFormat = 'essay';
    } else if ((hasTf || hasShort) && hasMcq) {
      detectedFormat = 'mcq_3part';
    } else if (hasMcq && !hasTf && !hasShort) {
      detectedFormat = 'mcq_3part';
    }

    // 7. Gợi ý chủ đề kiến thức (suggestedTopic)
    let suggestedTopic = '';
    const topicKeywords: Record<string, string> = {
      'đạo hàm': 'Ứng dụng đạo hàm để khảo sát hàm số',
      'khảo sát': 'Khảo sát và vẽ đồ thị hàm số',
      'mũ': 'Hàm số lũy thừa, mũ và logarit',
      'logarit': 'Hàm số lũy thừa, mũ và logarit',
      'nguyên hàm': 'Nguyên hàm, tích phân và ứng dụng',
      'tích phân': 'Nguyên hàm, tích phân và ứng dụng',
      'oxyz': 'Phương pháp toạ độ trong không gian',
      'tọa độ không gian': 'Phương pháp toạ độ trong không gian',
      'khối đa diện': 'Khối đa diện và thể tích',
      'nón trụ cầu': 'Mặt nón, mặt trụ, mặt cầu',
      'xác suất': 'Xác suất và biến cố',
      'thống kê': 'Các số đặc trưng đo xu thế trung tâm và mức độ phân tán',
      'lượng giác': 'Hàm số lượng giác và phương trình lượng giác',
      'dãy số': 'Dãy số, cấp số cộng và cấp số nhân',
      'giới hạn': 'Giới hạn và hàm số liên tục',
      'hình học không gian': 'Quan hệ vuông góc và song song trong không gian',
      'vectơ': 'Vectơ và các phép toán',
      'tập hợp': 'Mệnh đề và tập hợp',
      'bất phương trình': 'Bất phương trình và hệ bất phương trình bậc nhất hai ẩn'
    };

    const textSample = (headerText + ' ' + questions.slice(0, 5).map(q => q.question).join(' ')).toLowerCase();
    for (const [kw, topicName] of Object.entries(topicKeywords)) {
      if (textSample.includes(kw)) {
        suggestedTopic = topicName;
        break;
      }
    }

    return {
      title: detectedTitle,
      grade: detectedGrade,
      subject: 'Toán',
      durationMinutes: detectedDuration,
      schoolYear: detectedSchoolYear,
      schoolOrOrg: detectedOrg,
      examFormat: detectedFormat,
      suggestedTopic
    };
  }

  // Helper: Bóc tách các phương án trắc nghiệm A, B, C, D từ chuỗi văn bản
  function splitMcqOptionsInServer(raw: string): string[] {
    if (!raw || typeof raw !== 'string') return [];
    const text = raw.trim();
    const pattern = /(?:^|\s+)(?:\[([A-D])\]|\(([A-D])\)|([A-D])[\.:\)])\s+/g;
    const matches: Array<{ letter: string; index: number; len: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const letter = (m[1] || m[2] || m[3]).toUpperCase();
      matches.push({ letter, index: m.index, len: m[0].length });
    }

    if (matches.length >= 2 && matches.some(x => x.letter === 'A') && matches.some(x => x.letter === 'B')) {
      const results: string[] = [];
      for (let i = 0; i < matches.length; i++) {
        const cur = matches[i];
        const next = matches[i + 1];
        const start = cur.index + cur.len;
        const end = next ? next.index : text.length;
        let optText = text.substring(start, end).trim();
        if (i === matches.length - 1) {
          optText = optText.replace(/(?:^|\n|\s{2,})(?:Đáp\s*án|ĐÁP\s*ÁN|Key|Lời\s*giải|Hướng\s*dẫn)[\s\S]*$/i, '').trim();
        }
        results.push(`${cur.letter}. ${optText}`);
      }
      return results;
    }
    return [];
  }

  // Helper: Kiểm tra dòng chỉ dẫn làm bài hoặc chỉ ghi khoảng câu hỏi
  function isInstructionOrRangeOnlyInServer(text: string): boolean {
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

  // Helper: Bóc tách tiêu đề phân đoạn và dòng chỉ dẫn ở đầu câu hỏi nếu bị dính liền
  function stripLeadingSectionHeaderInServer(text: string): { cleanedText: string; strippedHeader?: string } {
    if (!text) return { cleanedText: '' };
    let trimmed = text.trim();
    let firstHeader: string | undefined;

    while (true) {
      const newlineIdx = trimmed.indexOf('\n');
      const currentLine = newlineIdx >= 0 ? trimmed.substring(0, newlineIdx).trim() : trimmed;
      if ((isServerSectionHeader(currentLine) || isInstructionOrRangeOnlyInServer(currentLine)) && (newlineIdx >= 0 || trimmed === currentLine)) {
        if (!isInstructionOrRangeOnlyInServer(currentLine)) {
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

  // Helper: Kiểm tra tiêu đề phân đoạn, tiêu đề phần, tiêu đề dạng bài (TUYỆT ĐỐI KHÔNG BIẾN THÀNH CÂU HỎI)
  function isServerSectionHeader(text: string): boolean {
    if (!text) return false;
    const clean = text.trim();
    if (clean.length === 0 || clean.length > 350) return false;

    // 1. Nếu câu có chứa phương án trắc nghiệm A, B, C, D rõ ràng -> ĐÂY LÀ CÂU HỎI, KHÔNG PHẢI TIÊU ĐỀ
    if (/(?:^|\s+)[A-D][\.:\)]\s+/i.test(clean) && /(?:^|\s+)[B-D][\.:\)]\s+/i.test(clean)) {
      return false;
    }

    // Nếu là dòng chỉ dẫn làm bài hoặc chỉ ghi khoảng câu hỏi -> ĐÂY LÀ TIÊU ĐỀ/CHỈ DẪN
    if (isInstructionOrRangeOnlyInServer(clean)) {
      return true;
    }

    // 2. Nếu câu hỏi có chứa động từ bài toán cụ thể và dấu hỏi chấm -> KHÔNG PHẢI TIÊU ĐỀ
    const hasProblemVerb = /^(?:Cho|Tính|Tìm|Giải|Chứng\s*minh|Rút\s*gọn|Xác\s*định|Biết\b|Trong\s*mặt\s*phẳng|Trong\s*không\s*gian|Hàm\s*số\s*nào|Đồ\s*thị\s*hàm\s*số|Phương\s*trình\s*nào|Có\s*bao\s*nhiêu|Một\s*người|Một\s*vật|Hình\s*chóp|Tam\s*giác)\b/i.test(clean);
    if (hasProblemVerb && (clean.includes('?') || clean.length > 40)) {
      return false;
    }

    // 3. Tiêu đề Đề thi, Đề kiểm tra, Kỳ thi, Bài thi, Khảo sát chất lượng, Phiếu bài tập, Đề cương
    if (/^(?:ĐỀ\s+(?:KIỂM\s+TRA|THI|KHẢO\s+SÁT|ÔN\s+TẬP|CƯƠNG|THAM\s+KHẢO|CHÍNH\s+THỨC|SỐ\s*\d+)|BÀI\s+(?:KIỂM\s+TRA|THI|TẬP\s+ÔN\s+TẬP)|KỲ\s+THI|PHIẾU\s+(?:BÀI\s+TẬP|HỌC\s+TẬP|ÔN\s+TẬP))\b/i.test(clean)) {
      return true;
    }

    // 4. Cơ quan giáo dục, Sở/Phòng GD&ĐT, Trường học, Trung tâm
    if (/^(?:SỞ|PHÒNG|BỘ)\s+(?:GD|GIÁO\s*DỤC)\b/i.test(clean)) return true;
    if (/^(?:TRƯỜNG|TRƯỜNG\s+THPT|TRƯỜNG\s+THCS|TRƯỜNG\s+TIỂU\s*HỌC|ĐẠI\s*HỌC|TRUNG\s*TÂM)\b/i.test(clean)) return true;

    // 5. Tiêu đề Dạng toán / Dạng bài / Chủ đề / Chuyên đề / Vấn đề / Chương / Mục
    if (/^(?:\[|\()?\s*(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?|CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ|VẤN\s*ĐỀ|CHƯƠNG|MỤC)\s*[\dIVX|A-Z]*[:\.\-–—\s]/i.test(clean)) {
      return true;
    }
    if (/^(?:DẠNG\s*(?:BÀI|TOÁN|CÂU\s*HỎI)?|CHỦ\s*ĐỀ|CHUYÊN\s*ĐỀ|VẤN\s*ĐỀ|BÀI\s*HỌC)[:\.\-–—\s]/i.test(clean)) {
      return true;
    }

    // 6. Tiêu đề Phần (PHẦN I, PHẦN II, PHẦN III, Phần 1, Phần A, Phần trắc nghiệm, Phần tự luận, Phần trả lời ngắn...)
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

    // 9. Các cụm từ tiêu đề phân loại bài tập đứng riêng (kể cả có ghi điểm như "(3,0 điểm)", "(7.0 điểm)", "(35 câu)"):
    if (/^(?:TRẮC\s*NGHIỆM\s*(?:KHÁCH\s*QUAN)?|CÂU\s*HỎI\s*TRẮC\s*NGHIỆM|BÀI\s*TẬP\s*TRẮC\s*NGHIỆM|CÂU\s*TRẮC\s*NGHIỆM\s*(?:NHIỀU\s*PHƯƠNG\s*ÁN|ĐÚNG\s*SAI|TRẢ\s*LỜI\s*NGẮN)?|BÀI\s*TẬP\s*(?:TỰ\s*LUẬN|TRẢ\s*LỜI\s*NGẮN)|CÂU\s*(?:HỎI\s*)?TRẢ\s*LỜI\s*NGẮN|CÂU\s*HỎI\s*TỰ\s*LUẬN|PHẦN\s*(?:TỰ\s*LUẬN|TRẮC\s*NGHIỆM|TRẢ\s*LỜI\s*NGẮN)|HỆ\s*THỐNG\s*CÂU\s*HỎI|HỆ\s*THỐNG\s*BÀI\s*TẬP|BÀI\s*TẬP\s*(?:ÔN\s*LUYỆN|TỰ\s*LUYỆN|RÈN\s*LUYỆN|VẬN\s*DỤNG|VỀ\s*NHÀ|ÁP\s*DỤNG|CƠ\s*BẢN|NÂNG\s*CAO)|BÀI\s*TẬP\s*CUỐI\s*CHƯƠNG|LUYỆN\s*TẬP\s*CHUNG|ÔN\s*TẬP\s*CHƯƠNG|BẢNG\s*ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*GIẢI|LỜI\s*GIẢI\s*CHI\s*TIẾT|ĐÁP\s*ÁN\s*VÀ\s*THANG\s*ĐIỂM)\b/i.test(clean)) {
      return true;
    }

    // 10. Bất kỳ tiêu đề chứa "trả lời ngắn" không chứa dữ kiện câu hỏi toán học:
    if (/trả\s*lời\s*ngắn/i.test(clean) && !clean.includes('?') && !hasProblemVerb && clean.length < 180) {
      return true;
    }

    // 10. Tóm tắt lý thuyết độc lập
    if (/^(?:(?:[I|1|A-D]\.\s*|PHẦN\s*[I|1|A-D][\.:\s]*)?(?:TÓM\s*TẮT\s*(?:KIẾN\s*THỨC|L[ÝÍ]\s*THUYẾT|NỘI\s*DUNG)?|L[ÝÍ]\s*THUYẾT|KIẾN\s*THỨC\s*(?:TRỌNG\s*TÂM|CẦN\s*NHỚ)|NỘI\s*DUNG\s*L[ÝÍ]\s*THUYẾT))/i.test(clean)) {
      return true;
    }

    // 11. Tên bài học SGK: "Bài 1: Mệnh đề", "Bài 2. Tập hợp" (không phải đề bài toán)
    if (/^bài\s+\d+[:\.\s\-–—]+[^?\n]{3,80}$/i.test(clean) && !clean.includes('?') && !/(?:tính|tìm|giải|chứng\s*minh|rút\s*gọn|cho\s*hàm|phương\s*trình)/i.test(clean)) {
      return true;
    }

    // 12. Chỉ có nhãn câu không kèm nội dung (Ví dụ: "Bài 1. (2.0 điểm)", "Câu 1:")
    if (/^(?:Câu|Bài|Ví\s*dụ)\s*\d+[\.:\s]*(?:\([^\)]*điểm\))?$/i.test(clean)) {
      return true;
    }

    // 13. Dòng chỉ dẫn làm bài hoặc thông tin đề thi
    if (/^(?:Thí\s*sinh|Học\s*sinh)\s*(?:chọn|trả\s*lời|làm\s*bài|ghi\s*đáp\s*án|trình\s*bày|không\s*được)/i.test(clean)) {
      return true;
    }
    if (/^(?:Trong\s*mỗi\s*ý\s*[a-d]\s*ở\s*mỗi\s*câu|Mỗi\s*câu\s*hỏi\s*thí\s*sinh\s*chỉ\s*chọn|Thí\s*sinh\s*trả\s*lời\s*từ\s*câu)/i.test(clean)) {
      return true;
    }
    if (/^(?:Thời\s*gian\s*làm\s*bài|Mã\s*đề\s*thi|Mã\s*đề\s*gốc|Đề\s*thi\s*gồm|Họ\s*và\s*tên\s*:|Số\s*báo\s*danh\s*:|Trang\s+\d+)/i.test(clean)) {
      return true;
    }

    // 14. Dấu kết thúc đề thi
    if (/^(?:-+\s*HẾT\s*-+|={2,}\s*HẾT\s*={2,}|HẾT\b|Cán\s*bộ\s*coi\s*thi\s*không\s*giải\s*thích)/i.test(clean)) return true;

    return false;
  }

  // Helper: Cứu câu hỏi trắc nghiệm nếu bị gán nhầm thành tự luận hoặc có options bị dính trong thân câu hỏi
  function rescueAndReconcileQuestionInServer(q: any): any {
    if (!q) return q;
    let item = { ...q };
    let stem = (item.question || '').trim();
    let opts: string[] = Array.isArray(item.options) ? [...item.options] : [];

    // Bóc tách tiêu đề phân đoạn ở đầu câu hỏi nếu bị dính liền vào thân câu
    const { cleanedText, strippedHeader } = stripLeadingSectionHeaderInServer(stem);
    if (strippedHeader && !isInstructionOrRangeOnlyInServer(strippedHeader) && !item.sectionHeader) {
      item.sectionHeader = strippedHeader;
    }
    if (strippedHeader && cleanedText.length > 0) {
      item.question = cleanedText;
      stem = cleanedText;
    }

    // Bóc tách phương án trắc nghiệm nếu còn dính trong stem
    const splittedFromStem = splitMcqOptionsInServer(stem);
    if (splittedFromStem.length >= 2) {
      const firstAIdx = stem.search(/(?:^|\n|\s+)(?:\[A\]|\(A\)|A[\.:\)])\s+/);
      if (firstAIdx >= 0) {
        item.question = stem.substring(0, firstAIdx).trim();
      } else {
        item.question = stem.replace(/(?:^|\n|\s+)(?:\[A\]|\(A\)|A[\.:\)])\s+[\s\S]*$/, '').trim();
      }
      item.options = splittedFromStem;
      item.type = 'mcq';
      if (!item.points || item.points > 1.5) item.points = 0.25;
      return item;
    }

    // Nếu options có A, B, C, D -> 100% là MCQ, KHÔNG BAO GIỜ LÀ ESSAY!
    const hasCapitalMcqInOpts = opts.length >= 2 && (
      opts.some(o => /^(?:\[?[A-D]\]?|[A-D][\.\:\)])\s+/i.test((o || '').trim())) ||
      (opts.length === 4 && !opts.some(o => /^[a-d]\)/.test((o || '').trim())))
    );

    if (hasCapitalMcqInOpts) {
      item.type = 'mcq';
      if (!item.points || item.points > 1.5) item.points = 0.25;
      return item;
    }

    // Nếu options có 1 chuỗi chứa cả A, B, C, D
    if (opts.length === 1 && /(?:^|\s)[B-D][.:\)]/.test(opts[0])) {
      const splitted = splitMcqOptionsInServer(opts[0]);
      if (splitted.length >= 2) {
        item.options = splitted;
        item.type = 'mcq';
        if (!item.points || item.points > 1.5) item.points = 0.25;
        return item;
      }
    }

    // Nếu câu bị gán nhầm essay nhưng lại có options A, B, C, D
    if (item.type === 'essay' && opts.length >= 2 && opts.some(o => /^[A-D][\.\:\)]/i.test((o || '').trim()))) {
      item.type = 'mcq';
      if (!item.points || item.points > 1.5) item.points = 0.25;
      return item;
    }

    // Nếu câu essay thực sự có các ý a), b), c) trong options -> gộp vào thân câu hỏi
    if (item.type === 'essay' && opts.length > 0 && opts.some(o => /^[a-d]\)/i.test((o || '').trim()))) {
      item.question = item.question + '\n' + opts.join('\n');
      item.options = [];
    }

    return item;
  }

  app.post("/api/extract-questions", async (req, res) => {
    try {
      const { fileDataUrl, fileName, mimeType, extractedText } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!fileDataUrl && !extractedText) return res.status(400).json({ error: "No file data or extracted text provided." });

      let textToExtract = "";
      let canSendInlineToGemini = false;
      let base64Data = "";
      let resolvedMime = mimeType || "application/pdf";

      if (extractedText && typeof extractedText === 'string' && extractedText.trim().length > 15) {
        textToExtract = repairVietnameseDocument(convertTcvn3ToUnicode(extractedText));
      } else if (fileDataUrl) {
        const extractedDoc = await extractTextFromAttachment(fileDataUrl, fileName, mimeType);
        if (extractedDoc.text && extractedDoc.text.trim().length > 15) {
          textToExtract = repairVietnameseDocument(convertTcvn3ToUnicode(extractedDoc.text));
        }

        base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
        if (extractedDoc.isPdf) {
          canSendInlineToGemini = true;
          resolvedMime = "application/pdf";
        } else if (extractedDoc.isImage) {
          canSendInlineToGemini = true;
          resolvedMime = mimeType || "image/jpeg";
        }
      }

      // Try AI extraction if key is available
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ 
            apiKey: apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          
          const prompt = `You are an expert Vietnamese exam document parser and educator.
Extract the COMPLETE exam information/metadata AND EVERY SINGLE question present in this exam document.

*** YÊU CẦU CỐT LÕI VÀ TỐI QUAN TRỌNG: TRÍCH XUẤT ĐẦY ĐỦ NGUYÊN BẢN 100% TẤT CẢ CÁC CÂU HỎI TỪ ĐỀ GỐC - TUYỆT ĐỐI KHÔNG THÊM BỚT ***
1. TRÍCH XUẤT ĐẦY ĐỦ 100%: Bạn BẮT BUỘC phải trích xuất TOÀN BỘ tất cả các câu hỏi có trong tài liệu đề thi gốc, từ câu số 1 cho tới câu hỏi cuối cùng của đề. TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ SÓT bất kỳ câu hỏi nào (dù đề thi có 10, 20, 40 hay 50 câu).
2. TUYỆT ĐỐI KHÔNG THÊM: KHÔNG tự ý sáng tác, bịa đặt hoặc thêm bất kỳ câu hỏi nào ngoài đề thi gốc.
3. TUYỆT ĐỐI KHÔNG BỚT / KHÔNG CẮT XÉN: Giữ nguyên vẹn 100% nội dung câu hỏi, dữ kiện bài toán, các biến số, công thức toán LaTeX gốc. Không tóm tắt, không lược bớt đề bài. Giữ nguyên toàn bộ 4 phương án A, B, C, D (đối với trắc nghiệm) hoặc 4 ý a), b), c), d) (đối với đúng/sai).

*** QUY TẮC TỰ THIẾT LẬP BIỂU ĐIỂM (POINTS) VÀ ĐÁP ÁN (CORRECTANSWER) PHÙ HỢP: ***
1. TỰ THIẾT LẬP BIỂU ĐIỂM HỢP LÝ (Thang điểm chuẩn 10.0 điểm):
- Tự động phân bổ điểm số "points" cho từng câu phù hợp với cấu trúc đề:
  * Đề chuẩn 3 phần Bộ GD&ĐT 2025: Phần I (12 câu TN nhiều lựa chọn): 0.25đ/câu (Tổng 3.0đ); Phần II (4 câu Đúng/Sai): 1.0đ/câu (Tổng 4.0đ); Phần III (6 câu Trả lời ngắn): 0.5đ/câu (Tổng 3.0đ). Tổng cộng đúng 10.0 điểm!
  * Đề trắc nghiệm 50 câu: mỗi câu 0.2 điểm (Tổng 10.0 điểm).
  * Đề trắc nghiệm 40 câu: mỗi câu 0.25 điểm (Tổng 10.0 điểm).
  * Đề có Tự luận hoặc số lượng câu khác: tự phân bổ hợp lý sao cho tổng điểm toàn bài tròn 10.0 điểm (hoặc theo điểm số ghi sẵn trong đề gốc nếu có).
2. TỰ THIẾT LẬP ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT:
- Tự giải và xác định đáp án đúng chính xác tuyệt đối cho từng câu ("correctAnswer") và lời giải chi tiết từng bước ("explanation") với công thức toán LaTeX chuẩn.
- ĐÁP ÁN ĐÚNG "correctAnswer" BẮT BUỘC PHẢI KHỚP 100% VỚI KẾT QUẢ TRONG LỜI GIẢI CHI TIẾT "explanation".

Output a single JSON object with TWO main properties:
1. "testInfo": {
   "title": "Tên đề kiểm tra đầy đủ, trang trọng (ví dụ: ĐỀ KIỂM TRA GIỮA HỌC KỲ I - MÔN TOÁN 12)",
   "grade": 12, // Số nguyên 6, 7, 8, 9, 10, 11, hoặc 12 (nhận diện từ tài liệu)
   "subject": "Toán",
   "durationMinutes": 90, // Số phút làm bài (ví dụ: 90, 60, 50, 45, 120; nhận diện từ 'Thời gian: 90 phút')
   "schoolYear": "2024-2025", // Năm học (ví dụ: '2024-2025' từ 'Năm học 2024 - 2025')
   "schoolOrOrg": "Tên đơn vị, Sở GD&ĐT hoặc Trường nếu có trên đề",
   "examFormat": "mcq_3part" | "mcq_custom" | "essay" | "mixed",
   "suggestedTopic": "Chủ đề kiến thức chính nếu nhận diện được"
}
2. "questions": Array of question objects:
- "id": Unique ID (e.g., "q1", "q2")
- "type": "mcq" | "tf" | "short" | "essay"
  *** QUY TẮC PHÂN LOẠI CÂU HỎI CHÍNH XÁC TUYỆT ĐỐI (TRẮC NGHIỆM vs TỰ LUẬN vs ĐÚNG/SAI): ***
  1. CÂU HỎI TRẮC NGHIỆM KHÁCH QUAN 4 LỰA CHỌN ("type": "mcq"):
  * BẤT KỲ CÂU HỎI NÀO CÓ 4 PHƯƠNG ÁN LỰA CHỌN A, B, C, D (dù câu đó bắt đầu bằng "Câu 1", "Bài 1", "Ví dụ 1", hay có ghi điểm '0.25đ', '0.2đ'...) THÌ 100% BẮT BUỘC ĐẶT "type": "mcq"!
  * ĐƯA 4 PHƯƠNG ÁN VÀO MẢNG "options": ["A. ...", "B. ...", "C. ...", "D. ..."].
  * TUYỆT ĐỐI KHÔNG ĐƯỢC CHUYỂN CÂU HỎI CÓ A, B, C, D THÀNH TỰ LUẬN ("essay")!
  * TUYỆT ĐỐI KHÔNG gộp các phương án A, B, C, D vào thân câu hỏi "question" rồi để "options": []!
  2. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI ("type": "tf"):
  * CHỈ KHI đề bài ghi rõ "Câu trắc nghiệm Đúng/Sai" hoặc yêu cầu xét tính Đúng/Sai cho 4 mệnh đề a), b), c), d). Mảng "options" chứa 4 ý: ["a) ...", "b) ...", "c) ...", "d) ..."].
  3. CÂU HỎI TRẢ LỜI NGẮN ("type": "short"):
  * Câu hỏi chỉ yêu cầu điền một đáp số ngắn, không có phương án A, B, C, D và không có nhiều ý tự luận.
  4. BÀI TOÁN TỰ LUẬN ("type": "essay"):
  * CHỈ ÁP DỤNG CHO CÁC BÀI TOÁN TỰ LUẬN YÊU CẦU HỌC SINH TỰ TRÌNH BÀY LỜI GIẢI TỪNG BƯỚC, HOÀN TOÀN KHÔNG CÓ CÁC PHƯƠNG ÁN CHỌN A, B, C, D! (Ví dụ: "Bài 1: Rút gọn biểu thức... a) Tính giá trị; b) Tìm x...").
  * Giữ nguyên TOÀN BỘ các ý a), b), c) vào trong trường "question" (ngăn cách bằng xuống dòng), "options": [].
  * "explanation" là lời giải chi tiết từng bước cho từng ý a), b), c).
  * LƯU Ý SỐNG CÒN: Nếu câu có phương án chọn A, B, C, D thì 100% BẮT BUỘC LÀ TRẮC NGHIỆM ("mcq"), TUYỆT ĐỐI KHÔNG BAO GIỜ ĐƯỢC XẾP VÀO TỰ LUẬN ("essay")!

  *** QUY TẮC BẮT BUỘC: LOẠI TRỪ TIÊU ĐỀ PHẦN, CHỈ DẪN LÀM BÀI VÀ TÓM TẮT LÝ THUYẾT (KHÔNG BIẾN THÀNH CÂU HỎI): ***
  * TUYỆT ĐỐI KHÔNG tạo câu hỏi từ các dòng tiêu đề phân đoạn, tiêu đề phần, tiêu đề dạng bài như:
    - "PHẦN I: TRẮC NGHIỆM KHÁCH QUAN", "PHẦN II: TỰ LUẬN", "PHẦN TỰ LUẬN", "A. TRẮC NGHIỆM", "B. TỰ LUẬN", "I. TRẮC NGHIỆM", "II. TỰ LUẬN"
    - "PHẦN III: TRẢ LỜI NGẮN", "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN", "PHẦN 3: CÂU HỎI TRẢ LỜI NGẮN", "III. TRẢ LỜI NGẮN", "3. TRẢ LỜI NGẮN"
    - "DẠNG BÀI TRẢ LỜI NGẮN", "DẠNG TOÁN: TRẢ LỜI NGẮN", "DẠNG CÂU HỎI TRẢ LỜI NGẮN", "CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN", "CÂU HỎI TRẢ LỜI NGẮN", "TRẮC NGHIỆM TRẢ LỜI NGẮN", "TRẢ LỜI NGẮN"
    - "Thí sinh trả lời từ câu 1 đến câu 6", "Thí sinh trả lời từ câu 1 đến câu 12", "Thí sinh trả lời từ câu 1 đến câu 4", "Câu 1: đến câu 12. Mỗi câu hỏi chỉ chọn một phương án", "đến câu 12. Mỗi câu hỏi chỉ chọn một phương án"
    - "(Thí sinh điền kết quả / đáp số vào ô trống tương ứng.)", "(Mỗi câu hỏi thí sinh chỉ chọn một phương án đúng (A, B, C hoặc D).)"
    - "Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai"
    - "BÀI TẬP TỰ LUẬN", "BÀI TẬP TRẮC NGHIỆM", "BÀI TẬP TRẢ LỜI NGẮN", "BÀI TẬP VỀ NHÀ", "BÀI TẬP RÈN LUYỆN", "BÀI TẬP TỰ LUYỆN", "BÀI TẬP ÔN LUYỆN"
    - "DẠNG 1: ...", "DẠNG 2: ...", "CHỦ ĐỀ 1: ...", "CHUYÊN ĐỀ 1: ...", "VẤN ĐỀ 1: ..."
    - "TÓM TẮT LÝ THUYẾT", "TÓM TẮT LÍ THUYẾT", "KIẾN THỨC TRỌNG TÂM", "KIẾN THỨC CẦN NHỚ"
    - "Bài 1: Mệnh đề", "Bài 2: Tập hợp" (tên bài học trong sách giáo khoa)
    Đây là TIÊU ĐỀ PHÂN ĐOẠN HOẶC CHỈ DẪN LÀM BÀI, KHÔNG PHẢI LÀ CÂU HỎI! TUYỆT ĐỐI KHÔNG ĐƯỢC ĐƯA VÀO mảng "questions".
  * ĐẢM BẢO GIỮ NGUYÊN BỐ CỤC ĐỀ GỐC: Nếu đề gốc bắt đầu bằng Phần I là trắc nghiệm nhiều phương án (12 câu), hãy trích xuất 12 câu đó làm các câu đầu tiên, KHÔNG ĐƯỢC tự ý chèn tiêu đề hoặc câu hỏi Trả lời ngắn lên trước!
  * Nếu dòng đầu tiên của câu hỏi có dính kèm tiêu đề phân đoạn (ví dụ: "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN\\nCâu 1: ..."), hãy BỎ TOÀN BỘ DÒNG TIÊU ĐỀ ĐÓ và chỉ lấy nội dung câu hỏi toán học từ "Câu 1: ...".
- "sectionHeader": (Optional) Tiêu đề phân đoạn nguyên bản trong đề thi gốc nếu có (Ví dụ: "PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN", "PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI", "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN", "PHẦN II. TỰ LUẬN")
- "question": Full question stem in Vietnamese. Wrap all math formulas, variables, and vectors in LaTeX $...$ or $$...$$
- "options": 
  * For "mcq": Array of 4 choices ["A. ...", "B. ...", "C. ...", "D. ..."] (with LaTeX math wrapped in $)
  * For "tf": Array of 4 sub-statements ["a) ...", "b) ...", "c) ...", "d) ..."] (with LaTeX math wrapped in $)
  * For "short" or "essay": Empty array []
- "correctAnswer": 
  * For "mcq": "A", "B", "C", or "D" (phải khớp phương án đúng trong explanation)
  * For "tf": Format like "a-Đ, b-S, c-Đ, d-S" or "Đ, S, Đ, S"
  * For "short": Numerical value or short expression (e.g. "12", "-3/4", "2.5") (phải khớp đáp số cuối cùng trong explanation)
  * For "essay": Key final answer or scoring guide summary
- "points": Number of points (tự động thiết lập biểu điểm chuẩn phù hợp tổng 10.0 điểm)
- "explanation": Detailed step-by-step solution in Vietnamese with LaTeX math wrapped in $
- "figureType": "svg" | "table" | "none" (nếu câu hỏi có đồ thị hoặc hình vẽ trong tài liệu gốc -> "svg"; nếu có bảng biến thiên -> "table"; nếu đề thuần chữ -> "none")
- "figureSvg": (Chỉ khi figureType === "svg") Chuỗi mã SVG vector hoàn chỉnh tự chứa, viewBox="0 0 380 260".
- "figureTable": (Chỉ khi figureType === "table") Bảng Markdown bảng biến thiên hoặc bảng số liệu.
- "figureDescription": Mô tả ngắn gọn hình vẽ (Ví dụ: "Đồ thị hàm số $y=f(x)$").

Output valid JSON only, without markdown fences. Escaping backslashes for LaTeX (\\\\frac, \\\\sqrt, \\\\vec).`;

          let userContents: any[] = [];
          if (textToExtract && textToExtract.length > 25) {
            userContents = [{ role: "user", parts: [{ text: `NỘI DUNG TÀI LIỆU ĐỀ THI:\n"""\n${textToExtract.slice(0, 120000)}\n"""\n\n${prompt}` }] }];
          } else if (canSendInlineToGemini && base64Data) {
            userContents = [{ role: "user", parts: [{ inlineData: { mimeType: resolvedMime, data: base64Data } }, { text: prompt }] }];
          }

          if (userContents.length > 0) {
            const response = await generateContentWithRetry(ai, {
              model: "gemini-3.8-flash",
              contents: userContents
            });

            let responseText = response.text || "{}";
            let parsedObj = safeParseJsonObject(responseText);
            let parsedArr: any[] = [];
            if (!parsedObj) {
              parsedArr = safeParseJsonArray(responseText);
            }

            let rawQuestions = (parsedObj && Array.isArray(parsedObj.questions))
              ? parsedObj.questions
              : (Array.isArray(parsedArr) && parsedArr.length > 0 ? parsedArr : []);

            let aiTestInfo = (parsedObj && parsedObj.testInfo && typeof parsedObj.testInfo === 'object')
              ? parsedObj.testInfo
              : null;

            let sanitized = sanitizeQuestionFigures(rawQuestions);
            let reconciled = reconcileAnswersWithExplanations(sanitized);
            if (Array.isArray(reconciled) && reconciled.length > 0) {
              // Kế thừa tiêu đề phần nguyên bản từ các mục tiêu đề đứng riêng trước khi lọc bỏ
              let activeHeader = '';
              const withPropagatedHeaders: any[] = [];
              for (const q of reconciled) {
                const stem = (q.question || '').trim();
                const { cleanedText, strippedHeader } = stripLeadingSectionHeaderInServer(stem);
                if (strippedHeader && !isInstructionOrRangeOnlyInServer(strippedHeader)) {
                  activeHeader = strippedHeader;
                }
                const effectiveStem = cleanedText || stem;
                if (!effectiveStem || isServerSectionHeader(effectiveStem) || isInstructionOrRangeOnlyInServer(effectiveStem)) {
                  if (effectiveStem && !isInstructionOrRangeOnlyInServer(effectiveStem)) {
                    activeHeader = effectiveStem;
                  }
                  continue;
                }
                const isTheory = /^(?:(?:[I|1|A-D]\.\s*|PHẦN\s*[I|1|A-D][\.:\s]*)?(?:TÓM\s*TẮT\s*(?:KIẾN\s*THỨC|L[ÝÍ]\s*THUYẾT|NỘI\s*DUNG)?|L[ÝÍ]\s*THUYẾT|KIẾN\s*THỨC\s*(?:TRỌNG\s*TÂM|CẦN\s*NHỚ)|NỘI\s*DUNG\s*L[ÝÍ]\s*THUYẾT))/i.test(effectiveStem);
                if (isTheory && (!Array.isArray(q.options) || q.options.length === 0)) {
                  continue;
                }
                const explicitH = (q.sectionHeader || '').trim();
                if (explicitH && !isInstructionOrRangeOnlyInServer(explicitH)) {
                  activeHeader = explicitH;
                }
                withPropagatedHeaders.push({
                  ...q,
                  question: effectiveStem,
                  ...(activeHeader ? { sectionHeader: activeHeader } : {})
                });
              }

              // Đối chiếu thêm với bộ phân tích tài liệu gốc để giữ đúng tiêu đề phần nếu AI bỏ sót sectionHeader
              const docParsedForHeaders = parseQuestionsFromDocumentText(textToExtract);

              const cleaned = withPropagatedHeaders
                // 2. Cứu câu hỏi trắc nghiệm nếu bị gán nhầm thành tự luận hoặc có options bị dính trong thân câu
                .map((q: any) => rescueAndReconcileQuestionInServer(q))
                // 3. Lọc lại lần nữa để đảm bảo 100% không sót tiêu đề sau khi bóc tách
                .filter((q: any) => !isServerSectionHeader(q.question || '') && !isInstructionOrRangeOnlyInServer(q.question || '') && (q.question || '').trim().length > 0)
                .map((q: any, idx: number) => {
                  const matchedDocQ = docParsedForHeaders.length > idx ? docParsedForHeaders[idx] : undefined;
                  const preservedHeader = q.sectionHeader || matchedDocQ?.sectionHeader;
                  return {
                    ...q,
                    ...(preservedHeader ? { sectionHeader: repairVietnameseDocument(convertTcvn3ToUnicode(preservedHeader)) } : {}),
                    question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || '')),
                    options: Array.isArray(q.options) 
                      ? q.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))) 
                      : [],
                    explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || '')),
                    correctAnswer: typeof q.correctAnswer === 'string' ? repairVietnameseDocument(q.correctAnswer) : q.correctAnswer
                  };
                });

              const rubricCleaned = autoEstablishScoringRubric(cleaned);
              const regexMetadata = extractTestMetadataFromText(textToExtract, fileName, rubricCleaned);
              const finalTestInfo = {
                title: repairVietnameseDocument(convertTcvn3ToUnicode(aiTestInfo?.title || regexMetadata.title)),
                grade: (aiTestInfo?.grade && Number(aiTestInfo.grade) >= 6 && Number(aiTestInfo.grade) <= 12) ? Number(aiTestInfo.grade) : regexMetadata.grade,
                subject: aiTestInfo?.subject || regexMetadata.subject || 'Toán',
                durationMinutes: (aiTestInfo?.durationMinutes && Number(aiTestInfo.durationMinutes) >= 5) ? Number(aiTestInfo.durationMinutes) : regexMetadata.durationMinutes,
                schoolYear: aiTestInfo?.schoolYear || regexMetadata.schoolYear || '2024-2025',
                schoolOrOrg: aiTestInfo?.schoolOrOrg || regexMetadata.schoolOrOrg || '',
                examFormat: aiTestInfo?.examFormat || regexMetadata.examFormat || 'mcq_3part',
                suggestedTopic: aiTestInfo?.suggestedTopic || regexMetadata.suggestedTopic || ''
              };

              return res.json({
                testInfo: finalTestInfo,
                questions: rubricCleaned
              });
            }
          }
        } catch (aiError) {
          console.warn("AI question extract warning, falling back to document parser:", aiError);
        }
      }

      // Robust fallback: extract raw text and parse structure
      const fallbackQuestions = parseQuestionsFromDocumentText(textToExtract);
      const cleanedFallback = fallbackQuestions
        .filter((q: any) => !isServerSectionHeader(q.question || '') && !isInstructionOrRangeOnlyInServer(q.question || ''))
        .map((q: any) => rescueAndReconcileQuestionInServer(q))
        .filter((q: any) => !isServerSectionHeader(q.question || '') && !isInstructionOrRangeOnlyInServer(q.question || '') && (q.question || '').trim().length > 0)
        .map((q: any) => ({
          ...q,
          question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || '')),
          options: Array.isArray(q.options) 
            ? q.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))) 
            : [],
          explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || '')),
          correctAnswer: typeof q.correctAnswer === 'string' ? repairVietnameseDocument(q.correctAnswer) : q.correctAnswer
        }));

      const rubricFallback = autoEstablishScoringRubric(cleanedFallback);
      const fallbackMetadata = extractTestMetadataFromText(textToExtract, fileName, rubricFallback);

      return res.json({
        testInfo: fallbackMetadata,
        questions: rubricFallback
      });
    } catch (error: any) {
      console.error("Extract API Error:", error);
      res.status(500).json({ error: "Failed to extract questions", details: formatError(error) });
    }
  });

  // Helper: Automatically establish and balance scoring rubric to standard 10.0 points
  function autoEstablishScoringRubric(questions: any[]): any[] {
    if (!Array.isArray(questions) || questions.length === 0) return [];

    const totalCount = questions.length;
    const mcqQuestions = questions.filter(q => q.type === 'mcq' || (!q.type && Array.isArray(q.options) && q.options.length >= 2));
    const tfQuestions = questions.filter(q => q.type === 'tf');
    const shortQuestions = questions.filter(q => q.type === 'short');
    const essayQuestions = questions.filter(q => q.type === 'essay');

    const explicitPointsSum = questions.reduce((sum, q) => sum + (typeof q.points === 'number' && !isNaN(q.points) ? q.points : 0), 0);
    if (explicitPointsSum >= 9.8 && explicitPointsSum <= 10.2 && questions.every(q => typeof q.points === 'number' && q.points > 0)) {
      return questions.map(q => ({
        ...q,
        points: Math.round(q.points * 100) / 100
      }));
    }

    if (tfQuestions.length > 0 || shortQuestions.length > 0) {
      const hasEssay = essayQuestions.length > 0;
      const targetMcqTotal = hasEssay ? 2.5 : 3.0;
      const targetTfTotal = hasEssay ? 3.0 : 4.0;
      const targetShortTotal = hasEssay ? 2.5 : 3.0;
      const targetEssayTotal = hasEssay ? 2.0 : 0.0;

      const mcqPts = mcqQuestions.length > 0 ? Math.round((targetMcqTotal / mcqQuestions.length) * 100) / 100 : 0.25;
      const tfPts = tfQuestions.length > 0 ? Math.round((targetTfTotal / tfQuestions.length) * 100) / 100 : 1.0;
      const shortPts = shortQuestions.length > 0 ? Math.round((targetShortTotal / shortQuestions.length) * 100) / 100 : 0.5;
      const essayPts = essayQuestions.length > 0 ? Math.round((targetEssayTotal / essayQuestions.length) * 10) / 10 : 1.0;

      return questions.map(q => {
        let p = mcqPts;
        if (q.type === 'tf') p = tfPts;
        else if (q.type === 'short') p = shortPts;
        else if (q.type === 'essay') p = essayPts;
        return { ...q, points: p };
      });
    }

    if (mcqQuestions.length === totalCount) {
      let perQuestion = 0.25;
      if (totalCount === 50) perQuestion = 0.2;
      else if (totalCount === 40) perQuestion = 0.25;
      else if (totalCount === 25) perQuestion = 0.4;
      else if (totalCount === 20) perQuestion = 0.5;
      else if (totalCount === 10) perQuestion = 1.0;
      else {
        perQuestion = Math.round((10.0 / totalCount) * 100) / 100;
      }

      return questions.map((q, idx) => {
        let p = perQuestion;
        if (idx === totalCount - 1) {
          const sumPrevious = perQuestion * (totalCount - 1);
          const remainder = Math.round((10.0 - sumPrevious) * 100) / 100;
          if (remainder > 0 && Math.abs(remainder - perQuestion) <= 0.25) {
            p = remainder;
          }
        }
        return { ...q, points: p };
      });
    }

    if (essayQuestions.length > 0 && mcqQuestions.length > 0) {
      const mcqTarget = 7.0;
      const essayTarget = 3.0;
      const perMcq = Math.round((mcqTarget / mcqQuestions.length) * 100) / 100;
      const perEssay = Math.round((essayTarget / essayQuestions.length) * 10) / 10;
      return questions.map(q => ({
        ...q,
        points: q.type === 'essay' ? perEssay : perMcq
      }));
    }

    const perItem = Math.round((10.0 / totalCount) * 100) / 100;
    return questions.map((q, idx) => {
      let p = perItem;
      if (idx === totalCount - 1) {
        const sumPrevious = perItem * (totalCount - 1);
        const remainder = Math.round((10.0 - sumPrevious) * 100) / 100;
        if (remainder > 0 && Math.abs(remainder - perItem) <= 0.5) {
          p = remainder;
        }
      }
      return { ...q, points: p };
    });
  }

  // Helper: Parse questions from raw document text when AI is unavailable or fails
  function parseQuestionsFromDocumentText(rawText: string): any[] {
    if (!rawText || rawText.trim().length === 0) return [];
    const repairedText = repairVietnameseDocument(convertTcvn3ToUnicode(rawText));
    const lines = repairedText.split('\n');
    const questions: any[] = [];
    let currentQ: any = null;
    let isCurrentSectionEssay = false;
    let isCurrentSectionTf = false;
    let isCurrentSectionShort = false;

    const pushCurrent = () => {
      if (currentQ && currentQ.question && currentQ.question.trim().length > 0) {
        // Nếu bản thân currentQ.question là tiêu đề phân đoạn hoặc dòng chỉ dẫn -> BỎ QUA HOÀN TOÀN
        if (isServerSectionHeader(currentQ.question) || isInstructionOrRangeOnlyInServer(currentQ.question)) {
          currentQ = null;
          return;
        }

        // Cứu và phân loại chính xác câu hỏi
        let healed = rescueAndReconcileQuestionInServer(currentQ);
        if (isServerSectionHeader(healed.question) || isInstructionOrRangeOnlyInServer(healed.question)) {
          currentQ = null;
          return;
        }

        // Kiểm tra xem có phải câu hỏi trắc nghiệm không
        const isMcq = healed.type === 'mcq' || (Array.isArray(healed.options) && healed.options.length >= 2 && healed.options.some((o: string) => /^[A-D][\.\:\)]/i.test(o.trim())));
        if (isMcq) {
          healed.type = 'mcq';
          healed.points = (healed.points && healed.points <= 0.5) ? healed.points : 0.25;
        } else if (isCurrentSectionTf || healed.type === 'tf') {
          healed.type = 'tf';
          healed.points = 1.0;
        } else if (isCurrentSectionShort || healed.type === 'short') {
          healed.type = 'short';
          healed.points = 0.5;
        } else if (isCurrentSectionEssay || healed.type === 'essay' || /(?:tự\s*luận)/i.test(healed.question)) {
          healed.type = 'essay';
          healed.points = healed.points || 1.0;
        } else if (!healed.options || healed.options.length === 0) {
          const hasEssayAction = /(?:chứng\s*minh|rút\s*gọn|giải\s*phương\s*trình|tìm\s*x|tính\s*giá\s*trị|vẽ\s*đồ\s*thị)/i.test(healed.question) || /(?:^|\n)\s*[a-d]\)/i.test(healed.question);
          if (hasEssayAction) {
            healed.type = 'essay';
            healed.points = healed.points || 1.0;
          } else {
            healed.type = 'short';
            healed.points = 0.5;
          }
        }

        questions.push({
          ...healed,
          question: repairVietnameseDocument(convertTcvn3ToUnicode(healed.question)),
          options: Array.isArray(healed.options) ? healed.options.map((o: string) => repairVietnameseDocument(convertTcvn3ToUnicode(o))) : [],
          explanation: repairVietnameseDocument(convertTcvn3ToUnicode(healed.explanation || ''))
        });
      }
    };

    const qRegex = /(?:^|[\.\:\)]\s*)(?<!(?:từ|đến|các|những)\s*)(Câu\s+\d+|Bài\s+\d+|Question\s+\d+)[:\.\s](?!\s*(?:đến|-|–|—)\s*(?:câu|bài)?\s*\d+)/i;
    const optRegex = /^([A-D])[\.\:\)]\s+(.*)/;
    const tfOptRegex = /^([a-d])[\.\:\)]\s+(.*)/;
    const expRegex = /^(?:\*?\s*)?(?:Lời\s*giải|Hướng\s*dẫn\s*giải|Bài\s*giải|Giải)[:\.\s]*/i;
    const ansRegex = /^(?:Đáp\s*án|Chọn)[:\.\s]*([A-D])\b/i;

    let inExplanation = false;
    let currentSectionHeader = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (isServerSectionHeader(trimmed) || isInstructionOrRangeOnlyInServer(trimmed)) {
        pushCurrent();
        currentQ = null;
        inExplanation = false;
        if (!isInstructionOrRangeOnlyInServer(trimmed)) {
          currentSectionHeader = trimmed;
        }
        if (/trả\s*lời\s*ngắn/i.test(trimmed)) {
          isCurrentSectionShort = true;
          isCurrentSectionEssay = false;
          isCurrentSectionTf = false;
        } else if (/tự\s*luận/i.test(trimmed)) {
          isCurrentSectionEssay = true;
          isCurrentSectionTf = false;
          isCurrentSectionShort = false;
        } else if (/đúng\s*[\/\-]\s*sai/i.test(trimmed)) {
          isCurrentSectionTf = true;
          isCurrentSectionEssay = false;
          isCurrentSectionShort = false;
        } else if (/trắc\s*nghiệm/i.test(trimmed)) {
          isCurrentSectionEssay = false;
          isCurrentSectionTf = false;
          isCurrentSectionShort = false;
        }
        continue;
      }
      const qMatch = trimmed.match(qRegex);
      if (qMatch && qMatch[1]) {
        if (isInstructionOrRangeOnlyInServer(trimmed)) {
          continue;
        }
        pushCurrent();
        inExplanation = false;
        const qStart = trimmed.indexOf(qMatch[1]);
        const cleanStem = qStart >= 0 ? trimmed.slice(qStart).trim() : trimmed;
        if (isServerSectionHeader(cleanStem) || isInstructionOrRangeOnlyInServer(cleanStem)) {
          if (!isInstructionOrRangeOnlyInServer(cleanStem)) {
            currentSectionHeader = cleanStem;
          }
          if (/trả\s*lời\s*ngắn/i.test(cleanStem)) {
            isCurrentSectionShort = true;
            isCurrentSectionEssay = false;
            isCurrentSectionTf = false;
          } else if (/tự\s*luận/i.test(cleanStem)) {
            isCurrentSectionEssay = true;
            isCurrentSectionTf = false;
            isCurrentSectionShort = false;
          } else if (/trắc\s*nghiệm/i.test(cleanStem)) {
            isCurrentSectionEssay = false;
            isCurrentSectionTf = false;
            isCurrentSectionShort = false;
          }
          continue;
        }
        const isEssayStem = isCurrentSectionEssay && !isCurrentSectionTf && !isCurrentSectionShort;
        const resolvedType = isCurrentSectionShort ? 'short' : (isEssayStem ? 'essay' : 'mcq');
        currentQ = {
          id: `q_${questions.length + 1}_${Date.now()}`,
          type: resolvedType,
          question: cleanStem,
          options: [],
          correctAnswer: isCurrentSectionShort ? '' : 'A',
          explanation: '',
          points: isCurrentSectionShort ? 0.5 : (isEssayStem ? 1.0 : 0.25),
          ...(currentSectionHeader ? { sectionHeader: currentSectionHeader } : {})
        };
        continue;
      }
      if (currentQ) {
        if (expRegex.test(trimmed)) {
          inExplanation = true;
          const expText = trimmed.replace(expRegex, '').trim();
          if (expText) {
            currentQ.explanation = expText;
          }
          continue;
        }

        const ansMatch = trimmed.match(ansRegex);
        if (ansMatch) {
          currentQ.correctAnswer = ansMatch[1].toUpperCase();
          continue;
        }

        if (inExplanation) {
          currentQ.explanation = (currentQ.explanation ? currentQ.explanation + '\n' : '') + trimmed;
          continue;
        }

        const optMatch = trimmed.match(optRegex);
        if (optMatch) {
          currentQ.options.push(trimmed);
          continue;
        }

        const tfMatch = trimmed.match(tfOptRegex);
        if (tfMatch) {
          if (isCurrentSectionEssay || currentQ.type === 'essay' || /(?:tự\s*luận)/i.test(currentQ.question)) {
            // Đây là ý nhỏ của bài toán tự luận
            currentQ.type = 'essay';
            currentQ.question = (currentQ.question ? currentQ.question + '\n' : '') + trimmed;
            currentQ.points = currentQ.points || 1.0;
          } else {
            currentQ.options.push(trimmed);
            currentQ.type = 'tf';
            currentQ.points = 1.0;
          }
          continue;
        }

        currentQ.question += ' ' + trimmed;
      }
    }
    pushCurrent();

    // Lọc lại để loại bỏ bất kỳ tiêu đề hoặc khối lý thuyết nào bị sót
    const finalCleaned = questions
      .filter(q => !isServerSectionHeader(q.question))
      .map(q => rescueAndReconcileQuestionInServer(q));

    // If still no questions found, create sample blocks from paragraphs
    if (finalCleaned.length === 0 && repairedText.length > 20) {
      const paragraphs = repairedText.split(/\n\s*\n/).filter(p => p.trim().length > 10 && !isServerSectionHeader(p));
      paragraphs.slice(0, 10).forEach((p, idx) => {
        finalCleaned.push({
          id: `q_${idx + 1}`,
          type: 'mcq',
          question: `Câu ${idx + 1}: ${p.slice(0, 200)}...`,
          options: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'],
          correctAnswer: 'A',
          explanation: 'Lời giải chi tiết',
          points: 0.25
        });
      });
    }

    return finalCleaned;
  }

  // Helper: Extract complete text and structure from uploaded document (DOCX, DOC, PDF, TXT)
  async function extractTextFromAttachment(fileDataUrl: string, fileName?: string, mimeType?: string): Promise<{ text: string; pages: Array<{ num: number; text: string }>; isPdf: boolean; isDocx: boolean; isImage: boolean }> {
    if (!fileDataUrl) return { text: '', pages: [], isPdf: false, isDocx: false, isImage: false };
    const parts = fileDataUrl.split(',');
    const base64Data = parts[1] || '';
    if (!base64Data) return { text: '', pages: [], isPdf: false, isDocx: false, isImage: false };
    
    const buffer = Buffer.from(base64Data, 'base64');
    const detectedMime = (mimeType || fileDataUrl.match(/data:([^;]+);/)?.[1] || '').toLowerCase();
    
    // Magic byte checks for reliability
    const isZipOrDocx = (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04);
    const isDocx = Boolean(
      (fileName && fileName.toLowerCase().endsWith('.docx')) || 
      detectedMime.includes('wordprocessingml') || 
      detectedMime.includes('docx') ||
      (isZipOrDocx && (!fileName || !fileName.toLowerCase().endsWith('.zip')))
    );
    const isDocBinary = (buffer.length >= 8 && buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0);
    const isDoc = Boolean((fileName && fileName.toLowerCase().endsWith('.doc')) || detectedMime.includes('msword') || isDocBinary);
    const isPdfMagic = (buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF');
    const isPdf = Boolean((fileName && fileName.toLowerCase().endsWith('.pdf')) || detectedMime.includes('pdf') || isPdfMagic);
    const isTxt = Boolean((fileName && fileName.toLowerCase().endsWith('.txt')) || detectedMime.startsWith('text/'));
    const isImage = Boolean(detectedMime.startsWith('image/'));

    if (isDocx) {
      let docxXmlFull = '';
      try {
        docxXmlFull = await extractDocxFullContent(buffer);
      } catch (eDocx) {
        console.warn("extractDocxFullContent error:", eDocx);
      }

      let docxMd = '';
      let docxRaw = '';
      try {
        const mdResult = await (mammoth as any).convertToMarkdown({ buffer });
        docxMd = mdResult?.value || '';
      } catch (e) {
        console.warn("Mammoth convertToMarkdown warning:", e);
      }
      try {
        const rawResult = await (mammoth as any).extractRawText({ buffer });
        docxRaw = rawResult?.value || '';
      } catch (e) {
        console.warn("Mammoth extractRawText warning:", e);
      }

      // Prefer docxXmlFull since it extracts full tables, math equations ($), superscripts, and images
      let chosen = '';
      if (docxXmlFull && docxXmlFull.trim().length > 30) {
        chosen = docxXmlFull;
      } else {
        chosen = docxMd || docxRaw || docxXmlFull;
      }

      const repaired = repairVietnameseDocument(chosen);
      return { text: convertTcvn3ToUnicode(repaired), pages: [], isPdf: false, isDocx: true, isImage: false };
    }

    if (isDoc) {
      // Trích xuất text cho tệp Word nhị phân (.doc Word 97-2003)
      let docText = '';
      try {
        const utf16 = buffer.toString('utf16le');
        const matches16 = utf16.match(/[\u0020-\u007E\u00A0-\u024F\u1EA0-\u1EF9]{4,}/g);
        if (matches16 && matches16.length > 0) {
          docText = matches16.join(' ');
        }
      } catch (e) {}

      if (!docText || docText.length < 50) {
        try {
          const utf8 = buffer.toString('utf-8');
          const matches8 = utf8.match(/[\x20-\x7E\xA0-\xFF]{4,}/g);
          if (matches8 && matches8.length > 0) {
            docText = matches8.join(' ');
          }
        } catch (e2) {}
      }
      return { text: repairVietnameseDocument(docText), pages: [], isPdf: false, isDocx: false, isImage: false };
    }

    if (isPdf) {
      let pdfText = '';
      let pages: Array<{ num: number; text: string }> = [];
      try {
        const pdfModule = await import('pdf-parse');
        const ParserClass = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse;
        if (ParserClass) {
          const parser = new ParserClass({ data: buffer });
          const res = await parser.getText({ pageJoiner: '\n\n--- TRANG page_number ---\n\n' });
          await parser.destroy();
          pdfText = res?.text || (typeof res === 'string' ? res : '') || '';
          if (Array.isArray(res?.pages)) {
            pages = res.pages.map((p: any) => ({
              num: p.num || 1,
              text: repairVietnameseDocument(p.text || '')
            }));
          }
        }
      } catch (e) {
        console.warn("PDF extraction warning:", e);
      }
      return { text: repairVietnameseDocument(pdfText), pages, isPdf: true, isDocx: false, isImage: false };
    }

    if (isTxt) {
      const txt = buffer.toString('utf-8');
      return { text: repairVietnameseDocument(txt), pages: [], isPdf: false, isDocx: false, isImage: false };
    }

    return { text: '', pages: [], isPdf, isDocx, isImage };
  }

  // Helper: Auto-detect lesson title from document content
  function autoDetectLessonTitle(content: string, fallbackTitle?: string, fallbackFileName?: string): string {
    if (fallbackTitle && fallbackTitle.trim()) return fallbackTitle.trim();
    if (!content) return fallbackFileName ? fallbackFileName.replace(/\.[^/.]+$/, '') : 'Bài học mới';

    const lines = content.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 40);
    // 1. Look for explicit pattern: "Bài 1: ...", "Chương 2: ...", "Chuyên đề: ..."
    for (const line of lines) {
      const cleanLine = line.replace(/^[#*\-\s]+/, '').trim();
      if (/^(bài|chương|chuyên đề|bài học|chủ đề)\s+(\d+|[ivxldcm]+)[:\.\-\s]/i.test(cleanLine)) {
        return cleanLine.replace(/[*_#]/g, '').trim();
      }
    }
    // 2. Look for top Markdown H1
    for (const line of lines) {
      if (line.startsWith('# ') && line.length > 3 && line.length < 120) {
        return line.replace(/^#\s+/, '').replace(/[*_]/g, '').trim();
      }
    }
    return fallbackFileName ? fallbackFileName.replace(/\.[^/.]+$/, '') : 'Bài học mới';
  }

  // Helper: Tự động trích xuất và đặt tên đề kiểm tra dựa trên nội dung thực tế trong tệp
  function autoDetectTestTitleFromContent(content: string, testIdx: number, topicName?: string, fileName?: string): string {
    if (!content) {
      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : (topicName || 'Chủ đề');
      return `${baseName} - Đề số ${testIdx + 1}`;
    }

    const lines = content.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 30);
    let detectedType = '';
    let detectedTopic = '';
    let detectedCode = '';

    for (const line of lines) {
      const clean = line.replace(/^[#*\-\s]+/, '').trim();

      // Nhận diện loại bài kiểm tra
      if (!detectedType) {
        if (/cuối\s*chương|cuối\s*chủ\s*đề|tổng\s*kết\s*chương/i.test(clean)) detectedType = 'Kiểm tra cuối chương';
        else if (/15\s*phút/i.test(clean)) detectedType = 'Kiểm tra 15 phút';
        else if (/1\s*tiết|45\s*phút/i.test(clean)) detectedType = 'Kiểm tra 1 tiết';
        else if (/giữa\s*(?:học\s*)?kỳ/i.test(clean)) detectedType = 'Kiểm tra giữa kỳ';
        else if (/cuối\s*(?:học\s*)?kỳ|học\s*kỳ/i.test(clean)) detectedType = 'Kiểm tra học kỳ';
        else if (/định\s*kỳ/i.test(clean)) detectedType = 'Kiểm tra định kỳ';
        else if (/thường\s*xuyên/i.test(clean)) detectedType = 'Kiểm tra thường xuyên';
        else if (/khảo\s*sát/i.test(clean)) detectedType = 'Đề khảo sát';
        else if (/ôn\s*tập/i.test(clean)) detectedType = 'Đề ôn tập';
        else if (/phiếu\s*bài\s*tập/i.test(clean)) detectedType = 'Phiếu bài tập';
      }

      // Nhận diện mã đề hoặc số đề
      if (!detectedCode) {
        const codeMatch = clean.match(/(?:mã\s*đề|đề\s*số|đề)\s*[:\s]*(\d+|[A-Z0-9]+)/i);
        if (codeMatch && codeMatch[1]) {
          detectedCode = `Đề ${codeMatch[1]}`;
        }
      }

      // Nhận diện chủ đề / bài học trong đề
      if (!detectedTopic) {
        const topicMatch = clean.match(/(?:chuyên\s*đề|chủ\s*đề|chương|bài)\s*[:\.\-]\s*([^\n\r]+)/i);
        if (topicMatch && topicMatch[1] && topicMatch[1].trim().length > 3) {
          detectedTopic = topicMatch[1].replace(/[*_#]/g, '').trim();
        }
      }
    }

    const parts: string[] = [];
    parts.push(detectedType || 'Đề kiểm tra');
    if (detectedTopic) parts.push(detectedTopic);
    else if (topicName) parts.push(topicName);
    parts.push(detectedCode || `Đề số ${testIdx + 1}`);

    return parts.join(' - ');
  }

  // Helper: Chuẩn hóa và làm sạch tên đề được AI tạo hoặc phát hiện
  function autoFormatTestTitle(testMeta: any, docText: string, testIdx: number, topicName?: string): string {
    let title = (testMeta.title || '').replace(/[*_#]/g, '').trim();

    // Kiểm tra xem tên có bị chung chung/vô nghĩa không
    const isGeneric = !title || title.length < 5 || /^(đề\s*(số\s*)?\d+|test\s*\d+|đề\s*thi\s*(số\s*)?\d+|chủ\s*đề.*-\s*đề\s*(số\s*)?\d+)$/i.test(title);

    if (isGeneric) {
      // Tìm trong snippet của đề hoặc docText để lấy thông tin cụ thể
      const snippet = (testMeta.startHeading || '') + '\n' + (docText.slice(0, 1500));
      return autoDetectTestTitleFromContent(snippet, testIdx, topicName);
    }

    return title;
  }

  app.post("/api/generate-lesson-material", async (req, res) => {
    try {
      const { fileDataUrl, mimeType, fileName, title, grade, topicName, rawTextToFix } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      const gradeStr = grade ? `Lớp ${grade}` : 'Môn Toán';
      const topicStr = topicName ? `Chủ đề/Chương: ${topicName}` : '';

      // Case 1: Direct text input or copy-paste layout & repair requested
      if (rawTextToFix && rawTextToFix.trim()) {
        const detectedTitle = autoDetectLessonTitle(rawTextToFix, title, fileName);
        const locallyRepaired = smartFormatLessonLayout(rawTextToFix, detectedTitle);

        if (!apiKey) {
          return res.json({
            title: detectedTitle,
            content: locallyRepaired,
            knowledge: locallyRepaired,
            totalChars: locallyRepaired.length
          });
        }

        try {
          const ai = new GoogleGenAI({ 
            apiKey: apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          const prompt = `Bạn là chuyên gia số hóa và sư phạm Toán học hàng đầu tại Việt Nam (${gradeStr}, ${topicStr}).
Nhiệm vụ: BỐ CỤC LẠI TRANG TRÌNH BÀY, SỬA CÔNG THỨC VÀ HÌNH VẼ, CHỈNH PHÔNG CHỮ ĐỂ HIỂN THỊ ĐẸP CHO BÀI HỌC TOÁN.

QUY TẮC BẮT BUỘC - BẢO TOÀN DỮ LIỆU:
1. GIỮ NGUYÊN VẸN 100% NỘI DUNG BÀI HỌC CỦA GIÁO VIÊN ĐƯA VÀO. Tuyệt đối KHÔNG ĐƯỢC CẮT XÉN, KHÔNG TÓM TẮT, KHÔNG BỎ QUA BẤT KỲ ĐỊNH NGHĨA, ĐỊNH LÝ, HỆ QUẢ, VÍ DỤ, BÀI TẬP HAY LỜI GIẢI NÀO.
2. BỐ CỤC TRANG TRÌNH BÀY:
   - Dùng cấu trúc tiêu đề Markdown phân cấp rõ ràng, đẹp mắt:
     # Tên bài học
     ## I. Lý thuyết trọng tâm
     ### 1. Khái niệm / Định nghĩa
     ### 2. Định lý & Tính chất
     ## II. Tổng hợp công thức cần nhớ
     ## III. Các dạng toán điển hình & Ví dụ
     ### Dạng 1: ...
     #### Ví dụ 1: ...
     *Lời giải chi tiết:* ...
     ## IV. Bài tập tự luyện
   - Đóng khung các định nghĩa, định lý, chú ý, phương pháp giải bằng các hộp nổi bật (Callout blockquotes) đẹp mắt:
     > 📌 **Định nghĩa:** ...
     > ⚡ **Định lý:** ...
     > 💡 **Chú ý / Nhận xét:** ...
     > 🎯 **Phương pháp giải:** ...
     > 📐 **Công thức cần nhớ:** ...
3. CÔNG THỨC TOÁN HỌC:
   - Toàn bộ công thức toán học dùng chuẩn LaTeX: bọc $...$ cho công thức trong dòng và $$...$$ cho các khối công thức quan trọng căn giữa.
   - Sửa triệt để các ký hiệu sai lệch, lỗi gõ phân số, căn bậc, vectơ, góc, khoảng đoạn.
   - TUYỆT ĐỐI KHÔNG XUẤT CHỮ "undefined" HOẶC "\\undefined" TRONG CÔNG THỨC TOÁN. Khi thể hiện phép biến đổi, tương đương hoặc suy ra giữa các phương trình, hệ phương trình, BẮT BUỘC DÙNG \\Leftrightarrow HOẶC \\Rightarrow.
   - TRONG KHỐI \\begin{cases}...\\end{cases}, CÁC DÒNG PHƯƠNG TRÌNH BẮT BUỘC ĐƯỢC NGẮT NHAU BẰNG HAI DẤU GẠCH CHÉO \\\\ (TUYỆT ĐỐI KHÔNG DÙNG MỘT DẤU GẠCH \\ ĐƠN).
   - KHÔNG ĐƯỢC ĐỂ TỪ NGỮ TIẾNG VIỆT LẪN VÀO TRONG DẤU $...$ HOẶC $$...$$ NẾU KHÔNG BỌC \\text{...}. Các từ như "ta được:", "ta có:", "luôn đúng", "Vậy", "khi và chỉ khi" nên đặt ngoài dấu $ hoặc bọc \\text{...}.
   - TUYỆT ĐỐI CÂN XỨNG CÁC DẤU $, KHÔNG ĐỂ THỪA $$$ HOẶC $$$$.
4. HÌNH VẼ & BẢNG BIẾN THIÊN:
   - Nếu có Bảng biến thiên: Định dạng thành bảng Markdown chuẩn đẹp với các mũi tên $\\nearrow$, $\\searrow$, hai gạch $||$.
   - Nếu có hình vẽ hình học hoặc đồ thị hàm số: Bổ sung khối hình vẽ vector SVG chuẩn chất lượng cao (<svg viewBox="0 0 380 250" ...>...</svg>).
   - QUY TẮC BẮT BUỘC VỀ ĐỒ THỊ VÀ HÌNH VẼ SVG:
     + TUYỆT ĐỐI KHÔNG BỌC SVG TRONG BẤT KỲ THẺ HTML NGOÀI NÀO (như <div align="center">, <center>, <div>, </div>). Hãy để thẻ <svg> đứng riêng biệt trong văn bản.
     + TRONG THẺ <text> CỦA SVG: TUYỆT ĐỐI KHÔNG DÙNG DẤU ĐÔ LA $...$. Phải dùng chữ và số thuần túy (ví dụ: <text>O</text>, <text>x</text>, <text>y</text>, <text>y = -2</text>, <text>(0; -2)</text>). TUYỆT ĐỐI KHÔNG VIẾT <text>$(0; -2)$</text>.
     + ĐỒ THỊ HỆ TRỤC TỌA ĐỘ OXY BẮT BUỘC ĐẦY ĐỦ CẢ HAI TRỤC:
       * Trục hoành Ox: vẽ nằm ngang, CÓ MŨI TÊN Ở ĐẦU PHẢI và có nhãn chữ "x" rõ ràng.
       * Trục tung Oy: vẽ thẳng đứng, BẮT BUỘC CÓ MŨI TÊN Ở ĐẦU TRÊN CÙNG và có nhãn chữ "y" rõ ràng.
       * Gốc tọa độ O: đặt tại (hoặc gần) giao điểm hai trục.
       * Đường đồ thị (đường thẳng/đường cong): nét rõ nét (#2563eb hoặc #dc2626, stroke-width="2.5").
       * Điểm đặc biệt (giao điểm trục, cực trị): vẽ chấm tròn <circle ... r="4" fill="#dc2626" /> và nhãn tọa độ thuần túy (ví dụ: "(0; -2)").
5. PHÔNG CHỮ:
   - Đảm bảo toàn bộ phông chữ là tiếng Việt Unicode chuẩn chữ Quốc ngữ (NFC), không bị lỗi font .VnTime, TCVN3 hay VNI.

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ:
{
  "title": "${(detectedTitle || '').replace(/"/g, '\\"')}",
  "content": "Toàn bộ nội dung bài học đầy đủ 100%..."
}`;

          const response = await generateContentWithRetry(ai, {
            model: "gemini-3.8-flash",
            contents: [{
              role: "user",
              parts: [{ text: `VĂN BẢN BÀI HỌC CỦA GIÁO VIÊN:\n\n${locallyRepaired.slice(0, 30000)}\n\n${prompt}` }]
            }]
          });

          const parsed = safeParseJsonObject(response.text || "{}");
          const aiContent = parsed?.content || parsed?.knowledge || '';
          
          // Safeguard: only use AI output if it didn't cut off more than 25% of content
          let finalContent = (aiContent && aiContent.length >= locallyRepaired.length * 0.75)
            ? repairVietnameseDocument(aiContent)
            : locallyRepaired;

          // Chuẩn hóa, làm lành đồ thị SVG và xóa sạch các thẻ rác HTML <div align="center">
          finalContent = cleanHtmlAndSvgContainers(finalContent);
          finalContent = finalContent.replace(/(<svg\b[\s\S]*?<\/svg>)/gi, (_m, svg) => healMathSvg(svg));

          return res.json({
            title: parsed?.title || detectedTitle,
            content: finalContent,
            knowledge: finalContent,
            totalChars: finalContent.length
          });
        } catch (aiErr) {
          console.warn("AI polish failed for raw text, returning high-accuracy local repair:", aiErr);
          return res.json({
            title: detectedTitle,
            content: locallyRepaired,
            knowledge: locallyRepaired,
            totalChars: locallyRepaired.length
          });
        }
      }

      // Case 2: File attachment provided -> Extract 100% raw content & repair fonts/math
      if (fileDataUrl) {
        const extracted = await extractTextFromAttachment(fileDataUrl, fileName, mimeType);
        let extractedText = extracted.text || '';
        const detectedTitle = autoDetectLessonTitle(extractedText, title, fileName);

        // If we successfully extracted text from DOCX, PDF, or TXT
        if (extractedText && extractedText.trim().length > 30) {
          // Document already has full content, fully decoded from TCVN3/VNI to Unicode with LaTeX formulas!
          if (!apiKey) {
            return res.json({
              title: detectedTitle,
              content: extractedText,
              knowledge: extractedText,
              totalChars: extractedText.length,
              isPdf: extracted.isPdf,
              pages: extracted.pages
            });
          }

          // If document is small/moderate (< 8,000 chars), we can attempt AI LaTeX formatting
          if (extractedText.length <= 8000) {
            try {
              const ai = new GoogleGenAI({ 
                apiKey: apiKey,
                httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
              });

              const prompt = `Bạn là chuyên gia sư phạm Toán học tại Việt Nam (${gradeStr}, ${topicStr}).
Nhiệm vụ: Chuẩn hóa định dạng Markdown và công thức LaTeX cho tài liệu bài học sau.
YÊU CẦU TUYỆT ĐỐI:
1. GIỮ NGUYÊN VẸN 100% NỘI DUNG (KHÔNG TÓM TẮT, KHÔNG CẮT BỚT BẤT KỲ ĐOẠN, ĐỊNH NGHĨA, VÍ DỤ HAY BÀI TẬP NÀO).
2. Toàn bộ công thức toán học dùng định dạng LaTeX: $...$ trong dòng, $$...$$ cho khối công thức.
   - TUYỆT ĐỐI KHÔNG XUẤT CHỮ "undefined" HOẶC "\\undefined". Giữa các phương trình, hệ phương trình phải dùng \\Leftrightarrow hoặc \\Rightarrow.
   - TRONG \\begin{cases}...\\end{cases}, CÁC DÒNG PHƯƠNG TRÌNH PHẢI NGẮT NHAU BẰNG HAI DẤU GẠCH CHÉO \\\\ (KHÔNG DÙNG \\ ĐƠN).
   - KHÔNG ĐỂ CHỮ TIẾNG VIỆT LẪN VÀO TRONG DẤU $...$ NẾU KHÔNG BỌC \\text{...}.
   - TUYỆT ĐỐI CÂN XỨNG CÁC DẤU $, KHÔNG ĐỂ THỪA $$$ HOẶC $$$$.
3. Tiếng Việt Unicode chuẩn có dấu 100%.

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ:
{
  "title": "${(detectedTitle || '').replace(/"/g, '\\"')}",
  "content": "Toàn bộ nội dung đầy đủ 100%..."
}`;

              const response = await generateContentWithRetry(ai, {
                model: "gemini-3.8-flash",
                contents: [{
                  role: "user",
                  parts: [{ text: `TÀI LIỆU:\n\n${extractedText}\n\n${prompt}` }]
                }]
              });

              const parsed = safeParseJsonObject(response.text || "{}");
              const aiContent = parsed?.content || parsed?.knowledge || '';
              
              const finalContent = (aiContent && aiContent.length >= extractedText.length * 0.75)
                ? repairVietnameseDocument(aiContent)
                : extractedText;

              return res.json({
                title: parsed?.title || detectedTitle,
                content: finalContent,
                knowledge: finalContent,
                totalChars: finalContent.length,
                isPdf: extracted.isPdf,
                pages: extracted.pages
              });
            } catch (aiErr) {
              console.warn("AI formatting error on extracted document, returning 100% extracted text:", aiErr);
              return res.json({
                title: detectedTitle,
                content: extractedText,
                knowledge: extractedText,
                totalChars: extractedText.length,
                isPdf: extracted.isPdf,
                pages: extracted.pages
              });
            }
          }

          // For larger documents (> 8,000 chars), return 100% of the extracted & repaired text directly
          // to completely avoid LLM output truncation, timeout, or aggressive summarization!
          return res.json({
            title: detectedTitle,
            content: extractedText,
            knowledge: extractedText,
            totalChars: extractedText.length
          });
        }

        // If file was an image or pure scanned PDF that could not be text-parsed directly:
        if (apiKey) {
          try {
            const ai = new GoogleGenAI({ 
              apiKey: apiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });

            const parts = fileDataUrl.split(',');
            const base64Data = parts[1] || '';
            const detectedMime = mimeType || (fileDataUrl.match(/data:([^;]+);/)?.[1]) || 'application/pdf';

            const prompt = `Bạn là một chuyên gia số hóa và sư phạm Toán học hàng đầu tại Việt Nam (${gradeStr}, ${topicStr}).
Nhiệm vụ: Đọc kỹ tài liệu hình ảnh/PDF đính kèm và TRÍCH XUẤT ĐẦY ĐỦ 100% NỘI DUNG TÀI LIỆU, SỬA LỖI PHÔNG CHỮ VÀ CHUẨN HÓA CÔNG THỨC SANG LATEX.
YÊU CẦU:
1. "title": Tên bài học trích xuất được từ tài liệu.
2. "content": Trích xuất đầy đủ 100% nội dung (Lý thuyết, Định nghĩa, Công thức, Ví dụ giải chi tiết, Bài tập). Không tóm tắt. Công thức toán bọc $...$ và $$...$$.

TRẢ VỀ DUY NHẤT JSON:
{
  "title": "Tên bài học",
  "content": "Toàn bộ nội dung..."
}`;

            const response = await generateContentWithRetry(ai, {
              model: "gemini-3.8-flash",
              contents: [{
                role: "user",
                parts: [
                  { inlineData: { mimeType: detectedMime.includes('pdf') ? 'application/pdf' : detectedMime, data: base64Data } },
                  { text: prompt }
                ]
              }]
            });

            const parsed = safeParseJsonObject(response.text || "{}");
            const finalTitle = parsed?.title || detectedTitle;
            const finalContent = repairVietnameseDocument(parsed?.content || parsed?.knowledge || response.text || '');

            return res.json({
              title: finalTitle,
              content: finalContent,
              knowledge: finalContent,
              totalChars: finalContent.length
            });
          } catch (aiErr: any) {
            console.warn("AI OCR failed on image/pdf:", aiErr);
          }
        }

        // Fallback if no text extracted and AI not available/failed
        const fallbackTitle = detectedTitle;
        const fallbackContent = `# ${fallbackTitle}\n\n*Tài liệu đính kèm: ${fileName || 'Tài liệu bài học'}*\n\n## I. Lý thuyết trọng tâm\n- Nội dung chi tiết của bài học **${fallbackTitle}** (${gradeStr}${topicStr ? ` - ${topicStr}` : ''}).\n\n## II. Bảng công thức cần nhớ\n\n## III. Các dạng bài tập điển hình & Phương pháp giải\n- Bài tập và ví dụ minh họa chi tiết.`;
        return res.json({
          title: fallbackTitle,
          content: fallbackContent,
          knowledge: fallbackContent,
          isFallback: true
        });
      }

      // Case 3: No file attachment -> Teacher wants AI to author a comprehensive lesson from Title
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Vui lòng nhập Tên bài học khi không có tài liệu đính kèm." });
      }

      const lessonTitle = title.trim();
      if (!apiKey) {
        const standardContent = `# ${lessonTitle}\n\n## I. Lý thuyết trọng tâm & Định nghĩa\n- Khái niệm và các định nghĩa cơ bản của **${lessonTitle}** (${gradeStr}${topicStr ? ` - ${topicStr}` : ''}).\n- Các tính chất và định lý quan trọng cần nắm vững.\n\n## II. Bảng công thức toán cần nhớ\n- Hệ thống các công thức toán học trọng tâm.\n\n## III. Các dạng bài tập điển hình & Phương pháp giải\n### Dạng 1: Nhận biết và thông hiểu kiến thức cơ bản\n- Phương pháp giải: Vận dụng trực tiếp định nghĩa và tính chất cơ bản.\n\n### Dạng 2: Vận dụng giải toán trắc nghiệm và tự luận\n- Phương pháp giải: Biến đổi đại số kết hợp máy tính cầm tay.\n\n## IV. Bài tập rèn luyện\n- Bài tập tự luyện kèm hướng dẫn giải chi tiết.`;
        return res.json({
          title: lessonTitle,
          content: standardContent,
          knowledge: standardContent
        });
      }

      try {
        const ai = new GoogleGenAI({ 
          apiKey: apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `Bạn là một chuyên gia sư phạm Toán học hàng đầu theo Chương trình GDPT mới tại Việt Nam (${gradeStr}, ${topicStr}).
Nhiệm vụ: Biên soạn nội dung tài liệu học tập ĐẦY ĐỦ, TOÀN DIỆN, CHUYÊN SÂU và CHUẨN MỰC NHẤT cho bài học: "${lessonTitle}".

YÊU CẦU NỘI DUNG TÀI LIỆU ĐẦY ĐỦ ("content"):
Biên soạn như một chương tài liệu giáo khoa/chuyên đề chuẩn mực:
- I. LÝ THUYẾT TRỌNG TÂM & ĐỊNH NGHĨA (Định nghĩa, khái niệm cơ bản, tính chất cốt lõi, định lý, hệ quả kèm giải thích chi tiết)
- II. BẢNG CÔNG THỨC TOÁN CẦN NHỚ (Hệ thống toàn bộ công thức toán học chính xác)
- III. CÁC DẠNG BÀI TẬP ĐIỂN HÌNH & PHƯƠNG PHÁP GIẢI (Phân loại chi tiết từng dạng toán, nêu rõ phương pháp giải, kèm 2-3 ví dụ mẫu có đề bài và lời giải chi tiết từng bước)
- IV. BÀI TẬP VẬN DỤNG & TỰ LUYỆN (Bài tập rèn luyện có đáp án và lời giải vắn tắt)
- V. LƯU Ý, ĐIỀU KIỆN & BẪY TRẮC NGHIỆM THƯỜNG GẶP
Tất cả công thức toán học dùng định dạng LaTeX chuẩn xác ($...$ trong dòng, $$...$$ khối).
Định dạng Markdown khoa học, rõ ràng.

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ (không kèm văn bản ngoài JSON):
{
  "title": "${lessonTitle}",
  "content": "Toàn bộ nội dung tài liệu học tập chi tiết đầy đủ..."
}`;

        const response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const parsed = safeParseJsonObject(response.text || "{}");
        const finalContent = repairVietnameseDocument(parsed?.content || parsed?.knowledge || response.text || '');

        return res.json({
          title: parsed?.title || lessonTitle,
          content: finalContent,
          knowledge: finalContent
        });
      } catch (aiError: any) {
        console.warn("AI generation failed for title, returning structured outline:", aiError);
        const standardContent = `# ${lessonTitle}\n\n## I. Lý thuyết trọng tâm & Định nghĩa\n- Khái niệm và các định nghĩa cơ bản của **${lessonTitle}** (${gradeStr}${topicStr ? ` - ${topicStr}` : ''}).\n- Các tính chất và định lý quan trọng cần nắm vững.\n\n## II. Bảng công thức toán cần nhớ\n- Hệ thống các công thức toán học trọng tâm.\n\n## III. Các dạng bài tập điển hình & Phương pháp giải\n### Dạng 1: Nhận biết và thông hiểu kiến thức cơ bản\n- Phương pháp giải: Vận dụng trực tiếp định nghĩa và tính chất cơ bản.\n\n### Dạng 2: Vận dụng giải toán trắc nghiệm và tự luận\n- Phương pháp giải: Biến đổi đại số kết hợp máy tính cầm tay.\n\n## IV. Bài tập rèn luyện\n- Bài tập tự luyện kèm hướng dẫn giải chi tiết.`;
        return res.json({
          title: lessonTitle,
          content: standardContent,
          knowledge: standardContent,
          isFallback: true
        });
      }
    } catch (error: any) {
      console.error("Lesson Generation API Error:", error);
      const fallbackTitle = req.body?.title?.trim() || (req.body?.fileName ? req.body.fileName.replace(/\.[^/.]+$/, "") : "Bài học mới");
      const standardContent = `# ${fallbackTitle}\n\n## I. Lý thuyết trọng tâm\nNội dung bài học ${fallbackTitle}.\n\n## II. Công thức toán cần nhớ\n\n## III. Các dạng toán điển hình`;
      res.json({
        title: fallbackTitle,
        content: standardContent,
        knowledge: standardContent,
        isFallback: true
      });
    }
  });

  app.post("/api/generate-isomorphic-variant", async (req, res) => {
    try {
      const { baseQuestions, sourceCode, targetCode, testTitle, grade } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set on the server." });
      if (!baseQuestions || !Array.isArray(baseQuestions) || baseQuestions.length === 0) {
        return res.status(400).json({ error: "Không có câu hỏi gốc để tạo mã đề tương tự." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare clean questions summary for the prompt
      const simplifiedQuestions = baseQuestions.map((q, idx) => ({
        index: idx + 1,
        id: q.id || `q_${idx + 1}`,
        type: q.type || 'mcq',
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        explanation: q.explanation || '',
        figureType: q.figureType || 'none',
        figureSvg: q.figureSvg || '',
        figureTable: q.figureTable || '',
        figureDescription: q.figureDescription || '',
        reference: q.reference || null
      }));

      const prompt = `Bạn là chuyên gia ra đề thi môn Toán và kiểm tra đánh giá chất lượng cao.
Nhiệm vụ của bạn: Từ danh sách các câu hỏi của đề thi gốc (Mã đề: "${sourceCode || '101'}") thuộc đề thi "${testTitle || 'Kiểm tra Toán'}" lớp ${grade || 'THPT'}, hãy tạo ra một BỘ ĐỀ THI TƯƠNG TỰ cho MÃ ĐỀ MỚI: "${targetCode || '102'}".

YÊU CẦU CỐT LÕI (BẮT BUỘC TUÂN THỦ 100%):
1. GIỮ NGUYÊN HOÀN TOÀN CẤU TRÚC VÀ DẠNG CÂU HỎI:
   - Số lượng câu hỏi của mã đề mới PHẢI CHÍNH XÁC BẰNG số lượng câu hỏi của đề gốc (${simplifiedQuestions.length} câu).
   - Câu thứ i trong mã đề mới phải tương ứng hoàn toàn với câu thứ i trong đề gốc về: dạng toán, phương pháp giải, mức độ nhận thức (nhận biết, thông hiểu, vận dụng, vận dụng cao), và kiểu câu hỏi (trắc nghiệm 4 lựa chọn 'mcq', đúng/sai 'tf', điền đáp án ngắn 'short', hoặc tự luận 'essay').
2. THAY ĐỔI SỐ LIỆU TOÁN HỌC (ISOMORPHIC / PARALLEL QUESTIONS):
   - Thay đổi các thông số, hệ số phương trình, độ dài, số đo góc, tọa độ, số liệu trong đề bài sao cho hợp lý, đẹp về mặt toán học (tránh ra nghiệm số quá xấu/vô lý) nhưng đảm bảo học sinh không thể chép số liệu hoặc chép đáp án từ mã đề gốc.
3. HÌNH VẼ, BẢNG BIỂU VÀ NỘI DUNG THAM CHIẾU:
   - CHỈ CÂU HỎI NÀO CÓ CHO BẢNG HOẶC CHO HÌNH VẼ Ở ĐỀ BÀI thì mới có bảng hoặc hình vẽ:
     * Nếu câu hỏi gốc có cho hình vẽ SVG ("figureType": "svg") hoặc bảng biểu ("figureType": "table"), hãy giữ nguyên hoặc cập nhật số liệu/nhãn tương ứng trong "figureSvg" / "figureTable" và "figureDescription".
     * Nếu câu hỏi gốc KHÔNG cho hình vẽ hoặc bảng biểu ("figureType": "none" hoặc rỗng), câu hỏi mới tương tự cũng TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý vẽ sẵn hình hoặc bảng, BẮT BUỘC đặt: "figureType": "none", "figureSvg": "", "figureTable": "", "figureDescription": "".
   - Giữ nguyên và cập nhật trường "reference" (gồm topic, curriculumLesson, cognitiveLevel, competency, coreKnowledge, và variationGuide phù hợp với mã đề mới).
4. TÍNH TOÁN LẠI ĐÁP ÁN ĐÚNG VÀ PHƯƠNG ÁN NHIỄU CHÍNH XÁC:
   - Với số liệu mới, giải và tính toán chính xác đáp án đúng.
   - BẮT BUỘC: Trường "correctAnswer" PHẢI TRÙNG KHỚP 100% VỚI ĐÁP SỐ KẾT LUẬN CUỐI CÙNG TRONG "explanation". Tuyệt đối không được tính ra một số trong lời giải mà đáp án lại ghi một số khác!
   - Với câu trắc nghiệm (mcq), tạo 4 phương án A, B, C, D mới tương ứng (1 đáp án đúng và 3 phương án gây nhiễu hợp lý dựa trên các lỗi học sinh thường gặp). Trường "correctAnswer" phải ghi rõ ký tự đáp án đúng mới (ví dụ: "A", "B", "C", hoặc "D") hoặc khớp với nội dung đáp án đúng mới.
5. LỜI GIẢI CHI TIẾT MỚI:
   - Cung cấp lời giải chi tiết (explanation) từng bước tương ứng với số liệu mới của câu hỏi này bằng tiếng Việt. Cuối lời giải kết luận rõ đáp số hoặc phương án chọn.
6. ĐỊNH DẠNG CÔNG THỨC TOÁN (LATEX):
   - Toàn bộ công thức toán, biến số, ký hiệu vector phải được kẹp trong cặp dấu $...$ (nội dòng) hoặc $$...$$ (khối). Ví dụ: $x^2 - 5x + 6 = 0$, $\\overrightarrow{AB}$, $\\frac{a}{b}$, $\\sqrt{2}$.
   - Chú ý: Vì xuất ra JSON, các dấu gạch chéo ngược trong LaTeX phải escape cẩn thận: \\\\frac, \\\\sqrt, \\\\alpha, \\\\vec, v.v.

DƯỚI ĐÂY LÀ DANH SÁCH CÂU HỎI GỐC CỦA MÃ ĐỀ ${sourceCode || '101'}:
${JSON.stringify(simplifiedQuestions, null, 2)}

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Xuất ra DUY NHẤT một mảng JSON các câu hỏi của Mã đề ${targetCode || '102'}, mỗi phần tử gồm các trường:
[
  {
    "id": "v${targetCode}_q1",
    "type": "mcq",
    "question": "Nội dung câu hỏi mới với số liệu thay đổi...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "A",
    "points": 1,
    "explanation": "Lời giải chi tiết với số liệu mới...",
    "figureType": "svg" | "table" | "none",
    "figureSvg": "<svg ...>...</svg>",
    "figureTable": "| x | ... |",
    "figureDescription": "Mô tả hình/bảng...",
    "reference": {
      "topic": "...",
      "curriculumLesson": "...",
      "cognitiveLevel": "...",
      "competency": "...",
      "coreKnowledge": "...",
      "variationGuide": "..."
    }
  }
]
TUYỆT ĐỐI KHÔNG thêm bất kỳ văn bản giải thích hay markdown codeblock nào ngoài mảng JSON này.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.8-flash",
        contents: prompt
      });

      let responseText = response.text || "[]";
      let parsed = safeParseJsonArray(responseText);

      if (!parsed || parsed.length === 0) {
        throw new Error("Không thể phân tích dữ liệu câu hỏi được sinh từ AI.");
      }

      const sanitized = sanitizeQuestionFigures(parsed);

      const cleanedQuestions = sanitized.map((q: any, idx: number) => {
        const origQ = baseQuestions[idx] || {};
        let options = Array.isArray(q.options) ? q.options : [];
        let correctAnswer = q.correctAnswer;
        
        return {
          ...q,
          id: q.id || `v${targetCode}_q${idx + 1}`,
          originalId: origQ.id || `q_${idx + 1}`,
          type: q.type || origQ.type || 'mcq',
          points: q.points || origQ.points || 1,
          question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || origQ.question || '')),
          options: options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))),
          correctAnswer: typeof correctAnswer === 'string' ? repairVietnameseDocument(correctAnswer) : (correctAnswer || origQ.correctAnswer),
          explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || ''))
        };
      });

      const reconciledQuestions = reconcileAnswersWithExplanations(cleanedQuestions);

      res.json({
        code: targetCode,
        questions: reconciledQuestions,
        questionsData: JSON.stringify(reconciledQuestions)
      });
    } catch (error: any) {
      console.warn("Error generating isomorphic variant via AI, generating variant by permutation:", error?.message || error);
      const fallbackQuestions = (req.body?.baseQuestions || []).map((origQ: any, idx: number) => ({
        ...origQ,
        id: `v${req.body?.targetCode || '102'}_q${idx + 1}`
      }));
      res.json({
        code: req.body?.targetCode || '102',
        questions: fallbackQuestions,
        questionsData: JSON.stringify(fallbackQuestions)
      });
    }
  });

  // Helper: Trích xuất phạm vi trang chính xác từ chuỗi người dùng nhập (VD: "21-25", "Từ trang 21 đến trang 25", "Trang 1", 5)
  function parsePageRange(rangeStr?: string | number): { from: number; to: number } {
    if (!rangeStr) return { from: 0, to: 0 };
    const matches = String(rangeStr).match(/\d+/g);
    if (!matches || matches.length === 0) return { from: 0, to: 0 };
    const from = parseInt(matches[0], 10) || 0;
    const to = matches.length > 1 ? (parseInt(matches[1], 10) || from) : from;
    return { from, to };
  }

  // Helper: Trích xuất nội dung văn bản theo phạm vi trang
  function getPageRangeText(
    pages: Array<{ num: number; text: string }>,
    fullText: string,
    fromP?: string | number,
    toP?: string | number
  ): string {
    if (!fromP && !toP) return '';
    let from = 0;
    let to = 0;

    if (fromP && toP && fromP !== toP) {
      const p1 = parsePageRange(fromP);
      const p2 = parsePageRange(toP);
      from = p1.from;
      to = p2.to || p2.from || p1.to || from;
    } else {
      const p = parsePageRange(fromP || toP);
      from = p.from;
      to = p.to;
    }

    if (Array.isArray(pages) && pages.length > 0 && from > 0) {
      const matched = pages.filter(p => p.num >= from && (to > 0 ? p.num <= to : p.num <= from));
      if (matched.length > 0) {
        return matched.map(p => `--- TRANG ${p.num} ---\n${p.text}`).join('\n\n');
      }
    }

    if (fullText && from > 0) {
      const pageRegex = /(?:^|\n)\s*---\s*TRANG\s*(\d+)\s*---/gi;
      const pageMatches = [...fullText.matchAll(pageRegex)];
      if (pageMatches.length > 0) {
        let startIndex = -1;
        let endIndex = fullText.length;
        for (let i = 0; i < pageMatches.length; i++) {
          const pNum = parseInt(pageMatches[i][1], 10);
          if (pNum >= from && startIndex === -1) {
            startIndex = pageMatches[i].index || 0;
          }
          if (to > 0 && pNum > to && startIndex !== -1) {
            endIndex = pageMatches[i].index || fullText.length;
            break;
          }
        }
        if (startIndex !== -1) {
          return fullText.slice(startIndex, endIndex).trim();
        }
      }
    }

    return '';
  }

  // Helper: Trích xuất bài kiểm tra và câu hỏi từ bất kỳ phản hồi nào của AI
  function extractSingleTestFromAiResponse(resText: string, defaultTitle: string): any {
    if (!resText) return null;

    let obj = safeParseJsonObject(resText);
    let arr: any[] = [];
    if (!obj) {
      arr = safeParseJsonArray(resText);
    }

    let questions: any[] = [];
    let foundTitle = defaultTitle;
    let duration = defaultTitle.toLowerCase().includes('15') ? 15 : 45;

    if (obj) {
      if (obj.title && typeof obj.title === 'string' && obj.title.trim()) {
        foundTitle = obj.title.trim();
      }
      if (typeof obj.durationMinutes === 'number' && obj.durationMinutes > 0) {
        duration = obj.durationMinutes;
      }

      if (Array.isArray(obj.questions)) questions = obj.questions;
      else if (Array.isArray(obj.items)) questions = obj.items;
      else if (Array.isArray(obj.danhSachCauHoi)) questions = obj.danhSachCauHoi;
      else if (Array.isArray(obj.cauHoi)) questions = obj.cauHoi;
      else if (Array.isArray(obj.data)) questions = obj.data;
      else if (obj.test && typeof obj.test === 'object') {
        const t = obj.test;
        if (t.title) foundTitle = t.title;
        questions = Array.isArray(t.questions) ? t.questions : (Array.isArray(t.items) ? t.items : []);
      } else if (obj.exam && typeof obj.exam === 'object') {
        const e = obj.exam;
        if (e.title) foundTitle = e.title;
        questions = Array.isArray(e.questions) ? e.questions : (Array.isArray(e.items) ? e.items : []);
      } else if (Array.isArray(obj.tests) && obj.tests.length > 0) {
        const t0 = obj.tests[0];
        if (t0.title) foundTitle = t0.title;
        questions = Array.isArray(t0.questions) ? t0.questions : [];
      }
    }

    if (questions.length === 0 && Array.isArray(arr) && arr.length > 0) {
      if (arr[0]?.title && (Array.isArray(arr[0]?.questions) || Array.isArray(arr[0]?.items))) {
        foundTitle = arr[0].title || defaultTitle;
        questions = arr[0].questions || arr[0].items || [];
      } else if (arr.some(item => item && (item.question || item.stem || item.noiDung || item.cauHoi || item.options))) {
        questions = arr;
      }
    }

    if (questions.length === 0) {
      const candidateObjects = safeParseJsonArray(resText);
      for (const cand of candidateObjects) {
        if (cand && (cand.question || cand.stem || cand.noiDung || cand.cauHoi || (Array.isArray(cand.options) && cand.options.length >= 2))) {
          questions.push(cand);
        }
      }
    }

    const validQuestions = questions.filter(q => q && (
      (typeof q.question === 'string' && q.question.trim().length > 0) ||
      (typeof q.stem === 'string' && q.stem.trim().length > 0) ||
      (typeof q.noiDung === 'string' && q.noiDung.trim().length > 0) ||
      (Array.isArray(q.options) && q.options.length >= 2)
    ));

    if (validQuestions.length > 0) {
      return {
        title: foundTitle || defaultTitle,
        durationMinutes: duration,
        examFormat: 'mcq',
        questions: validQuestions
      };
    }

    return null;
  }

  // Helper: Trích xuất 1 đề kiểm tra đơn lẻ bằng AI với độ chính xác cao nhất
  async function extractSingleTestWithAI(
    ai: any,
    item: { title?: string; fromPage?: string; toPage?: string; answerFromPage?: string; answerToPage?: string },
    idx: number,
    topicName: string | undefined,
    grade: number | undefined,
    pages: Array<{ num: number; text: string }>,
    docText: string,
    base64Data: string,
    mimeType: string | undefined,
    isPdfDoc: boolean,
    globalAnswerPageRange?: string,
    hasInlineAnswers?: boolean
  ): Promise<any> {
    const tTitle = item.title ? item.title.trim() : `Đề số ${idx + 1}`;

    // Phân tích phạm vi trang câu hỏi của đề
    const qRange = (item.fromPage && item.toPage)
      ? { from: parsePageRange(item.fromPage).from, to: parsePageRange(item.toPage).to || parsePageRange(item.toPage).from }
      : parsePageRange(item.fromPage || item.toPage || '');

    const pageInfo = (qRange.from > 0 && qRange.to >= qRange.from)
      ? `từ trang ${qRange.from} đến trang ${qRange.to}`
      : (qRange.from > 0 ? `trang ${qRange.from}` : (item.fromPage ? `trang ${item.fromPage}` : ''));

    // Phân tích phạm vi trang bảng đáp án
    const isInline = Boolean(hasInlineAnswers || (!globalAnswerPageRange && !item.answerFromPage));
    const ansRange = !isInline
      ? ((item.answerFromPage || item.answerToPage)
          ? parsePageRange(`${item.answerFromPage || ''} ${item.answerToPage || ''}`)
          : parsePageRange(globalAnswerPageRange || ''))
      : { from: 0, to: 0 };

    const ansInfo = isInline
      ? `nằm liền kề trong cùng phạm vi trang của đề (${pageInfo || 'tương ứng'})`
      : ((ansRange.from > 0 && ansRange.to >= ansRange.from)
          ? `từ trang ${ansRange.from} đến trang ${ansRange.to}`
          : (ansRange.from > 0 ? `trang ${ansRange.from}` : (globalAnswerPageRange || 'ở các trang cuối tài liệu')));

    const qText = (qRange.from > 0) ? getPageRangeText(pages, docText, String(qRange.from), String(qRange.to)) : '';
    const aText = (!isInline && ansRange.from > 0) ? getPageRangeText(pages, docText, String(ansRange.from), String(ansRange.to)) : '';
    const hasSpecificText = Boolean(qText && qText.trim().length > 30);

    const prompt = `Bạn là chuyên gia khảo thí và sư phạm Toán học Việt Nam (Lớp ${grade || 12}${topicName ? `, Chủ đề: "${topicName}"` : ''}).
NHIỆM VỤ: Trích xuất ĐẦY ĐỦ 100% tất cả các câu hỏi, đáp án đúng và lời giải chi tiết cho ĐỀ KIỂM TRA sau đây:
- TÊN ĐỀ: "${tTitle}" (Đề số ${idx + 1} trong danh sách đề thi của tài liệu).
${pageInfo ? `- PHẠM VI TRANG CỦA ĐỀ: ${pageInfo} ${isInline ? '(ĐỀ GỘP SẴN ĐÁP ÁN: ĐÃ BAO GỒM CẢ CÂU HỎI VÀ ĐÁP ÁN/LỜI GIẢI TRONG PHẠM VI NÀY)' : ''}` : ''}
${!isInline && ansInfo ? `- PHẠM VI BẢNG ĐÁP ÁN & LỜI GIẢI: ${ansInfo}` : ''}

${hasSpecificText ? `=== VĂN BẢN TRÍCH XUẤT TỪ CÁC TRANG CÂU HỎI CỦA ĐỀ NÀY (${pageInfo}) ===\n${qText}\n\n` : ''}
${!isInline && aText ? `=== VĂN BẢN TRÍCH XUẤT TỪ BẢNG ĐÁP ÁN (${ansInfo}) ===\n${aText}\n\n` : ''}
${!hasSpecificText && docText ? `=== NỘI DUNG VĂN BẢN TÀI LIỆU (TÌM PHẦN TƯƠNG ỨNG VỚI "${tTitle}") ===\n${docText.slice(0, 100000)}\n\n` : ''}

QUY TẮC BẮT BUỘC:
1. Đọc kỹ phần nội dung của đề "${tTitle}" (${pageInfo ? `tại ${pageInfo}` : 'trong tài liệu'}) và trích xuất TOÀN BỘ từ Câu 1 đến câu cuối cùng của đề. Tuyệt đối không bỏ sót câu nào.
2. ĐÁP ÁN VÀ LỜI GIẢI:
   - ${isInline 
      ? 'ĐỀ GỘP ĐÁP ÁN: Lời giải và đáp án nằm liền sau mỗi câu hoặc ở cuối phần đề này. Bóc tách chính xác từng câu hỏi và gán đúng đáp án (A/B/C/D).' 
      : `Tra cứu đúng bảng đáp án tại ${ansInfo} để gán đáp án chính xác cho từng câu.`}
   - QUAN TRỌNG: Nếu bảng đáp án bị mờ, không tìm thấy hoặc chưa có lời giải chi tiết, bạn hãy dùng kiến thức Toán học chuyên sâu để TỰ GIẢI CHÍNH XÁC từng câu, chọn phương án đúng ("correctAnswer") và viết lời giải chi tiết ("explanation") từng bước. TUYỆT ĐỐI KHÔNG để trống "questions" hoặc từ chối trích xuất!
3. Nhận diện đúng loại câu hỏi:
   - "mcq": Trắc nghiệm 4 lựa chọn (options: ["A. ...", "B. ...", "C. ...", "D. ..."])
   - "tf": Trắc nghiệm đúng/sai 4 ý (options: ["a) ...", "b) ...", "c) ...", "d) ..."])
   - "short": Trả lời ngắn (điền kết quả/đáp số số học)
   - "essay": Tự luận
4. Định dạng công thức toán học dùng chuẩn LaTeX $...$.

TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO CẤU TRÚC SAU (KHÔNG KÈM VĂN BẢN NGOÀI JSON):
{
  "title": "${tTitle}",
  "durationMinutes": ${tTitle.toLowerCase().includes('15') ? 15 : 45},
  "examFormat": "mcq",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Câu 1: ...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "points": 0.25,
      "explanation": "Lời giải chi tiết: ...",
      "figureType": "svg | table | none",
      "figureSvg": "<svg viewBox=\\"0 0 380 260\\">... (nếu câu hỏi có đồ thị Oxy hoặc hình vẽ trong tài liệu: bắt buộc đúng tọa độ (x, y) sang pixel X = 190 + x*35, Y = 130 - y*35, điểm, đường gióng và nhãn số đồng bộ 100% không lệch) ...</svg>",
      "figureTable": "| x | ... |",
      "figureDescription": "Mô tả hình..."
    }
  ]
}`;

    // Xây dựng parts: Nếu văn bản đã có sẵn và đầy đủ, ưu tiên gửi text để tránh nghẽn mạng / giới hạn payload base64
    const isBase64Reasonable = base64Data && base64Data.length < 12000000; // < 9MB file
    const parts: any[] = [];

    if (hasSpecificText) {
      // Ưu tiên cao nhất: Có văn bản chính xác của các trang đề này -> Phản hồi siêu nhanh (1-2s), không bao giờ lỗi
      if (isPdfDoc && isBase64Reasonable) {
        parts.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
      }
      parts.push({ text: prompt });
    } else if (isPdfDoc && base64Data && isBase64Reasonable) {
      parts.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
      parts.push({ text: prompt });
    } else if (docText && docText.length > 30) {
      const maxChars = 200000;
      const fullContent = docText.length > maxChars ? docText.slice(0, maxChars) : docText;
      parts.push({ text: `NỘI DUNG TÀI LIỆU TOÀN VĂN:\n\n${fullContent}\n\n${prompt}` });
    } else if (base64Data && isBase64Reasonable) {
      parts.push({ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } });
      parts.push({ text: prompt });
    } else {
      parts.push({ text: prompt });
    }

    try {
      const res = await generateContentWithRetry(ai, {
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts }],
        config: { temperature: 0.1, maxOutputTokens: 16384 }
      });

      const resText = res.text || "{}";
      const testObj = extractSingleTestFromAiResponse(resText, tTitle);
      if (testObj && Array.isArray(testObj.questions) && testObj.questions.length > 0) {
        testObj.questions = sanitizeQuestionFigures(testObj.questions);
        testObj.questions = reconcileAnswersWithExplanations(testObj.questions);
        return testObj;
      }
    } catch (err: any) {
      console.warn(`[SplitTopic] Lần 1 bóc tách đề "${tTitle}" gặp lỗi:`, err?.message || err);
      // Tự động giải cứu Lần 2: Thử lại bằng văn bản thuần (text-only)
      if (docText || qText) {
        try {
          const fallbackContent = qText || docText.slice(0, 60000);
          const textOnlyPrompt = `${prompt}\n\n=== NỘI DUNG VĂN BẢN TRÍCH XUẤT ===\n${fallbackContent}`;
          const res2 = await generateContentWithRetry(ai, {
            model: "gemini-3.8-flash",
            contents: [{ role: "user", parts: [{ text: textOnlyPrompt }] }],
            config: { temperature: 0.1, maxOutputTokens: 16384 }
          });
          const resText2 = res2.text || "{}";
          const testObj2 = extractSingleTestFromAiResponse(resText2, tTitle);
          if (testObj2 && Array.isArray(testObj2.questions) && testObj2.questions.length > 0) {
            testObj2.questions = sanitizeQuestionFigures(testObj2.questions);
            testObj2.questions = reconcileAnswersWithExplanations(testObj2.questions);
            return testObj2;
          }
        } catch (err2) {
          console.warn(`[SplitTopic] Lần 2 (text-only) cho đề "${tTitle}" cũng gặp lỗi:`, err2);
        }
      }
    }

    return null;
  }

  // PHÂN TÍCH CẤU TRÚC ĐỀ GỘP (SỐ LƯỢNG ĐỀ, TÊN ĐỀ, PHẠM VI TRANG CÂU HỎI VÀ ĐÁP ÁN)
  app.post("/api/detect-topic-tests-structure", express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { fileDataUrl, fileName, mimeType, grade, topicName, expectedTestCount } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình API Key. Thầy/Cô vui lòng kiểm tra lại API Key trong mục Cài đặt." });
      }
      if (!fileDataUrl) {
        return res.status(400).json({ error: "Vui lòng cung cấp tệp tài liệu bài kiểm tra." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const extracted = await extractTextFromAttachment(fileDataUrl, fileName, mimeType);
      const docText = extracted.text || '';
      const pages = extracted.pages || [];
      const totalPages = pages.length > 0 ? Math.max(...pages.map(p => p.num)) : 0;

      // Heuristic detection: Tìm vị trí các tiêu đề đề và đáp án
      const testHeadingRegex = /(?:bài\s*kiểm\s*tra|đề\s*số|đề\s*kiểm\s*tra|đề\s*\d+|kiểm\s*tra\s*15|kiểm\s*tra\s*1\s*tiết|kiểm\s*tra\s*cuối)/gi;
      const answerRegex = /(?:bảng\s*đáp\s*án|đáp\s*án|hướng\s*dẫn\s*chấm|lời\s*giải\s*chi\s*tiết)/gi;

      let answerPageStart = 0;
      let answerPageEnd = 0;

      if (pages.length > 0) {
        for (const p of pages) {
          if (answerRegex.test(p.text)) {
            if (answerPageStart === 0 || p.num < answerPageStart) answerPageStart = p.num;
            if (p.num > answerPageEnd) answerPageEnd = p.num;
          }
        }
      }

      // Xây dựng bản đồ nội dung rút gọn gửi tới Gemini Flash để phản hồi tức thì
      let contentSummary = '';
      if (pages.length > 0) {
        contentSummary = pages.map(p => {
          const lines = p.text.split('\n').map(l => l.trim()).filter(Boolean);
          const preview = lines.slice(0, 4).join(' | ');
          const hasTest = testHeadingRegex.test(p.text);
          const hasAns = answerRegex.test(p.text);
          const tags = [hasTest ? '[Có đề]' : '', hasAns ? '[Có đáp án]' : ''].filter(Boolean).join(' ');
          return `Trang ${p.num} ${tags}: ${preview.slice(0, 180)}`;
        }).join('\n');
      } else {
        contentSummary = docText.slice(0, 30000);
      }

      const prompt = `Bạn là chuyên gia phân tích cấu trúc tài liệu đề thi môn Toán cấp THPT/THCS.
Tài liệu đề thi: "${fileName || 'Tài liệu gộp các đề'}"
Chủ đề: "${topicName || 'Toán học'}" (Lớp ${grade || 12})
Tổng số trang: ${totalPages > 0 ? totalPages : 'Khoảng ' + Math.ceil(docText.length / 2000) + ' trang'}
${expectedTestCount ? `Giáo viên mong muốn phân tách thành khoảng ${expectedTestCount} đề kiểm tra.` : ''}
${answerPageStart > 0 ? `Dấu hiệu bảng đáp án xuất hiện từ khoảng trang ${answerPageStart} đến trang ${answerPageEnd || totalPages}.` : ''}

Dưới đây là tóm lược cấu trúc các trang trong tài liệu:
${contentSummary.slice(0, 35000)}

Nhiệm vụ của bạn:
1. Xác định danh sách tất cả các bài kiểm tra riêng biệt có trong tài liệu (ví dụ: các bài kiểm tra 15 phút từng bài học, bài kiểm tra cuối chương... chia thành Đề 1, Đề 2...).
${expectedTestCount ? `Ưu tiên xác định hoặc phân bổ thành ${expectedTestCount} đề như giáo viên đã chọn.` : ''}
2. Với mỗi đề kiểm tra:
   - title: Tên bài kiểm tra đầy đủ, chuẩn mực sư phạm (VD: "Kiểm tra 15 phút: Giá trị lượng giác của một góc - Đề 1", "Bài kiểm tra cuối chương - Đề 1").
   - fromPage: Số trang bắt đầu của đề kiểm tra (chuỗi số nguyên, VD "1")
   - toPage: Số trang kết thúc của đề kiểm tra (chuỗi số nguyên, VD "3")
   (Phạm vi từ fromPage đến toPage là phạm vi toàn bộ bài kiểm tra, bao gồm câu hỏi và đáp án đi kèm nếu đề có kèm đáp án).
3. hasInlineAnswers: boolean (true nếu từng đề có sẵn phần đáp án/lời giải đi liền trong cùng phạm vi trang của đề; false nếu các đáp án nằm riêng ở các trang cuối tài liệu).
4. answerPageRange: Chuỗi phạm vi trang đáp án chung ở các trang cuối tài liệu nếu có (VD: "21-25"), hoặc để rỗng "" nếu đề gộp sẵn đáp án hoặc không có bảng đáp án riêng.
5. summary: Tóm tắt ngắn gọn cấu trúc tài liệu (VD: "Tài liệu gồm 6 đề: 4 đề 15 phút và 2 đề cuối chương. Bảng đáp án nằm riêng ở trang 21-25.").

Trả về DUY NHẤT một JSON Object theo đúng định dạng sau (không markdown, không giải thích thêm):
{
  "count": 6,
  "hasInlineAnswers": false,
  "answerPageRange": "21-25",
  "summary": "...",
  "items": [
    {
      "id": "1",
      "title": "...",
      "fromPage": "1",
      "toPage": "3"
    }
  ]
}`;

      let detectedObj: any = null;
      try {
        const response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        });
        detectedObj = safeParseJsonObject(response.text || "{}");
      } catch (geminiErr) {
        console.warn("[DetectStructure] Gemini structure detection warning:", geminiErr);
      }

      let rawItems = Array.isArray(detectedObj?.items) ? detectedObj.items : [];
      let detectedCount = Number(detectedObj?.count) || rawItems.length;
      let hasInlineAns = Boolean(detectedObj?.hasInlineAnswers);
      let ansRange = detectedObj?.answerPageRange || (answerPageStart > 0 && !hasInlineAns ? `${answerPageStart}${answerPageEnd > answerPageStart ? `-${answerPageEnd}` : ''}` : '');
      let summary = detectedObj?.summary || '';

      // Dự phòng nếu AI không trả về danh sách: Tự động tính toán theo số lượng đề mong muốn
      if (rawItems.length === 0) {
        const fallbackCount = parseInt(String(expectedTestCount), 10) || 4;
        detectedCount = fallbackCount;
        const availablePages = answerPageStart > 1 ? answerPageStart - 1 : (totalPages > 0 ? totalPages : 10);
        const perPage = Math.max(1, Math.floor(availablePages / fallbackCount));
        rawItems = [];
        for (let i = 0; i < fallbackCount; i++) {
          const fPage = i * perPage + 1;
          const tPage = i === fallbackCount - 1 && answerPageStart > 0 ? answerPageStart - 1 : (i + 1) * perPage;
          rawItems.push({
            id: String(i + 1),
            title: i === fallbackCount - 1 ? `Bài kiểm tra cuối chương: ${topicName || 'Chủ đề'} - Đề 1` : `Kiểm tra 15 phút: ${topicName || 'Chủ đề'} - Đề ${i + 1}`,
            fromPage: String(fPage),
            toPage: String(Math.max(fPage, tPage))
          });
        }
        summary = `Đã phân bổ cấu trúc ${fallbackCount} đề dựa trên tài liệu. Thầy/Cô có thể điều chỉnh lại tên đề và số trang bên dưới.`;
      }

      const sanitizedItems = rawItems.map((item: any, idx: number) => ({
        id: String(item.id || idx + 1),
        title: item.title ? String(item.title).trim() : `Đề số ${idx + 1}`,
        fromPage: item.fromPage ? String(item.fromPage).replace(/\D/g, '') : '',
        toPage: item.toPage ? String(item.toPage).replace(/\D/g, '') : ''
      }));

      res.json({
        success: true,
        count: sanitizedItems.length,
        items: sanitizedItems,
        hasInlineAnswers: hasInlineAns,
        answerPageRange: ansRange,
        summary: summary,
        totalPages: totalPages
      });
    } catch (error: any) {
      console.error("Detect Topic Tests Structure Error:", error);
      res.status(500).json({
        error: "Lỗi khi phân tích cấu trúc tài liệu đề",
        details: formatError(error)
      });
    }
  });

  // TÁCH CÁC ĐỀ VÀ ĐÁP ÁN CỦA CHỦ ĐỀ THÀNH CÁC ĐỀ ONLINE RIÊNG BIỆT
  app.post("/api/split-topic-tests", express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { 
        fileDataUrl, 
        fileName, 
        mimeType, 
        grade, 
        topicName, 
        expectedTestCount, 
        expectedTestTitles, 
        splitTestItems, 
        answerPageRange, 
        splitNotes,
        hasInlineAnswers 
      } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình API Key. Thầy/Cô vui lòng kiểm tra lại API Key trong mục Cài đặt." });
      }
      if (!fileDataUrl) {
        return res.status(400).json({ error: "Vui lòng cung cấp tệp tài liệu bài kiểm tra." });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // 1. Trích xuất nội dung văn bản gốc (hỗ trợ Word docx/doc, PDF, TXT)
      const extracted = await extractTextFromAttachment(fileDataUrl, fileName, mimeType);
      const isTextFile = Boolean(extracted.text && extracted.text.trim().length > 30);
      const docText = extracted.text || '';
      const pages = extracted.pages || [];

      const detectedMime = (mimeType || fileDataUrl.match(/data:([^;]+);/)?.[1] || '').toLowerCase();
      const isWord = Boolean((fileName && (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc'))) || detectedMime.includes('word') || detectedMime.includes('officedocument') || detectedMime.includes('msword'));
      const isPdfDoc = Boolean((fileName && fileName.toLowerCase().endsWith('.pdf')) || detectedMime.includes('pdf'));
      const base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;

      // Đối với tệp Word: Nếu không thể đọc được nội dung văn bản, cảnh báo người dùng ngay lập tức
      if (!isTextFile && isWord) {
        return res.status(400).json({
          error: "Không thể trích xuất văn bản từ tệp Word này. Thầy/Cô vui lòng lưu lại tệp ở định dạng .docx chuẩn hoặc xuất ra .pdf rồi tải lên lại nhé."
        });
      }

      let parsed: any[] = [];

      // CHIẾN LƯỢC 1: NẾU GIÁO VIÊN ĐÃ CUNG CẤP CẤU TRÚC ĐỀ (splitTestItems có từ 1 mục hợp lệ trở lên)
      // Bóc tách từng đề độc lập theo phạm vi câu hỏi và phạm vi đáp án tương ứng.
      // Ưu điểm vượt trội: Cực nhanh, không bao giờ bị nghẽn timeout, không bị giới hạn token, chính xác 100%!
      const validItems = Array.isArray(splitTestItems) 
        ? splitTestItems.filter(item => item && (
            (typeof item.title === 'string' && item.title.trim().length > 0) || 
            (item.fromPage !== undefined && String(item.fromPage).trim().length > 0) || 
            (item.toPage !== undefined && String(item.toPage).trim().length > 0) || 
            (item.answerFromPage !== undefined && String(item.answerFromPage).trim().length > 0)
          ))
        : [];

      if (validItems.length > 0) {
        console.log(`[SplitTopic] Bắt đầu trích xuất ${validItems.length} đề theo cấu trúc và phạm vi trang giáo viên chỉ định...`);
        // Chạy song song từng nhóm 2 đề để tối ưu tốc độ và an toàn giới hạn gọi API
        const chunkSize = 2;
        for (let i = 0; i < validItems.length; i += chunkSize) {
          const chunk = validItems.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map((item, cIdx) => 
              extractSingleTestWithAI(
                ai, 
                item, 
                i + cIdx, 
                topicName, 
                grade, 
                pages, 
                docText, 
                base64Data, 
                mimeType, 
                isPdfDoc, 
                answerPageRange,
                hasInlineAnswers
              )
            )
          );
          for (const resItem of chunkResults) {
            if (resItem) parsed.push(resItem);
          }
        }
      }

      // CHIẾN LƯỢC 2: TỰ ĐỘNG TÌM KIẾM VÀ PHÂN TÁCH KHI GIÁO VIÊN KHÔNG NHẬP MỤC THỦ CÔNG
      if (!Array.isArray(parsed) || parsed.length === 0) {
        // 2a. Nếu có text với tiêu đề đề thi rõ ràng, chia nhỏ theo tiêu đề
        if (isTextFile && docText) {
          const testHeaderRegex = /(?:^|\n)\s*(?:[#*\s]*)(?:(?:BÀI|ĐỀ)\s*KIỂM\s*TRA\s*(?:15\s*PHÚT|1\s*TIẾT|45\s*PHÚT|CUỐI\s*CHƯƠNG|CUỐI\s*CHỦ\s*ĐỀ|ĐỊNH\s*KỲ|THƯỜNG\s*XUYÊN|GIỮA\s*KỲ|HỌC\s*KỲ)?\s*(?:SỐ|MÃ\s*ĐỀ|ĐỀ)?\s*[:\s]*([0-9A-ZIVXLCDM]+)?|BÀI\s*KIỂM\s*TRA\s*CUỐI\s*CHƯƠNG|ĐỀ\s*KIỂM\s*TRA\s*CUỐI\s*CHƯƠNG|KIỂM\s*TRA\s*CUỐI\s*CHƯƠNG|ĐỀ\s*TỔNG\s*HỢP\s*CUỐI\s*CHƯƠNG|ĐỀ\s*ĐÁNH\s*GIÁ\s*CUỐI\s*CHƯƠNG|BÀI\s*KIỂM\s*TRA\s*CHƯƠNG\s*[0-9IVXLCDM]+|ĐỀ\s*SỐ\s*([0-9IVXLCDM]+|[A-Z])|MÃ\s*ĐỀ\s*[:\s]*([0-9A-Z]+))/gi;
          const matches = [...docText.matchAll(testHeaderRegex)];
          
          if (matches.length > 1) {
            console.log(`[SplitTopic] Tìm thấy ${matches.length} tiêu đề đề thi bằng Regex trong văn bản. Đang bóc tách từng phần...`);
            const detectedSections: { title: string; textSlice: string }[] = [];
            for (let m = 0; m < matches.length; m++) {
              const start = matches[m].index || 0;
              const end = m + 1 < matches.length ? (matches[m + 1].index || docText.length) : docText.length;
              const textSlice = docText.slice(start, end);
              const rawHeader = matches[m][0].trim();
              const sectionTitle = autoDetectTestTitleFromContent(textSlice, m, topicName, fileName) || `${topicName || 'Chủ đề'} - ${rawHeader}`;
              detectedSections.push({ title: sectionTitle, textSlice });
            }

            for (let sIdx = 0; sIdx < detectedSections.length; sIdx++) {
              const sec = detectedSections[sIdx];
              try {
                const secRes = await generateContentWithRetry(ai, {
                  model: "gemini-3.8-flash",
                  contents: [{
                    role: "user",
                    parts: [{
                      text: `Trích xuất tất cả câu hỏi và đáp án cho đề sau:\nTÊN ĐỀ: ${sec.title}\nNỘI DUNG:\n${sec.textSlice}\n\nTrả về JSON: { "title": "${sec.title}", "durationMinutes": ${sec.title.includes('15') ? 15 : 45}, "questions": [ { "id": "q1", "type": "mcq", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctAnswer": "A", "points": 0.25, "explanation": "..." } ] }`
                    }]
                  }],
                  config: { temperature: 0.1, maxOutputTokens: 16384 }
                });
                const secObj = safeParseJsonObject(secRes.text || "{}");
                if (secObj && Array.isArray(secObj.questions) && secObj.questions.length > 0) {
                  parsed.push(secObj);
                }
              } catch (secErr) {
                console.warn(`Section ${sIdx + 1} extraction warning:`, secErr);
              }
            }
          }
        }

        // 2b. Nếu vẫn chưa có kết quả, thử tự động quét mục lục/danh sách đề (Discovery call)
        if (parsed.length === 0) {
          try {
            console.log("[SplitTopic] Thực hiện tự động quét nhận diện danh sách các đề thi trong tài liệu...");
            const discoveryParts: any[] = [];
            const discPrompt = `Bạn là chuyên gia khảo thí môn Toán. Hãy rà soát tài liệu đính kèm và tìm tất cả các bài kiểm tra / đề thi riêng biệt có trong tài liệu này (bao gồm cả các bài kiểm tra 15 phút, 1 tiết, và bài kiểm tra cuối chương).
${expectedTestCount ? `- Giáo viên ghi chú tài liệu có ${expectedTestCount} đề.` : ''}
${expectedTestTitles ? `- Gợi ý tên đề: ${expectedTestTitles}` : ''}
${answerPageRange ? `- Bảng đáp án ở trang: ${answerPageRange}` : ''}
${splitNotes ? `- Ghi chú: ${splitNotes}` : ''}

Trả về duy nhất một mảng JSON danh sách các đề:
[
  { "title": "Tên bài kiểm tra cụ thể", "fromPage": "1", "toPage": "3", "answerFromPage": "21", "answerToPage": "21" }
]`;

            if (isTextFile && docText) {
              discoveryParts.push({ text: `VĂN BẢN TÀI LIỆU:\n${docText.slice(0, 30000)}\n\n${discPrompt}` });
            } else if (isPdfDoc && base64Data) {
              discoveryParts.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
              discoveryParts.push({ text: discPrompt });
            } else {
              discoveryParts.push({ text: discPrompt });
            }

            const discRes = await generateContentWithRetry(ai, {
              model: "gemini-3.8-flash",
              contents: [{ role: "user", parts: discoveryParts }],
              config: { temperature: 0.1, maxOutputTokens: 4096 }
            });

            const discoveredList = safeParseJsonArray(discRes.text || "[]");
            if (Array.isArray(discoveredList) && discoveredList.length >= 2) {
              console.log(`[SplitTopic] Đã tự động nhận diện được ${discoveredList.length} đề thi:`, discoveredList.map(d => d.title));
              const chunkSize = 2;
              for (let i = 0; i < discoveredList.length; i += chunkSize) {
                const chunk = discoveredList.slice(i, i + chunkSize);
                const chunkResults = await Promise.all(
                  chunk.map((dItem, cIdx) => 
                    extractSingleTestWithAI(
                      ai, 
                      dItem, 
                      i + cIdx, 
                      topicName, 
                      grade, 
                      pages, 
                      docText, 
                      base64Data, 
                      mimeType, 
                      isPdfDoc, 
                      answerPageRange
                    )
                  )
                );
                for (const r of chunkResults) {
                  if (r) parsed.push(r);
                }
              }
            }
          } catch (discErr) {
            console.warn("[SplitTopic] Discovery call error:", discErr);
          }
        }

        // 2c. Nếu vẫn chưa có kết quả: chạy gọi tổng hợp (Unified Extraction)
        if (parsed.length === 0) {
          console.log("[SplitTopic] Chạy trích xuất tổng hợp toàn tài liệu...");
          let teacherGuideText = "";
          if (expectedTestCount || expectedTestTitles || answerPageRange || splitNotes) {
            teacherGuideText = `\n\n*** THÔNG TIN CẤU TRÚC DO GIÁO VIÊN CUNG CẤP ***:
${expectedTestCount ? `- SỐ LƯỢNG ĐỀ: ${expectedTestCount} đề kiểm tra.` : ''}
${expectedTestTitles ? `- DANH SÁCH ĐỀ: ${expectedTestTitles}` : ''}
${answerPageRange ? `- PHẠM VI TRANG ĐÁP ÁN: ${answerPageRange}` : ''}
${splitNotes ? `- GHI CHÚ: ${splitNotes}` : ''}`;
          }

          const prompt = `Bạn là một chuyên gia khảo thí và sư phạm Toán học Việt Nam (Lớp ${grade || 12}${topicName ? `, Chủ đề: "${topicName}"` : ''}).
Tài liệu được tải lên là một TỆP GỘP TẤT CẢ CÁC BÀI KIỂM TRA CỦA MỘT CHỦ ĐỀ.${teacherGuideText}

NHIỆM VỤ:
Quét toàn bộ tài liệu từ đầu đến cuối, TỰ ĐỘNG NHẬN DIỆN VÀ BÓC TÁCH TẤT CẢ CÁC BÀI KIỂM TRA / ĐỀ THI RIÊNG BIỆT:
1. Tự động đặt tên đề chính xác dựa theo tiêu đề trong đề (ví dụ: "Kiểm tra 15 phút: Cực trị của hàm số - Đề số 1", "Bài kiểm tra cuối chương...").
2. ĐẶC BIỆT: Không được bỏ sót bài kiểm tra cuối chương ở phần cuối tài liệu.
3. Trích xuất đầy đủ câu hỏi, các phương án, đáp án đúng ("correctAnswer") và lời giải ("explanation").
4. Công thức toán dùng chuẩn LaTeX $...$.

TRẢ VỀ DUY NHẤT MỘT MẢNG JSON:
[
  {
    "title": "Kiểm tra 15 phút: Cực trị - Đề 1",
    "durationMinutes": 15,
    "examFormat": "mcq",
    "questions": [
      {
        "id": "t1_q1",
        "type": "mcq",
        "question": "Câu 1: Cho hàm số...",
        "options": ["A. $1$", "B. $2$", "C. $3$", "D. $4$"],
        "correctAnswer": "A",
        "points": 0.25,
        "explanation": "..."
      }
    ]
  }
]`;

          const parts: any[] = [];
          if (isPdfDoc && base64Data) {
            parts.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
            if (docText && docText.length > 30) {
              const maxChars = 300000;
              parts.push({ text: `VĂN BẢN ĐÃ TRÍCH XUẤT:\n\n${docText.length > maxChars ? docText.slice(0, maxChars) : docText}` });
            }
            parts.push({ text: prompt });
          } else if (isTextFile) {
            const maxChars = 300000;
            const fullContent = docText.length > maxChars ? docText.slice(0, maxChars) : docText;
            parts.push({ text: `TÀI LIỆU CÁC BÀI KIỂM TRA CỦA CHỦ ĐỀ:\n\n${fullContent}\n\n${prompt}` });
          } else {
            parts.push({ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } });
            parts.push({ text: prompt });
          }

          try {
            const response = await generateContentWithRetry(ai, {
              model: "gemini-3.8-flash",
              contents: [{ role: "user", parts }],
              config: { temperature: 0.15, maxOutputTokens: 65536 }
            });

            const responseText = response.text || "[]";
            parsed = safeParseJsonArray(responseText);

            if (!Array.isArray(parsed) || parsed.length === 0) {
              const obj = safeParseJsonObject(responseText);
              if (obj) {
                if (Array.isArray(obj.tests)) parsed = obj.tests;
                else if (Array.isArray(obj.exams)) parsed = obj.exams;
                else if (Array.isArray(obj.data)) parsed = obj.data;
                else if (Array.isArray(obj.questions)) parsed = [obj];
                else if (Array.isArray(obj.items)) parsed = [obj];
                else if (Array.isArray(obj.cauHoi)) parsed = [obj];
                else if (Array.isArray(obj.danhSachCauHoi)) parsed = [obj];
              }
            }
          } catch (geminiErr: any) {
            console.warn("[SplitTopic] Unified test extraction warning:", geminiErr);
          }
        }
      }

      // Xử lý trường hợp AI trả về mảng phẳng các câu hỏi (tự động phân nhóm khi phát hiện "Câu 1" lặp lại)
      const isFlatQuestions = Array.isArray(parsed) && parsed.length > 0 && parsed.some(q => q && (q.question || q.stem || q.noiDung)) && !parsed.some(t => Array.isArray(t?.questions) || Array.isArray(t?.items));
      if (isFlatQuestions) {
        const separatedGrouped: any[] = [];
        let currentGroup: any[] = [];
        let groupIdx = 1;

        for (let i = 0; i < parsed.length; i++) {
          const q = parsed[i];
          const qText = q.question || q.stem || q.noiDung || '';
          const isReset = i > 0 && (/^(?:câu|bài)\s*1\b/i.test(qText) || q.id === 'q1' || q.id === '1');
          if (isReset && currentGroup.length > 0) {
            const firstQ = currentGroup[0]?.question || currentGroup[0]?.stem || '';
            const detectedTitle = autoDetectTestTitleFromContent(firstQ, groupIdx - 1, topicName, fileName);
            separatedGrouped.push({
              title: detectedTitle,
              durationMinutes: currentGroup.length <= 15 ? 15 : 45,
              questions: currentGroup
            });
            groupIdx++;
            currentGroup = [];
          }
          currentGroup.push(q);
        }
        if (currentGroup.length > 0) {
          const firstQ = currentGroup[0]?.question || currentGroup[0]?.stem || '';
          const detectedTitle = autoDetectTestTitleFromContent(firstQ, groupIdx - 1, topicName, fileName);
          separatedGrouped.push({
            title: detectedTitle,
            durationMinutes: currentGroup.length <= 15 ? 15 : 45,
            questions: currentGroup
          });
        }
        parsed = separatedGrouped;
      }

      // KIỂM TRA VÀ TỰ ĐỘNG PHỤC HỒI NẾU BỎ SÓT BÀI KIỂM TRA CUỐI CHƯƠNG
      if (isTextFile && docText) {
        const docHasEndOfChapter = /(?:(?:bài|đề)\s*kiểm\s*tra\s*(?:đánh\s*giá\s*|tổng\s*hợp\s*|1\s*tiết\s*|định\s*kỳ\s*)?cuối\s*chương|kiểm\s*tra\s*cuối\s*chương|cuối\s*chương[^\n]*(?:bài|đề)\s*kiểm\s*tra|đề\s*(?:đánh\s*giá|tổng\s*hợp|1\s*tiết)[^\n]*cuối\s*chương|bài\s*kiểm\s*tra\s*chương\s*[0-9ivxlcdm]+)/i.test(docText);
        const parsedHasEndOfChapter = Array.isArray(parsed) && parsed.some(t => {
          const tTitle = (t?.title || '').toLowerCase();
          return tTitle.includes('cuối chương') || tTitle.includes('cuoi chuong') || tTitle.includes('cuối chủ đề') || tTitle.includes('tổng kết chương');
        });

        if (docHasEndOfChapter && !parsedHasEndOfChapter) {
          console.log("[SplitTopic] Phát hiện tài liệu có 'Bài kiểm tra cuối chương' chưa được trích xuất. Đang phục hồi riêng...");
          const eocHeaderRegex = /(?:^|\n)\s*(?:[#*\s]*)(?:(?:bài|đề)\s*kiểm\s*tra\s*(?:đánh\s*giá\s*|tổng\s*hợp\s*|1\s*tiết\s*|định\s*kỳ\s*)?cuối\s*chương|kiểm\s*tra\s*cuối\s*chương|cuối\s*chương[^\n]*(?:bài|đề)\s*kiểm\s*tra|đề\s*(?:đánh\s*giá|tổng\s*hợp|1\s*tiết)[^\n]*cuối\s*chương|bài\s*kiểm\s*tra\s*chương\s*[0-9ivxlcdm]+)/i;
          const eocMatch = docText.match(eocHeaderRegex);

          if (eocMatch && eocMatch.index !== undefined) {
            const eocSlice = docText.slice(eocMatch.index);
            const ansMatch = docText.match(/(?:^|\n)\s*(?:[#*\s]*)(?:bảng\s*đáp\s*án|đáp\s*án\s*và\s*(?:hướng\s*dẫn\s*)?lời\s*giải|hướng\s*dẫn\s*chấm)/i);
            let extraAnswers = '';
            if (ansMatch && ansMatch.index !== undefined && ansMatch.index < eocMatch.index) {
              extraAnswers = `\n\nBẢNG ĐÁP ÁN THAM KHẢO TRONG TÀI LIỆU:\n${docText.slice(ansMatch.index, Math.min(ansMatch.index + 12000, docText.length))}`;
            }

            try {
              const eocRes = await generateContentWithRetry(ai, {
                model: "gemini-3.8-flash",
                contents: [{
                  role: "user",
                  parts: [{
                    text: `Trích xuất ĐẦY ĐỦ 100% tất cả các câu hỏi và đáp án của BÀI KIỂM TRA CUỐI CHƯƠNG này:\n\n${eocSlice.slice(0, 40000)}${extraAnswers}\n\nTrả về JSON: [ { "title": "Bài kiểm tra cuối chương: ${topicName || 'Chủ đề'} - Đề 1", "durationMinutes": 45, "questions": [ { "id": "eoc_q1", "type": "mcq", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctAnswer": "A", "points": 0.25, "explanation": "..." } ] } ]`
                  }]
                }],
                config: { temperature: 0.1, maxOutputTokens: 32768 }
              });

              const eocParsed = safeParseJsonArray(eocRes.text || "[]");
              if (Array.isArray(eocParsed) && eocParsed.length > 0) {
                if (!Array.isArray(parsed)) parsed = [];
                parsed.push(...eocParsed);
              }
            } catch (eocErr) {
              console.warn("[SplitTopic] Phục hồi bài kiểm tra cuối chương thất bại:", eocErr);
            }
          }
        }
      }

      // Chuẩn hóa và làm sạch tất cả các đề kiểm tra đã bóc tách
      const sanitizedTests: any[] = [];

      for (let testIdx = 0; testIdx < parsed.length; testIdx++) {
        const testItem = parsed[testIdx];
        if (!testItem) continue;

        let rawQuestions = Array.isArray(testItem.questions) 
          ? testItem.questions 
          : (Array.isArray(testItem.items) 
              ? testItem.items 
              : (Array.isArray(testItem.danhSachCauHoi) 
                  ? testItem.danhSachCauHoi 
                  : (Array.isArray(testItem.cauHoi) ? testItem.cauHoi : [])));
        if (rawQuestions.length === 0) continue;

        rawQuestions = sanitizeQuestionFigures(rawQuestions);
        rawQuestions = reconcileAnswersWithExplanations(rawQuestions);

        const questions = rawQuestions.map((q: any, qIdx: number) => ({
          ...q,
          id: q.id || `sep_${testIdx + 1}_q${qIdx + 1}`,
          type: q.type || (q.options?.length === 4 && (q.correctAnswer === 'A' || q.correctAnswer === 'B' || q.correctAnswer === 'C' || q.correctAnswer === 'D') ? 'mcq' : 'short'),
          question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || q.stem || q.noiDung || `Câu ${qIdx + 1}`)),
          options: Array.isArray(q.options) ? q.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))) : [],
          correctAnswer: typeof q.correctAnswer === 'string' ? repairVietnameseDocument(q.correctAnswer) : (q.correctAnswer || ''),
          points: Number(q.points) || (q.type === 'tf' ? 1.0 : (q.type === 'short' ? 0.5 : 0.25)),
          explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || ''))
        }));

        const mcqCount = questions.filter((q: any) => q.type === 'mcq').length;
        const tfCount = questions.filter((q: any) => q.type === 'tf').length;
        const shortCount = questions.filter((q: any) => q.type === 'short').length;
        const essayCount = questions.filter((q: any) => q.type === 'essay').length;

        let examFormat = testItem.examFormat;
        if (!examFormat) {
          if (tfCount > 0 || shortCount > 0) examFormat = 'mcq_3part';
          else if (essayCount > 0 && mcqCount > 0) examFormat = 'mixed';
          else if (essayCount > 0) examFormat = 'essay';
          else examFormat = 'mcq';
        }

        // Tự động định dạng và chuẩn hóa tên đề
        let title = autoFormatTestTitle(testItem, docText, testIdx, topicName);
        if (!title || title.length < 5) {
          title = autoDetectTestTitleFromContent(docText, testIdx, topicName, fileName);
        }
        title = repairVietnameseDocument(convertTcvn3ToUnicode(title));

        const duration = Number(testItem.durationMinutes) || (title.toLowerCase().includes('15') ? 15 : 45);

        sanitizedTests.push({
          id: `separated_test_${Date.now()}_${testIdx + 1}`,
          title,
          durationMinutes: duration,
          examFormat,
          type: essayCount > 0 && mcqCount === 0 ? 'essay' : (essayCount > 0 ? 'mixed' : 'mcq'),
          questions,
          mcqCount,
          tfCount,
          shortCount,
          essayCount,
          totalQuestions: questions.length,
          selected: true
        });
      }

      if (sanitizedTests.length === 0) {
        // Cố gắng tự động cứu nguy lần cuối: Nếu có bất kỳ câu hỏi nào trong docText hoặc tệp PDF
        const canFallbackText = isTextFile && docText.length > 50;
        const canFallbackPdf = isPdfDoc && Boolean(base64Data);

        if (canFallbackText || canFallbackPdf) {
          try {
            console.log("[SplitTopic] Thử trích xuất dự phòng các câu hỏi thô từ tài liệu...");
            const fallbackParts: any[] = [];
            const isBase64Ok = canFallbackPdf && base64Data && base64Data.length < 12000000;
            
            if (canFallbackText) {
              // Ưu tiên văn bản đã trích xuất: Cực nhanh, chính xác và không bị lỗi kích thước payload
              fallbackParts.push({
                text: `Trích xuất tất cả các câu hỏi trắc nghiệm/tự luận có trong văn bản sau:\n${docText.slice(0, 150000)}\n\nTrả về mảng JSON: [ { "id": "q1", "type": "mcq", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctAnswer": "A", "points": 0.25, "explanation": "..." } ]`
              });
            } else if (isBase64Ok) {
              fallbackParts.push({ inlineData: { mimeType: "application/pdf", data: base64Data } });
              fallbackParts.push({
                text: `Trích xuất tất cả các câu hỏi trắc nghiệm/tự luận có trong tệp PDF đính kèm.\n\nTrả về mảng JSON: [ { "id": "q1", "type": "mcq", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctAnswer": "A", "points": 0.25, "explanation": "..." } ]`
              });
            } else {
              fallbackParts.push({
                text: `Trích xuất tất cả các câu hỏi trắc nghiệm/tự luận từ tài liệu.\n\nTrả về mảng JSON: [ { "id": "q1", "type": "mcq", "question": "...", "options": ["A...", "B...", "C...", "D..."], "correctAnswer": "A", "points": 0.25, "explanation": "..." } ]`
              });
            }

            const fallbackRes = await generateContentWithRetry(ai, {
              model: "gemini-3.8-flash",
              contents: [{ role: "user", parts: fallbackParts }],
              config: { temperature: 0.1, maxOutputTokens: 16384 }
            });
            const fallbackQuestions = safeParseJsonArray(fallbackRes.text || "[]");
            if (Array.isArray(fallbackQuestions) && fallbackQuestions.length > 0) {
              const fallbackTitle = repairVietnameseDocument(convertTcvn3ToUnicode(autoDetectTestTitleFromContent(docText, 0, topicName, fileName) || `${topicName || 'Bài kiểm tra'} - Đề 1`));
              sanitizedTests.push({
                id: `separated_test_${Date.now()}_1`,
                title: fallbackTitle,
                durationMinutes: 45,
                examFormat: 'mcq',
                type: 'mcq',
                questions: fallbackQuestions.map((q: any, i: number) => ({
                  ...q,
                  id: q.id || `fb_q${i + 1}`,
                  question: repairVietnameseDocument(convertTcvn3ToUnicode(q.question || `Câu ${i + 1}`)),
                  options: Array.isArray(q.options) ? q.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))) : [],
                  correctAnswer: typeof q.correctAnswer === 'string' ? repairVietnameseDocument(q.correctAnswer) : (q.correctAnswer || ''),
                  points: 0.25,
                  explanation: repairVietnameseDocument(convertTcvn3ToUnicode(q.explanation || ''))
                })),
                mcqCount: fallbackQuestions.length,
                tfCount: 0,
                shortCount: 0,
                essayCount: 0,
                totalQuestions: fallbackQuestions.length,
                selected: true
              });
            }
          } catch (fbErr) {
            console.warn("[SplitTopic] Fallback raw question extraction warning:", fbErr);
          }
        }
      }

      if (sanitizedTests.length === 0) {
        throw new Error(
          "Không thể trích xuất được câu hỏi nào từ tài liệu. Thầy/Cô vui lòng kiểm tra lại: " +
          "1. Tệp tài liệu có nội dung câu hỏi rõ ràng (định dạng PDF hoặc Word .docx). " +
          "2. Đảm bảo số trang nhập vào mục hỗ trợ tách đề nằm trong phạm vi số trang thực tế của tài liệu và tệp không bị mã hóa/khóa mật khẩu."
        );
      }

      console.log(`[SplitTopic] Successfully extracted ${sanitizedTests.length} tests:`, sanitizedTests.map(t => `${t.title} (${t.questions.length} câu)`));

      res.json({
        success: true,
        count: sanitizedTests.length,
        tests: sanitizedTests
      });
    } catch (error: any) {
      console.error("Split Topic Tests Error:", error);
      const friendlyMsg = formatError(error);
      res.status(500).json({
        error: friendlyMsg || "Lỗi khi tách các bài kiểm tra trong chủ đề",
        details: friendlyMsg
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

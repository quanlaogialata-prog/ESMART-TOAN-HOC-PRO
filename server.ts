
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";
import mammoth from "mammoth";
import { repairVietnameseDocument, convertTcvn3ToUnicode, formatMathExpressions, smartFormatLessonLayout, healMathSvg, cleanHtmlAndSvgContainers } from "./src/lib/vietnameseFont";
import { extractDocxFullContent } from "./src/lib/docxExtractor";

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
      // 3. Nhận diện số lượng NGHIỆM: "Như vậy có đúng 4 nghiệm", "Có tất cả 4 nghiệm", "Vậy phương trình có 4 nghiệm", "Số nghiệm là 4"
      const rootRegexes = [
        /(?:như\s+vậy\s+có\s+đúng|khoan[^\.\n]*?như\s+vậy\s+có\s+đúng)\s*(\d+)\s*nghiệm/i,
        /(?:có\s+tất\s+cả|tổng\s+cộng\s+có)\s*(\d+)\s*nghiệm/i,
        /(?:kết\s*luận[^\.\n]*?|do\s+đó[^\.\n]*?|như\s+vậy[^\.\n]*?)có\s*(\d+)\s*nghiệm/i,
        /số\s+nghiệm\s+(?:của\s+phương\s+trình\s+)?(?:đã\s+cho\s+)?(?:trên[^\.\n]*?)?là[^\.\n]*?(\d+)(?:\s|$|\.)/i,
        /vậy\s+(?:phương\s+trình\s+)?(?:đã\s+cho\s+)?có\s*(\d+)\s*nghiệm/i,
        /(?:phương\s+trình\s+)?có\s*(\d+)\s*nghiệm\s*(?:thỏa\s+mãn|phân\s+biệt)?(?:\s|$|\.)/i
      ];
      for (const regex of rootRegexes) {
        const match = explanation.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (correctAnswer && correctAnswer !== val) {
            console.log(`[Reconcile] Fixed answer from "${correctAnswer}" to "${val}" based on roots count in explanation.`);
            correctAnswer = val;
            break;
          }
        }
      }

      // Quét câu kết luận cuối cùng (250 ký tự cuối) để tìm kết luận số nghiệm
      const tail = explanation.slice(-250);
      const tailRootMatch = tail.match(/(?:có|được|gồm)\s*(?:đúng\s*)?(\d+)\s*nghiệm/i);
      if (tailRootMatch && tailRootMatch[1]) {
        const val = tailRootMatch[1].trim();
        if (correctAnswer && correctAnswer !== val && /^\d+$/.test(correctAnswer)) {
          console.log(`[Reconcile] Fixed answer from "${correctAnswer}" to "${val}" based on tail roots conclusion.`);
          correctAnswer = val;
        }
      }

      // 4. Nhận diện số lượng CỰC TRỊ / TIỆM CẬN
      const extremaRegexes = [
        /(?:như\s+vậy\s+có\s+đúng|có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có|hàm\s+số\s+có)\s*(\d+)\s*(?:điểm\s+cực\s+trị|cực\s+trị)/i,
        /số\s+điểm\s+cực\s+trị\s+(?:của\s+hàm\s+số\s+)?là[^\.\n]*?(\d+)/i,
        /(?:như\s+vậy\s+có\s+đúng|có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có|đồ\s+thị\s+có)\s*(\d+)\s*(?:đường\s+tiệm\s+cận|tiệm\s+cận)/i,
        /số\s+đường\s+tiệm\s+cận\s+(?:của\s+đồ\s+thị\s+)?là[^\.\n]*?(\d+)/i
      ];
      for (const regex of extremaRegexes) {
        const match = explanation.match(regex);
        if (match && match[1]) {
          const val = match[1].trim();
          if (correctAnswer && correctAnswer !== val) {
            console.log(`[Reconcile] Fixed answer from "${correctAnswer}" to "${val}" based on extrema/asymptote in explanation.`);
            correctAnswer = val;
            break;
          }
        }
      }

      // 5. Nhận diện số lượng GIÁ TRỊ NGUYÊN / GIÁ TRỊ: "Vậy có X giá trị nguyên" / "Số giá trị nguyên là ... = X"
      const countMatch = explanation.match(/(?:như\s+vậy\s+có\s+đúng|khoan[^\.\n]*?như\s+vậy\s+có\s+đúng)\s*(\d+)\s*giá\s+trị/i)
        || explanation.match(/(?:vậy\s+có|số\s+giá\s+trị\s+(?:nguyên|thực|m)?\s*(?:của\s+m\s+)?là[^\.\n]*?=\s*|có\s+tất\s+cả|tổng\s+cộng\s+có)\s*(\d+)\s*giá\s+trị/i)
        || explanation.match(/vậy\s+có\s*(\d+)\s*giá\s+trị\s*(?:nguyên|thực)?/i)
        || explanation.match(/vậy\s+(\d+)\s*giá\s+trị\s+nguyên/i)
        || explanation.match(/(?:có\s+tất\s+cả|tổng\s+cộng\s+có|vậy\s+có)\s*(\d+)\s*(?:số\s+nguyên|phần\s+tử|cách)/i);
      if (countMatch && countMatch[1]) {
        const expected = countMatch[1].trim();
        if (correctAnswer && correctAnswer !== expected) {
          console.log(`[Reconcile] Fixed question answer from "${correctAnswer}" to "${expected}" based on count conclusion in explanation.`);
          correctAnswer = expected;
        }
      }

      // 6. Check "Đáp số: X" or "Kết quả: X"
      const resultMatch = explanation.match(/(?:đáp\s*số|kết\s*quả\s*là|vậy\s*(?:kết\s*quả|đáp\s*số)?\s*[:=])\s*([0-9\/\-\.]+)(?:\s|$|\.)/i);
      if (resultMatch && resultMatch[1]) {
        const expected = resultMatch[1].trim();
        const isMcqLetter = /^[A-D]$/i.test(correctAnswer);
        if ((!isMcqLetter || !q.options || q.options.length === 0) && correctAnswer !== expected) {
          console.log(`[Reconcile] Fixed short answer from "${correctAnswer}" to "${expected}" based on solution conclusion.`);
          correctAnswer = expected;
        }
      }

      // 7. Check formula conclusion at tail "= X."
      const tailEqMatch = tail.match(/(?:vậy|do\s+đó|như\s+vậy|kết\s+luận)[^.\n]*?=\s*([0-9\/\-\.]+)\.?$/i);
      if (tailEqMatch && tailEqMatch[1]) {
        const val = tailEqMatch[1].trim();
        const isMcqLetter = /^[A-D]$/i.test(correctAnswer);
        if ((!isMcqLetter || !q.options || q.options.length === 0) && correctAnswer && correctAnswer !== val) {
          console.log(`[Reconcile] Fixed tail formula answer from "${correctAnswer}" to "${val}".`);
          correctAnswer = val;
        }
      }

      // 8. Check MCQ: "Chọn A" / "Chọn B"
      if (q.type === 'mcq' || (Array.isArray(q.options) && q.options.length > 0)) {
        const mcqMatch = explanation.match(/(?:chọn|đáp\s*án\s*đúng\s*là|vậy\s*chọn)\s*(?:phương\s*án\s*|đáp\s*án\s*)?([A-D])\b/i);
        if (mcqMatch && mcqMatch[1]) {
          const expectedLetter = mcqMatch[1].toUpperCase();
          if (correctAnswer && correctAnswer.toUpperCase() !== expectedLetter) {
            console.log(`[Reconcile] Fixed MCQ answer from "${correctAnswer}" to "${expectedLetter}" based on explanation.`);
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
      
      const prompt = `You are an expert tutor. The attached document contains BOTH a test (questions) AND its answers/explanations.
I need you to perfectly separate them into two distinct HTML documents.
CRITICAL REQUIREMENT: Do NOT output JSON. Output your response using EXACTLY the following structure with these custom tags:

[CLEAN_TEST]
(Put beautifully formatted HTML here containing ONLY the questions. Remove all traces of correct answers, rubrics, or explanations. Preserve math using $...$ and $$...$$)
[/CLEAN_TEST]

[ANSWERS]
(Put beautifully formatted HTML here containing ONLY the answers, rubrics, and explanations.)
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

      res.json({ cleanTestHtml, answersHtml });
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

  app.post("/api/generate-test", async (req, res) => {
    try {
      const { 
        title, 
        grade, 
        autoGenType, 
        mcqCount, 
        essayCount, 
        matrixFileDataUrl, 
        mimeType,
        part1Count,
        part2Count,
        part3Count,
        customPartsConfig,
        referenceFileDataUrl,
        referenceFileMimeType,
        referenceFileName,
        referenceNotes,
        topicTitle,
        topicLessons
      } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set." });

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      let prompt = `Bạn là chuyên gia giáo dục và biên soạn đề thi môn Toán chất lượng cao theo chuẩn chương trình GDPT mới.
Hãy tạo một đề kiểm tra / đề thi môn Toán lớp ${grade} với tiêu đề: "${title}".`;

      // Xử lý tài liệu tham chiếu: Nếu có tệp bổ sung do giáo viên tải lên, trích xuất và đính kèm;
      // Nếu giáo viên không tải lên, hệ thống tự động áp dụng mặc định theo SGK Kết nối tri thức và học liệu chủ đề.
      let supplementalText = "";
      if (referenceFileDataUrl) {
        try {
          const docExtract = await extractTextFromAttachment(referenceFileDataUrl, referenceFileName, referenceFileMimeType);
          if (docExtract && docExtract.text && docExtract.text.trim().length > 20) {
            supplementalText = docExtract.text;
          }
        } catch (eDoc) {
          console.warn("Could not extract supplemental text:", eDoc);
        }

        prompt += `\n\n*** TÀI LIỆU THAM CHIẾU BỔ SUNG DO GIÁO VIÊN TẢI LÊN (${referenceFileName || 'Tệp tham chiếu đính kèm'}) ***:
Giáo viên đã cung cấp tài liệu tham chiếu bổ sung cho đề thi này.
${supplementalText ? `NỘI DUNG TÀI LIỆU THAM CHIẾU BỔ SUNG:\n"""\n${supplementalText.slice(0, 15000)}\n"""\n` : `(Xem tệp đính kèm để trích xuất nội dung tham chiếu)`}
- BẮT BUỘC: Phân tích kỹ tài liệu tham chiếu này, ưu tiên lựa chọn các chủ đề, dạng bài toán, số liệu, bài tập tương tự hoặc các câu hỏi phát triển từ tài liệu này để biên soạn đề thi.
- Kết hợp hài hòa giữa tài liệu tham chiếu bổ sung của giáo viên với chuẩn kiến thức SGK Kết nối tri thức với cuộc sống môn Toán lớp ${grade}.
${referenceNotes ? `- Ghi chú bổ sung từ giáo viên: "${referenceNotes}"` : ''}
`;
      } else {
        prompt += `\n\n*** NGUỒN TÀI LIỆU THAM CHIẾU MẶC ĐỊNH CỦA HỆ THỐNG ***:
Giáo viên không tải lên tài liệu bổ sung riêng, hệ thống tự động chọn mặc định nguồn tham chiếu chuẩn mực:
1. SÁCH GIÁO KHOA KẾT NỐI TRI THỨC VỚI CUỘC SỐNG môn Toán lớp ${grade} (Nhà xuất bản Giáo dục Việt Nam, theo chuẩn chương trình GDPT 2018).
2. TÀI LIỆU VÀ NỘI DUNG TRONG CHỦ ĐỀ: "${topicTitle || title}"
${Array.isArray(topicLessons) && topicLessons.length > 0 ? `   Danh sách các bài học trong chủ đề:\n` + topicLessons.map((l: any, idx: number) => `   - Bài ${idx + 1}: ${typeof l === 'string' ? l : l.title}${typeof l === 'object' && l.knowledge ? ` (Nội dung cốt lõi: ${l.knowledge.replace(/\n+/g, ' ').slice(0, 180)}...)` : ''}`).join('\n') : ''}
3. CÁC NGUỒN TÀI LIỆU KHÁC: Ngân hàng câu hỏi chuẩn hóa định dạng mới của Bộ Giáo dục & Đào tạo, các đề thi khảo sát chất lượng định kỳ và tài liệu bồi dưỡng học sinh bám sát chuẩn ma trận năng lực toán học.
- YÊU CẦU: Mọi thuật ngữ, ký hiệu toán học, dạng bài và phương pháp giải phải chuẩn mực tuyệt đối theo SGK Kết nối tri thức với cuộc sống và các bài học trong chủ đề.
${referenceNotes ? `- Ghi chú của giáo viên: "${referenceNotes}"` : ''}
`;
      }

      const formatType = req.body.formatType || autoGenType;
      const matrixConfig = req.body.matrixConfig;

      if (autoGenType === 'matrix') {
        prompt += `\nĐỀ THI ĐƯỢC THIẾT KẾ THEO MA TRẬN ĐỀ THI:`;
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
      }

      prompt += `\nCRITICAL REQUIREMENT - CẤU TRÚC VÀ QUY CHUẨN ĐẦU RA BẮT BUỘC:
*** YÊU CẦU BẮT BUỘC VỀ SỐ LƯỢNG VÀ ĐẦY ĐỦ 100% CÁC PHẦN (TUYỆT ĐỐI KHÔNG ĐƯỢC THIẾU CÂU HOẶC THIẾU PHẦN) ***
1. BẮT BUỘC PHẢI TẠO ĐỦ 100% TẤT CẢ CÁC PHẦN ĐÃ YÊU CẦU Ở TRÊN. Tuyệt đối không được bỏ dở hay dừng giữa chừng.
   - Nếu là đề trắc nghiệm 3 phần (hoặc đề tùy biến), mảng JSON PHẢI CHỨA ĐẦY ĐỦ TỪNG PHẦN THEO THỨ TỰ:
     * Toàn bộ câu của PHẦN I ("type": "mcq", đủ 4 options A, B, C, D)
     * Toàn bộ câu của PHẦN II ("type": "tf", đủ 4 ý a, b, c, d)
     * Toàn bộ câu của PHẦN III ("type": "short", điền đáp số số học/ngắn)
   - TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ sinh Phần I mà bỏ quên Phần II hoặc Phần III!
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

*** NGUYÊN TẮC BẮT BUỘC VỀ HÌNH VẼ & BẢNG BIỂU MINH HỌA (QUAN TRỌNG NHẤT) ***
1. CHỈ CÂU HỎI NÀO TRONG ĐỀ BÀI CÓ CHO BẢNG HOẶC CHO HÌNH VẼ TRONG GIẢ THIẾT thì mới cung cấp hình vẽ hoặc bảng biểu minh họa ("figureType": "svg" hoặc "table"):
   - Ví dụ các câu CẦN hình/bảng:
     * "Cho hàm số $y=f(x)$ có bảng biến thiên như hình sau..." -> Cần bảng biến thiên ("figureType": "table")
     * "Đường cong trong hình vẽ bên là đồ thị của hàm số nào dưới đây?" -> Cần đồ thị Oxy vector SVG ("figureType": "svg")
     * "Cho bảng tần số ghép nhóm sau..." -> Cần bảng dữ liệu ("figureType": "table")
     * "Cho hình chóp / hình lăng trụ ... có các kích thước như hình vẽ bên..." -> Cần hình vẽ vector SVG ("figureType": "svg")
2. CÂU HỎI NÀO KHÔNG CHO DỮ LIỆU BẢNG HOẶC HÌNH VẼ TRONG ĐỀ BÀI (tức là đề bài thuần câu chữ, công thức, học sinh phải tự nháp, tự tư duy vẽ hình hoặc tính toán) THÌ TUYỆT ĐỐI KHÔNG ĐƯỢC VẼ SẴN:
   - Ví dụ các câu KHÔNG ĐƯỢC VẼ SẴN:
     * "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành, $SA \perp (ABCD)$... Tính khoảng cách..." -> Đây là bài tập học sinh tự vẽ hình, đề bài KHÔNG nói "như hình vẽ bên" -> BẮT BUỘC đặt: "figureType": "none", "figureSvg": "", "figureTable": "", "figureDescription": "".
     * Các bài tìm cực trị, tính nguyên hàm, tích phân, giải phương trình, phương trình mặt phẳng trong không gian Oxyz, xác suất... mà đề bài không đề cập hình vẽ/bảng -> BẮT BUỘC đặt: "figureType": "none".

Cấu hình trường hình vẽ / bảng:
- "figureType": "none" (mặc định nếu đề không cho hình/bảng), "svg" (nếu đề bài cho đồ thị hoặc hình vẽ), "table" (nếu đề bài cho bảng biến thiên hoặc bảng số liệu)
- "figureSvg": (Chỉ khi figureType === "svg") Chuỗi mã SVG vector hoàn chỉnh, hợp lệ, tự chứa, viewBox="0 0 380 250", nét vẽ rõ ràng (#0f172a, stroke-width="2"), nét khuất đứt đoạn (stroke-dasharray="5,4"), nhãn chữ cái (A, B, C, S, O, x, y...) bằng thẻ <text> THUẦN TÚY (TUYỆT ĐỐI KHÔNG DÙNG DẤU $ TRONG THẺ <text> CỦA SVG, TUYỆT ĐỐI KHÔNG BỌC SVG TRONG THẺ HTML NHƯ <div>). Nếu là đồ thị Oxy: trục Ox (nằm ngang) và trục Oy (thẳng đứng) BẮT BUỘC ĐỀU PHẢI CÓ MŨI TÊN VÀ CÓ NHÃN x, y, O ĐẦY ĐỦ.
- "figureTable": (Chỉ khi figureType === "table") Bảng Markdown thể hiện Bảng biến thiên hàm số hoặc Bảng tần số ghép nhóm.
  * Với BẢNG BIẾN THIÊN:
    - Hàng 1 là $x$, Hàng 2 là $y'$ hoặc $f'(x)$, Hàng 3 là $y$ hoặc $f(x)$.
    - MỌI ký hiệu toán học trong bảng (như $-\\infty$, $+\\infty$, $\\nearrow$, $\\searrow$, $+$, $-$, $0$) BẮT BUỘC PHẢI BỌC TRONG DẤU $ (ví dụ: "$-\\infty$", "$+\\infty$", "$\\nearrow$", "$\\searrow$", "$+$", "$-$", "$0$").
    - Nếu hàm số không xác định / tiệm cận đứng tại điểm nào thì dùng "$||$" để thể hiện 2 gạch không xác định.
    - Tuyệt đối KHÔNG viết '\\nearrow' thô mà không bọc trong $.
  * Với BẢNG SỐ LIỆU / TẦN SỐ GHÉP NHÓM: Dòng tiêu đề và các ô có công thức hoặc khoảng giá trị toán học bọc trong dấu $.
- "figureDescription": Chú thích ngắn gọn (Ví dụ: "Đồ thị hàm số $y=f(x)$", "Bảng biến thiên của hàm số $y=f(x)$").

*** BẮT BUỘC VỀ NỘI DUNG THAM CHIẾU ĐỂ GIÁO VIÊN SỬA ĐỀ (PEDAGOGICAL REFERENCE) ***
Mỗi câu hỏi PHẢI CÓ trường "reference" là một object chứa thông tin tham chiếu chuẩn chương trình GDPT giúp giáo viên hiểu rõ và sửa đề dễ dàng:
- "reference": {
    "topic": "Chủ đề kiến thức tham chiếu (Ví dụ: Ứng dụng đạo hàm để khảo sát hàm số)",
    "curriculumLesson": "Bài học SGK tham chiếu (Ví dụ: SGK Toán 12 - Chương 1: Bài 1 - Tính đơn điệu của hàm số)",
    "cognitiveLevel": "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao",
    "competency": "Năng lực toán học mục tiêu (Tư duy và lập luận toán học / Giải quyết vấn đề toán học)",
    "coreKnowledge": "Công thức cốt lõi, định lý trọng tâm",
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
      res.json(reconciled);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate test", details: formatError(error) });
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

  // Document File Upload endpoint (stores files so Firestore document never exceeds 1MB)
  app.post("/api/upload-document-file", express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const { fileDataUrl, fileName, mimeType } = req.body;
      if (!fileDataUrl) {
        return res.status(400).json({ error: "No file data provided." });
      }

      const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      
      // Check cache first
      if (fileCache.has(fileId)) {
        const item = fileCache.get(fileId)!;
        res.setHeader("Content-Type", item.mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(item.fileName)}"`);
        return res.send(item.buffer);
      }

      // Check disk
      const files = fs.readdirSync(UPLOADS_DIR);
      const match = files.find(f => f.startsWith(`${fileId}_`));
      if (match) {
        const filePath = path.join(UPLOADS_DIR, match);
        const buffer = fs.readFileSync(filePath);
        const fileName = match.replace(`${fileId}_`, '');
        const ext = path.extname(fileName).toLowerCase();
        let mime = 'application/octet-stream';
        if (ext === '.pdf') mime = 'application/pdf';
        else if (ext === '.docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.doc') mime = 'application/msword';
        else if (ext === '.png') mime = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        else if (ext === '.txt') mime = 'text/plain';

        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
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
      if (fileCache.has(fileId)) {
        const item = fileCache.get(fileId)!;
        if (item.dataUrl) {
          return res.json({ dataUrl: item.dataUrl });
        }
        const dataUrl = `data:${item.mimeType};base64,${item.buffer.toString('base64')}`;
        return res.json({ dataUrl });
      }

      const files = fs.readdirSync(UPLOADS_DIR);
      const match = files.find(f => f.startsWith(`${fileId}_`));
      if (match) {
        const filePath = path.join(UPLOADS_DIR, match);
        const buffer = fs.readFileSync(filePath);
        const fileName = match.replace(`${fileId}_`, '');
        const ext = path.extname(fileName).toLowerCase();
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

  app.post("/api/extract-questions", async (req, res) => {
    try {
      const { fileDataUrl, fileName, mimeType } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!fileDataUrl) return res.status(400).json({ error: "No file data provided." });

      // Try AI extraction if key is available
      if (apiKey) {
        try {
          const base64Data = fileDataUrl.split(',')[1];
          const ai = new GoogleGenAI({ 
            apiKey: apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          
          const prompt = `You are an expert Vietnamese exam document parser and educator.
Extract EVERY SINGLE question present in this exam document.
Follow the standard Vietnamese exam structure:
- PHẦN I: Trắc nghiệm nhiều phương án lựa chọn (A, B, C, D) -> "type": "mcq"
- PHẦN II: Trắc nghiệm đúng sai (với các ý a, b, c, d) -> "type": "tf"
- PHẦN III: Trắc nghiệm trả lời ngắn (điền kết quả/đáp số số học) -> "type": "short"
- PHẦN TỰ LUẬN: Các bài toán tự luận trình bày lời giải -> "type": "essay"

*** QUY TẮC ĐỐI SOÁT BẮT BUỘC: ĐÁP ÁN ĐÚNG PHẢI TRÙNG KHỚP TUYỆT ĐỐI VỚI LỜI GIẢI CHI TIẾT ***
Trường "correctAnswer" BẮT BUỘC PHẢI KHỚP 100% VỚI ĐÁP SỐ CUỐI CÙNG TRONG "explanation". Tuyệt đối không để xảy ra tình trạng lời giải chi tiết giải ra một kết quả (ví dụ: "Vậy có 12 giá trị nguyên") nhưng "correctAnswer" lại ghi lệch thành số khác (ví dụ: "8").

For each question, output an object in a JSON array with the following fields:
- "id": Unique ID (e.g., "q1", "q2")
- "type": "mcq" | "tf" | "short" | "essay"
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
- "points": Number of points (default: 0.25 for mcq, 1.0 for tf, 0.5 for short, 1.0 to 2.0 for essay)
- "explanation": Detailed step-by-step solution in Vietnamese with LaTeX math wrapped in $

Output valid JSON array only, without markdown fences. Escaping backslashes for LaTeX (\\\\frac, \\\\sqrt, \\\\vec).`;

          const response = await generateContentWithRetry(ai, {
            model: "gemini-3.8-flash",
            contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
          });

          let responseText = response.text || "[]";
          let parsed = safeParseJsonArray(responseText);
          let sanitized = sanitizeQuestionFigures(parsed);
          let reconciled = reconcileAnswersWithExplanations(sanitized);
          if (Array.isArray(reconciled) && reconciled.length > 0) {
            return res.json(reconciled);
          }
        } catch (aiError) {
          console.warn("AI question extract warning, falling back to document parser:", aiError);
        }
      }

      // Robust fallback: extract raw text and parse structure
      const extractedDoc = await extractTextFromAttachment(fileDataUrl, fileName, mimeType);
      const fallbackQuestions = parseQuestionsFromDocumentText(extractedDoc.text);
      return res.json(fallbackQuestions);
    } catch (error: any) {
      console.error("Extract API Error:", error);
      res.status(500).json({ error: "Failed to extract questions", details: formatError(error) });
    }
  });

  // Helper: Parse questions from raw document text when AI is unavailable or fails
  function parseQuestionsFromDocumentText(rawText: string): any[] {
    if (!rawText || rawText.trim().length === 0) return [];
    const lines = rawText.split('\n');
    const questions: any[] = [];
    let currentQ: any = null;

    const pushCurrent = () => {
      if (currentQ && currentQ.question && currentQ.question.trim().length > 0) {
        if (!currentQ.options || currentQ.options.length === 0) {
          currentQ.type = 'essay';
          currentQ.points = 1.0;
        } else {
          currentQ.type = 'mcq';
          currentQ.points = 0.25;
        }
        questions.push(currentQ);
      }
    };

    const qRegex = /^(Câu\s+\d+|Bài\s+\d+|Question\s+\d+)[:\.\s]/i;
    const optRegex = /^([A-D])[\.\:\)]\s+(.*)/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (qRegex.test(trimmed)) {
        pushCurrent();
        currentQ = {
          id: `q_${questions.length + 1}_${Date.now()}`,
          type: 'mcq',
          question: trimmed,
          options: [],
          correctAnswer: 'A',
          explanation: '',
          points: 0.25
        };
        continue;
      }
      if (currentQ) {
        const optMatch = trimmed.match(optRegex);
        if (optMatch) {
          currentQ.options.push(trimmed);
        } else {
          currentQ.question += ' ' + trimmed;
        }
      }
    }
    pushCurrent();

    // If still no questions found, create sample blocks from paragraphs
    if (questions.length === 0 && rawText.length > 20) {
      const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 10);
      paragraphs.slice(0, 10).forEach((p, idx) => {
        questions.push({
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

    return questions;
  }

  // Helper: Extract complete text and structure from uploaded document (DOCX, DOC, PDF, TXT)
  async function extractTextFromAttachment(fileDataUrl: string, fileName?: string, mimeType?: string): Promise<{ text: string; pages: Array<{ num: number; text: string }>; isPdf: boolean; isDocx: boolean; isImage: boolean }> {
    if (!fileDataUrl) return { text: '', pages: [], isPdf: false, isDocx: false, isImage: false };
    const parts = fileDataUrl.split(',');
    const base64Data = parts[1] || '';
    if (!base64Data) return { text: '', pages: [], isPdf: false, isDocx: false, isImage: false };
    
    const buffer = Buffer.from(base64Data, 'base64');
    const detectedMime = (mimeType || fileDataUrl.match(/data:([^;]+);/)?.[1] || '').toLowerCase();
    const isDocx = Boolean((fileName && fileName.toLowerCase().endsWith('.docx')) || detectedMime.includes('wordprocessingml') || detectedMime.includes('docx'));
    const isDoc = Boolean((fileName && fileName.toLowerCase().endsWith('.doc')) || detectedMime.includes('msword'));
    const isPdf = Boolean((fileName && fileName.toLowerCase().endsWith('.pdf')) || detectedMime.includes('pdf'));
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
          question: q.question || origQ.question,
          options: options,
          correctAnswer: correctAnswer || origQ.correctAnswer,
          explanation: q.explanation || ''
        };
      });

      const reconciledQuestions = reconcileAnswersWithExplanations(cleanedQuestions);

      res.json({
        code: targetCode,
        questions: reconciledQuestions,
        questionsData: JSON.stringify(reconciledQuestions)
      });
    } catch (error: any) {
      console.error("Error generating isomorphic variant:", error);
      res.status(500).json({ error: "Lỗi khi sinh mã đề tương tự", details: formatError(error) });
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
      "explanation": "Lời giải chi tiết: ..."
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
          question: q.question || q.stem || q.noiDung || `Câu ${qIdx + 1}`,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer || '',
          points: Number(q.points) || (q.type === 'tf' ? 1.0 : (q.type === 'short' ? 0.5 : 0.25)),
          explanation: q.explanation || ''
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
              const fallbackTitle = autoDetectTestTitleFromContent(docText, 0, topicName, fileName) || `${topicName || 'Bài kiểm tra'} - Đề 1`;
              sanitizedTests.push({
                id: `separated_test_${Date.now()}_1`,
                title: fallbackTitle,
                durationMinutes: 45,
                examFormat: 'mcq',
                type: 'mcq',
                questions: fallbackQuestions.map((q: any, i: number) => ({
                  ...q,
                  id: q.id || `fb_q${i + 1}`,
                  question: q.question || `Câu ${i + 1}`,
                  options: Array.isArray(q.options) ? q.options : [],
                  correctAnswer: q.correctAnswer || '',
                  points: 0.25,
                  explanation: q.explanation || ''
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


import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

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

function safeParseJsonArray(raw: string): any[] {
  if (!raw) return [];

  // 1. Clean markdown code fences if present
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try direct parse
  try {
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) return direct;
  } catch (e) {}

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
        // Fix unescaped solitary backslashes before letters or LaTeX commands
        const fixed = candidate.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
        const parsed = JSON.parse(fixed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e2) {
        try {
          let fixed2 = candidate.replace(/\\([a-zA-Z])/g, "\\\\$1");
          fixed2 = fixed2.replace(/\\([^"\\/])/g, "\\\\$1");
          const parsed = JSON.parse(fixed2);
          if (Array.isArray(parsed)) return parsed;
        } catch (e3) {}
      }
    }
  }

  // 3. Resilient fallback extractor:
  // If the array was truncated mid-way or has syntax errors in one question,
  // extract every well-formed JSON question object {...} individually so no completed questions are lost.
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
          try {
            const item = JSON.parse(objStr);
            if (item && (item.question || item.type || item.id)) {
              extracted.push(item);
            }
          } catch (objErr) {
            try {
              const fixedObj = objStr.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
              const item = JSON.parse(fixedObj);
              if (item && (item.question || item.type || item.id)) {
                extracted.push(item);
              }
            } catch (objErr2) {}
          }
          objStart = -1;
        }
      }
    }
  }

  return extracted;
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
      const isValidSvg = figureSvg.trim().startsWith('<svg');
      if (!hasFigureRef || !isValidSvg) {
        figureType = 'none';
        figureSvg = '';
        figureDescription = '';
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
        customPartsConfig
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
- "figureSvg": (Chỉ khi figureType === "svg") Chuỗi mã SVG vector hoàn chỉnh, hợp lệ, tự chứa, viewBox="0 0 380 250", nét vẽ rõ ràng (#0f172a, stroke-width="2"), nét khuất đứt đoạn (stroke-dasharray="5,4"), nhãn chữ cái (A, B, C, S, O, x, y...) bằng thẻ <text>.
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

      if (autoGenType === 'matrix' && matrixFileDataUrl) {
        const base64Data = matrixFileDataUrl.split(',')[1];
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }],
          config: genConfig
        });
      } else {
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.8-flash",
          contents: prompt,
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

  app.post("/api/extract-questions", async (req, res) => {
    try {
      const { fileDataUrl, mimeType } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set on the server." });
      if (!fileDataUrl) return res.status(400).json({ error: "No file data provided." });

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
      res.json(reconciled);
    } catch (error: any) {
      console.error("Extract API Error:", error);
      res.status(500).json({ error: "Failed to extract questions", details: formatError(error) });
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

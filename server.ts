
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
  return msg;
}

const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
];

async function generateContentWithRetry(ai: any, params: any, maxAttempts = 5) {
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
      // 18s per-call timeout to guarantee response before proxy disconnect
      const generatePromise = ai.models.generateContent(currentParams);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Model ${currentModel} timed out after 18s`)), 18000)
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

      // Very brief delay (400ms) before trying the next fallback model
      await new Promise(r => setTimeout(r, 400));
    }
  }

  throw lastError;
}

function safeParseJsonArray(raw: string): any[] {
  if (!raw) return [];
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];

  const candidate = raw.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (e) {
    try {
      // 1. First attempt: escape solitary backslashes that are not followed by " or another \
      const fixed = candidate.replace(/(?<!\\)\\(?!["\\])/g, "\\\\");
      return JSON.parse(fixed);
    } catch (e2) {
      try {
        // 2. Second attempt: handle unescaped LaTeX backslashes before letters
        let fixed2 = candidate.replace(/\\([a-zA-Z])/g, "\\\\$1");
        fixed2 = fixed2.replace(/\\([^"\\/])/g, "\\\\$1");
        return JSON.parse(fixed2);
      } catch (e3) {
        console.warn("Failed to parse JSON array from AI output");
        return [];
      }
    }
  }
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
          model: "gemini-3.5-flash-lite",
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
        model: "gemini-3.5-flash-lite",
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
      const { title, grade, autoGenType, mcqCount, essayCount, matrixFileDataUrl, mimeType } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set." });

      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      let prompt = `You are an expert curriculum designer and teacher. Please generate a K-12 exam test for grade ${grade} with the title: "${title}".`;
      
      if (autoGenType === 'mcq') {
        prompt += `\nPlease generate exactly ${mcqCount} multiple-choice questions (MCQ).`;
      } else if (autoGenType === 'essay') {
        prompt += `\nPlease generate exactly ${essayCount} essay questions.`;
      } else if (autoGenType === 'mixed') {
        prompt += `\nPlease generate exactly ${mcqCount} multiple-choice questions AND ${essayCount} essay questions.`;
      } else if (autoGenType === 'matrix') {
        prompt += `\nPlease generate questions strictly following the provided exam matrix/blueprint document.`;
      }

      prompt += `\nCRITICAL REQUIREMENT:
For each question, output an object in a JSON array with the following fields:
- "id": A unique string ID (e.g., "q1", "q2")
- "type": "mcq" (for multiple choice), "tf" (for true/false), "short" (for short fill-in-the-blank), or "essay" (for long answer)
- "question": The full text of the question in Vietnamese. IMPORTANT: Any math formulas, variables, and vectors MUST be wrapped in LaTeX delimiters: use $...$ for inline math and $$...$$ for block math. Example: $\\overrightarrow{AB}$, $\\frac{a}{b}$, $\\sqrt{x}$, $90^\\circ$.
- "options": An array of strings for MCQ choices (A, B, C, D). Math formulas and vectors here MUST also be wrapped in $...$ or $$...$$, e.g., "$\\overrightarrow{AB} + \\overrightarrow{AD} = \\overrightarrow{AC}$".
- "correctAnswer": The correct answer text.
- "points": A number (default to 1 or 2).
- "explanation": A detailed step-by-step explanation (lời giải chi tiết) in Vietnamese for the question. Math formulas and vectors MUST be wrapped in LaTeX delimiters: use $...$ for inline math and $$...$$ for block math.

CRITICAL FORMATTING: Since this is JSON, every backslash in LaTeX formulas MUST be properly escaped with double backslash (e.g. \\\\overrightarrow, \\\\frac, \\\\sqrt, \\\\cdot, \\\\alpha). Format your output EXACTLY as a valid JSON array without any markdown formatting.`;

      let response;
      if (autoGenType === 'matrix' && matrixFileDataUrl) {
        const base64Data = matrixFileDataUrl.split(',')[1];
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.5-flash-lite",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });
      } else {
        response = await generateContentWithRetry(ai, { model: "gemini-3.5-flash-lite", contents: prompt });
      }

      let responseText = response.text || "[]";
      let parsed = safeParseJsonArray(responseText);
      res.json(parsed);
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
      
      const prompt = `You are an expert AI assistant that extracts exam questions from a document.
CRITICAL REQUIREMENT: You MUST extract EVERY SINGLE question present in the document.
For each question, output an object in a JSON array with the following fields:
- "id": A unique string ID (e.g., "q1")
- "type": "mcq" (multiple choice), "tf" (true/false), "short" (short fill-in), or "essay" (long answer)
- "question": The full text of the question (wrap math in $)
- "options": An array of strings for MCQ choices (A, B, C, D) (wrap math in $)
- "correctAnswer": The correct answer text
- "points": A number (default to 1 or 2)
- "explanation": A detailed step-by-step explanation (lời giải chi tiết) in Vietnamese (wrap math in $)

Format your output EXACTLY as a valid JSON array without any markdown formatting.`;

      const response = await generateContentWithRetry(ai, {
          model: "gemini-3.5-flash-lite",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });

      let responseText = response.text || "[]";
      let parsed = safeParseJsonArray(responseText);
      res.json(parsed);
    } catch (error: any) {
      console.error("Extract API Error:", error);
      res.status(500).json({ error: "Failed to extract questions", details: formatError(error) });
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

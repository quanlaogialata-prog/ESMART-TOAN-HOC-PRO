import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// The issue is inside extract-questions.
// Wait, in my regex `content = content.replace(oldSplitRegex, '');`, it looks like it destroyed `extract-questions`!

const fixedServerContent = `
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

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
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = \`You are an expert tutor. The attached document contains BOTH a test (questions) AND its answers/explanations.
I need you to perfectly separate them into two distinct HTML documents.
CRITICAL REQUIREMENT: Do NOT output JSON. Output your response using EXACTLY the following structure with these custom tags:

[CLEAN_TEST]
(Put beautifully formatted HTML here containing ONLY the questions. Remove all traces of correct answers, rubrics, or explanations. Preserve math using $...$ and $$...$$)
[/CLEAN_TEST]

[ANSWERS]
(Put beautifully formatted HTML here containing ONLY the answers, rubrics, and explanations.)
[/ANSWERS]\`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-pro", // use pro for better reasoning and parsing
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "application/pdf",
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          }
        ]
      });

      let responseText = response.text || "";
      
      let cleanTestHtml = "";
      let answersHtml = "";
      
      const testMatch = responseText.match(/\\[CLEAN_TEST\\]([\\s\\S]*?)\\[\\/CLEAN_TEST\\]/);
      if (testMatch) cleanTestHtml = testMatch[1].trim();
      
      const answersMatch = responseText.match(/\\[ANSWERS\\]([\\s\\S]*?)\\[\\/ANSWERS\\]/);
      if (answersMatch) answersHtml = answersMatch[1].trim();

      if (!cleanTestHtml && !answersHtml) {
          cleanTestHtml = responseText;
      }

      res.json({ cleanTestHtml, answersHtml });
    } catch (error: any) {
      console.error("Error splitting document:", error);
      res.status(500).json({ error: "Failed to split document" });
    }
  });

  app.post("/api/grade-essay", async (req, res) => {
    try {
      const { essayPrompt, submissionText, submissionImageDataUrl, mimeType, maxScore, rubric } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set on the server." });
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      let base64Data = "";
      if (submissionImageDataUrl) base64Data = submissionImageDataUrl.split(',')[1];
      
      const prompt = \`You are a teacher grading a student's answer (which can be text, an image of handwriting, or both) for a question.
Question/Prompt: \${essayPrompt}
Student's text answer: \${submissionText || "None"}
Grading Rubric/References: \${rubric || "No specific rubric, grade based on accuracy and clear reasoning."}
Max Score: \${maxScore}

Please analyze the student's answer (including the image if provided) and provide:
1. A numerical score from 0 to \${maxScore}.
2. Constructive feedback in Vietnamese on what was correct and what needs improvement.

Output exactly a JSON object in this format (no markdown code blocks, just raw JSON):
{
  "score": <number>,
  "feedback": "<string>"
}\`;

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

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ role: "user", parts: parts }]
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      let parsed = {};
      try {
          parsed = JSON.parse(responseText);
      } catch (parseError) {
          parsed = { score: 0, feedback: "AI returned invalid JSON: " + responseText };
      }
      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to grade essay" });
    }
  });

  app.post("/api/generate-test", async (req, res) => {
    try {
      const { title, grade, autoGenType, mcqCount, essayCount, matrixFileDataUrl, mimeType } = req.body;
      const apiKeyHeader = req.headers['x-gemini-api-key'];
      const apiKey = (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader) || process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: "API key is not set." });

      const ai = new GoogleGenAI({ apiKey: apiKey });
      let prompt = \`You are an expert curriculum designer and teacher. Please generate a K-12 exam test for grade \${grade} with the title: "\${title}".\`;
      
      if (autoGenType === 'mcq') {
        prompt += \`\\nPlease generate exactly \${mcqCount} multiple-choice questions (MCQ).\`;
      } else if (autoGenType === 'essay') {
        prompt += \`\\nPlease generate exactly \${essayCount} essay questions.\`;
      } else if (autoGenType === 'mixed') {
        prompt += \`\\nPlease generate exactly \${mcqCount} multiple-choice questions AND \${essayCount} essay questions.\`;
      } else if (autoGenType === 'matrix') {
        prompt += \`\\nPlease generate questions strictly following the provided exam matrix/blueprint document.\`;
      }

      prompt += \`\\nCRITICAL REQUIREMENT:
For each question, output an object in a JSON array with the following fields:
- "id": A unique string ID (e.g., "q1", "q2")
- "type": "mcq" (for multiple choice), "tf" (for true/false), "short" (for short fill-in-the-blank), or "essay" (for long answer)
- "question": The full text of the question. IMPORTANT: Any math formulas MUST be wrapped in LaTeX delimiters: use $...$ for inline math and $$...$$ for block math.
- "options": An array of strings for MCQ choices (A, B, C, D). Only include this field for mcq type. Math formulas here MUST also be wrapped in $...$ or $$...$$.
- "correctAnswer": The correct answer text.
- "points": A number (default to 1 or 2).
- "explanation": A detailed step-by-step explanation (lời giải chi tiết) in Vietnamese for the question. IMPORTANT: Any math formulas MUST be wrapped in LaTeX delimiters: use $...$ for inline math and $$...$$ for block math.

Format your output EXACTLY as a valid JSON array without any markdown formatting.\`;

      let response;
      if (autoGenType === 'matrix' && matrixFileDataUrl) {
        const base64Data = matrixFileDataUrl.split(',')[1];
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });
      } else {
        response = await ai.models.generateContent({ model: "gemini-3.6-flash", contents: prompt });
      }

      let responseText = response.text || "[]";
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      let parsed = [];
      try { parsed = JSON.parse(responseText); } catch(e) {}
      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate test" });
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
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = \`You are an expert AI assistant that extracts exam questions from a document.
CRITICAL REQUIREMENT: You MUST extract EVERY SINGLE question present in the document.
For each question, output an object in a JSON array with the following fields:
- "id": A unique string ID (e.g., "q1")
- "type": "mcq" (multiple choice), "tf" (true/false), "short" (short fill-in), or "essay" (long answer)
- "question": The full text of the question (wrap math in $)
- "options": An array of strings for MCQ choices (A, B, C, D) (wrap math in $)
- "correctAnswer": The correct answer text
- "points": A number (default to 1 or 2)
- "explanation": A detailed step-by-step explanation (lời giải chi tiết) in Vietnamese (wrap math in $)

Format your output EXACTLY as a valid JSON array without any markdown formatting.\`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });
      } catch (e) {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });
      }

      let responseText = response.text || "[]";
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      let parsed = [];
      try { parsed = JSON.parse(responseText); } catch(e) {}
      res.json(parsed);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to extract questions" });
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
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`

fs.writeFileSync('server.ts', fixedServerContent);
console.log("Fixed server.ts");

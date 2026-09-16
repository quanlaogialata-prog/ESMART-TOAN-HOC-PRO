import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/split-document"[\s\S]*?\}\);\n/;

const newEndpoint = `app.post("/api/split-document", express.json({limit: '50mb'}), async (req, res) => {
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

      // fallback parsing if tags are missing
      if (!cleanTestHtml && !answersHtml) {
          cleanTestHtml = responseText;
      }

      res.json({ cleanTestHtml, answersHtml });
    } catch (error: any) {
      console.error("Error splitting document:", error);
      res.status(500).json({ error: "Failed to split document" });
    }
  });\n`;

content = content.replace(regex, newEndpoint);
fs.writeFileSync('server.ts', content);
console.log("Patched server API");

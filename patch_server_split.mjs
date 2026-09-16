import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const splitEndpoint = `
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
CRITICAL REQUIREMENT: Output EXACTLY a valid JSON object with TWO fields: "cleanTestHtml" and "answersHtml".
Both fields should contain beautifully formatted HTML (using inline CSS for styling, matching a typical A4 document).
For the "cleanTestHtml", include ONLY the questions. Remove all traces of correct answers, rubrics, or explanations. Preserve all math formulas using $...$ and $$...$$.
For the "answersHtml", include ONLY the answers, rubrics, and explanations.
Do NOT include markdown formatting like \\\`\\\`\\\`json.\`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
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

      let responseText = response.text || "{}";
      responseText = responseText.replace(/\\r\\n/g, "\\n");
      // Remove any surrounding markdown block
      const jsonMatch = responseText.match(/\\{([\\s\\S]*)\\}/);
      if (jsonMatch) {
         responseText = jsonMatch[0];
      }
      
      let parsed = { cleanTestHtml: "", answersHtml: "" };
      try {
         parsed = JSON.parse(responseText);
      } catch(e) {
         console.error("JSON parse error split-document:", e);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Error splitting document:", error);
      res.status(500).json({ error: "Failed to split document" });
    }
  });
`;

if (!content.includes('/api/split-document')) {
    // Insert before Vite middleware
    content = content.replace('// Vite middleware for development', splitEndpoint + '\n\  // Vite middleware for development');
    fs.writeFileSync('server.ts', content);
    console.log("Added split-document endpoint");
} else {
    console.log("Endpoint already exists");
}

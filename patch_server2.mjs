import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const oldApi = content.substring(content.indexOf('app.post("/api/generate-explanations"'), content.indexOf('// Vite middleware for development'));

const newApi = `app.post("/api/generate-explanations", async (req, res) => {
    try {
      const { questions } = req.body;
      const apiKey = process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not set on the server." });
      }
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Invalid questions provided." });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = "You are an expert tutor. I will provide an array of questions. Provide a step-by-step explanation (lời giải chi tiết) for each question in Vietnamese. Keep the explanations concise but clear. Use LaTeX format $...$ for math.\\nOutput ONLY a JSON array of objects, where each object has \\"id\\" (the question id) and \\"explanation\\" (the string explanation).\\nDo NOT include markdown formatting like \`\`\`json.";
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt + "\\n\\nQuestions:\\n" + JSON.stringify(questions.map(q => ({id: q.id, question: q.question, type: q.type, correctAnswer: q.correctAnswer, options: q.options})), null, 2) }
            ]
          }
        ]
      });
      
      let responseText = response.text || "[]";
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      let parsed = [];
      try {
         parsed = JSON.parse(responseText);
      } catch(e) {
         console.error("JSON parse error:", e);
      }
      
      const resultObj: any = {};
      parsed.forEach((item: any) => {
          if (item && item.id) {
              resultObj[item.id] = item.explanation;
          }
      });
      
      res.json(resultObj);
    } catch (error: any) {
      console.error("Error generating explanations:", error);
      res.status(500).json({ error: "Failed to generate explanations", details: error.message });
    }
  });

  `;

content = content.replace(oldApi, newApi);

fs.writeFileSync('server.ts', content);
console.log('patched server.ts again');

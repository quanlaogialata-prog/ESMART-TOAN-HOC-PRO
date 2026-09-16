import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const oldApi = content.substring(content.indexOf('app.post("/api/grade-essay"'), content.indexOf('app.post("/api/generate-test"'));

const newApi = `app.post("/api/grade-essay", async (req, res) => {
    try {
      console.log("Received grade-essay request");
      const { essayPrompt, submissionText, submissionImageDataUrl, mimeType, maxScore, rubric } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("API key missing");
        return res.status(500).json({ error: "API key is not set on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      let base64Data = "";
      if (submissionImageDataUrl) {
         base64Data = submissionImageDataUrl.split(',')[1];
      }
      
      console.log("Has image:", !!base64Data, "mime:", mimeType);

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

      console.log("Calling Gemini for grade-essay...");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: parts
          }
        ]
      });

      console.log("Gemini response text:", response.text);

      let responseText = response.text || "{}";
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      let parsed = {};
      try {
          parsed = JSON.parse(responseText);
      } catch (parseError) {
          console.error("Failed to parse JSON from Gemini:", responseText);
          parsed = { score: 0, feedback: "AI returned invalid JSON: " + responseText };
      }
      res.json(parsed);
    } catch (error) {
      console.error("Error grading essay:", error);
      res.status(500).json({ error: "Failed to grade essay", details: error.message || String(error) });
    }
  });

  `;

content = content.replace(oldApi, newApi);

fs.writeFileSync('server.ts', content);
console.log('patched grade essay API with debug logs');

import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const target = `  // API Route for Auto-grading Essay
  app.post("/api/grade-essay", async (req, res) => {
    try {
      const { essayPrompt, submissionText, rubric } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not set on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      const prompt = \`You are a teacher grading a K-12 Math essay. 
Question/Prompt: \${essayPrompt}
Student's answer: \${submissionText}
Grading Rubric/References: \${rubric || "No specific rubric, grade based on mathematical accuracy and clear reasoning."}

Please analyze the student's answer and provide:
1. A numerical score from 0 to 10.
2. Constructive feedback on what was correct and what needs improvement.

Output exactly a JSON object in this format (no markdown code blocks, just raw JSON):
{
  "score": <number>,
  "feedback": "<string>"
}\`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });

      let responseText = response.text || "{}";
      // Clean up markdown if any
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(responseText);

      res.json(parsed);
    } catch (error) {
      console.error("Error grading essay:", error);
      res.status(500).json({ error: "Failed to grade essay" });
    }
  });`;

const replacement = `  // API Route for Auto-grading Essay
  app.post("/api/grade-essay", async (req, res) => {
    try {
      const { essayPrompt, submissionText, submissionImageDataUrl, mimeType, maxScore, rubric } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY_CUSTOM || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not set on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const currentMax = maxScore || 10;

      const prompt = \`You are a teacher grading a student's essay/submission.
Question/Prompt: \${essayPrompt || 'General submission'}
Student's text answer (if any): \${submissionText || 'None'}
Grading Rubric: \${rubric || 'Grade based on accuracy, completeness, and reasoning.'}

Please analyze the student's answer (and the provided image if any) and provide:
1. A numerical score from 0 to \${currentMax} (can use decimals).
2. Constructive feedback in Vietnamese on what was correct and what needs improvement.

Output exactly a JSON object in this format (no markdown code blocks, just raw JSON):
{
  "score": <number>,
  "feedback": "<string>"
}\`;

      let contents = [];
      if (submissionImageDataUrl) {
         const base64Data = submissionImageDataUrl.split(',')[1];
         contents = [
           {
             role: "user",
             parts: [
               { inlineData: { mimeType: mimeType || "image/jpeg", data: base64Data } },
               { text: prompt }
             ]
           }
         ];
      } else {
         contents = prompt;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      
      let parsed = { score: 0, feedback: "Failed to parse response" };
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON parse error:", e);
      }

      res.json(parsed);
    } catch (error) {
      console.error("Error grading essay:", error);
      res.status(500).json({ error: "Failed to grade essay" });
    }
  });`;

if (content.includes('// API Route for Auto-grading Essay')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content);
  console.log('done');
} else {
  console.log('target not found');
}

import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// The AI is failing to extract due to a prompt parsing error, or payload size limits
// Let's modify the extract-questions API to use gemini-1.5-flash as it is more robust, and maybe add better error logging

const oldExtract = `const ai = new GoogleGenAI({ apiKey: apiKey });
      
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
Format your output EXACTLY as a valid JSON array without any markdown formatting.\`;`;

const newExtract = `const ai = new GoogleGenAI({ apiKey: apiKey });
      
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
Format your output EXACTLY as a valid JSON array without any markdown formatting.\`;`;


// Oh wait, gemini-3.6-flash doesn't exist, it should be gemini-2.5-flash or gemini-2.0-flash.
content = content.replace(/gemini-3\.6-flash/g, "gemini-2.5-flash");

fs.writeFileSync('server.ts', content);
console.log("Patched server API model to gemini-2.5-flash");

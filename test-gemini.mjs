import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
     const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: "Hello"
     });
     console.log("Response:", response.text);
  } catch(e) {
     console.error("Error:", e);
  }
}
run();

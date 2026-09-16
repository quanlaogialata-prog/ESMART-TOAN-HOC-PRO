import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "hello",
    });
    console.log(interaction.output_text);
  } catch (e) {
    console.error(e);
  }
}
run();

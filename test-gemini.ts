import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function start() {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: ["What is the population of New York?"],
    config: { tools: [{ googleSearch: {} }] }
  });
  console.log(JSON.stringify(result.candidates?.[0]?.groundingMetadata, null, 2));
}
start();

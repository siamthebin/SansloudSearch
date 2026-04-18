import { GoogleGenAI } from "@google/genai";

async function analyze() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await fetch("https://i.postimg.cc/wvWCZFWX/IMG-1050.jpg");
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType: "image/jpeg"
          }
        },
        "Describe the UI in this image in extreme detail. What is the exact background color (hex if possible, or very specific description)? What does the search bar look like? What are the icons? What is the text? What are the exact colors of the buttons, text, and accents? Describe the layout."
      ]
    });
    console.log(result.text);
  } catch (e) {
    console.error(e);
  }
}
analyze();

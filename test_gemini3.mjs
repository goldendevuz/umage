import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-001"];

for (const model of models) {
  try {
    console.log(`\nTesting ${model} with IMAGE modality...`);
    const resp = await client.models.generateContent({
      model,
      contents: "What is 2+2?",
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });
    console.log("  Response:", resp.text?.()?.slice(0, 80));
    const parts = resp.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some(p => p.inlineData?.mimeType?.startsWith("image/"));
    console.log("  Has image:", hasImage);
  } catch (e) {
    console.log("  Error:", e.message?.slice(0, 200));
  }
}

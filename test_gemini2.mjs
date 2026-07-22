import { GoogleGenAI } from "@google/genai";

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
    console.log("  Success:", resp.text?.()?.slice(0, 50));
  } catch (e) {
    console.log("  Error:", e.message?.slice(0, 120));
  }
}

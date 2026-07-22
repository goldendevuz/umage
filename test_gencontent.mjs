import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  "gemini-2.5-flash-image",
  "nano-banana-pro-preview",
  "gemini-3-pro-image",
  "gemini-3.1-flash-image",
];

async function testWithContent(model) {
  try {
    console.log(`\nTesting ${model} with generateContent + IMAGE modality...`);
    const resp = await client.models.generateContent({
      model,
      contents: [
        { role: "user", parts: [{ text: "Generate an image of a cute cat on a windowsill" }] },
      ],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });
    const parts = resp.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some(p => p.inlineData?.mimeType?.startsWith("image/"));
    const text = parts.map(p => p.text).filter(Boolean).join("");
    console.log("  Text:", text?.slice(0, 80));
    console.log("  Has image:", hasImage);
    if (hasImage) {
      const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));
      console.log("  Image size:", imgPart.inlineData.data.length, "bytes");
    }
  } catch (e) {
    console.log("  Error:", e.message?.slice(0, 200));
  }
}

for (const model of models) {
  await testWithContent(model);
}

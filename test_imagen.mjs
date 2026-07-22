import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  "imagen-4.0-generate-001",
  "imagen-4.0-fast-generate-001",
  "nano-banana-pro-preview",
  "gemini-2.5-flash-image",
];

for (const model of models) {
  try {
    console.log(`\nTesting ${model}...`);
    const resp = await client.models.generateImages({
      model,
      prompt: "A cute cat sitting on a windowsill",
      config: { numberOfImages: 1, aspectRatio: "1:1" },
    });
    const hasImage = !!(resp.generatedImages?.[0]?.image?.imageBytes);
    console.log("  Result:", hasImage ? "SUCCESS - image generated" : "No image returned");
    if (hasImage) {
      const len = resp.generatedImages[0].image.imageBytes.length;
      console.log("  Image size:", len, "bytes");
    }
  } catch (e) {
    console.log("  Error:", e.message?.slice(0, 200));
  }
}

import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

// Test 1: generateImages (text-to-image)
try {
  console.log("Testing generateImages...");
  const response = await client.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt: "A cute cat sitting on a windowsill, digital art style",
    config: { numberOfImages: 1, aspectRatio: "1:1" },
  });

  const hasImage = !!(response.generatedImages?.[0]?.image?.imageBytes);
  console.log("generateImages result:", hasImage);
} catch (e) {
  console.error("generateImages failed:", e.message);
}

// Test 2: Check available models
try {
  console.log("\nTesting list models...");
  const models = await client.models.list({});
  const imageModels = [];
  for await (const m of models) {
    if (m.name?.toLowerCase().includes("imagen") || m.name?.toLowerCase().includes("gemini")) {
      imageModels.push(m.name);
    }
  }
  console.log("Available models:", imageModels.slice(0, 10));
} catch (e) {
  console.error("list models failed:", e.message);
}

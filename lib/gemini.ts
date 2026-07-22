import { GoogleGenAI } from "@google/genai";

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? null;

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    _client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return _client;
}

const MODEL_MAP: Record<string, string> = {
  "nano-banana-pro-preview": "nano-banana-pro-preview",
  "gemini-2.5-flash-image": "gemini-2.5-flash-image",
};

const DEFAULT_MODEL = "gemini-2.5-flash-image";

export async function generateGeminiImage(params: {
  model: string;
  prompt: string;
  imageBuffer?: Buffer;
  mimeType?: string;
}): Promise<{ imageBase64: string; mimeType: string }> {
  const { model, prompt, imageBuffer, mimeType } = params;
  const client = getClient();

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (imageBuffer && mimeType) {
    parts.push({
      inlineData: {
        mimeType,
        data: imageBuffer.toString("base64"),
      },
    });
  }

  const response = await (client.models as any).generateContent({
    model: MODEL_MAP[model] ?? DEFAULT_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const candidates: Array<Record<string, unknown>> = response.candidates ?? [];
  const candidate = candidates[0] as Record<string, unknown> | undefined;
  const content = candidate?.content as Record<string, unknown> | undefined;
  const responseParts: Array<Record<string, unknown>> = (content?.parts as Array<Record<string, unknown>>) ?? [];

  const imagePart = responseParts.find(
    (p) =>
      ((p.inlineData as Record<string, string> | undefined)?.mimeType ?? "").startsWith("image/"),
  );

  const inlineData = imagePart?.inlineData as Record<string, string> | undefined;
  if (!inlineData?.data) {
    const finishReason = String(candidate?.finishReason ?? "unknown");
    const err = new Error(`Gemini did not return an image. finishReason: ${finishReason}`);
    (err as any).finishReason = finishReason;
    throw err;
  }

  return {
    imageBase64: inlineData.data,
    mimeType: inlineData.mimeType ?? "image/png",
  };
}

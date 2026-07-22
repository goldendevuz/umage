import { GoogleGenAI, RawReferenceImage } from "@google/genai";

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

export async function generateGeminiImage(params: {
  model: string;
  prompt: string;
  imageBuffer?: Buffer;
  mimeType?: string;
}): Promise<{ imageBase64: string; mimeType: string }> {
  const { prompt, imageBuffer, mimeType } = params;
  const client = getClient();

  if (imageBuffer && mimeType) {
    const ref = new RawReferenceImage();
    ref.referenceImage = {
      imageBytes: imageBuffer.toString("base64"),
      mimeType,
    };

    const response = await client.models.editImage({
      model: "imagen-3.0-capability-001",
      prompt,
      referenceImages: [ref],
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
      },
    });

    const image = response.generatedImages?.[0]?.image;
    if (!image?.imageBytes) {
      const err = new Error("Gemini did not return an image");
      (err as any).finishReason = "NO_IMAGE";
      throw err;
    }

    return {
      imageBase64: image.imageBytes,
      mimeType: image.mimeType ?? "image/png",
    };
  }

  const response = await client.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "1:1",
    },
  });

  const image = response.generatedImages?.[0]?.image;
  if (!image?.imageBytes) {
    const err = new Error("Gemini did not return an image");
    (err as any).finishReason = "NO_IMAGE";
    throw err;
  }

  return {
    imageBase64: image.imageBytes,
    mimeType: image.mimeType ?? "image/png",
  };
}

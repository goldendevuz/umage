export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? null;

export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return GEMINI_API_KEY;
}

export async function generateGeminiImage(params: {
  model: string;
  prompt: string;
  imageBuffer?: Buffer;
  mimeType?: string;
}): Promise<{ imageBase64: string; mimeType: string }> {
  const { model, prompt, imageBuffer, mimeType } = params;
  const apiKey = getApiKey();

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (imageBuffer && mimeType) {
    parts.push({
      inlineData: {
        mimeType,
        data: imageBuffer.toString("base64"),
      },
    });
  }

  const body = {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  } catch (networkError) {
    const err = new Error(`Gemini network error: ${(networkError as Error).message}`);
    (err as any).statusCode = 0;
    (err as any).responseBody = JSON.stringify({
      networkError: (networkError as Error).message,
    });
    throw err;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    const err = new Error(`Gemini API error: ${response.status}`);
    (err as any).statusCode = response.status;
    (err as any).responseBody = errorBody;
    throw err;
  }

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch (parseError) {
    const err = new Error(`Gemini API invalid response: ${(parseError as Error).message}`);
    (err as any).statusCode = response.status;
    (err as any).responseBody = await response.text().catch(() => "could not read body");
    throw err;
  }

  const candidates = data.candidates as
    | Array<{
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: { mimeType: string; data: string };
          }>;
        };
        finishReason?: string;
      }>
    | undefined;

  const candidate = candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith("image/"),
  );

  if (!imagePart?.inlineData) {
    const finishReason = candidate?.finishReason ?? "unknown";
    const err = new Error(
      `Gemini did not return an image. finishReason: ${finishReason}`,
    );
    (err as any).finishReason = finishReason;
    throw err;
  }

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

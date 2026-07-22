export const geminiImageModels = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
] as const;

export type GeminiImageModel = (typeof geminiImageModels)[number];

export const geminiImageModelLabels: Record<GeminiImageModel, string> = {
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
};

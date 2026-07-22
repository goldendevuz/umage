export const geminiImageModels = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
] as const;

export type GeminiImageModel = (typeof geminiImageModels)[number];

export const geminiImageModelLabels: Record<GeminiImageModel, string> = {
  "gemini-2.0-flash-exp": "Gemini 2.0 Flash (Image Gen)",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
};

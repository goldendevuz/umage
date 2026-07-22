export const geminiImageModels = [
  "gemini-2.5-flash-image",
  "nano-banana-pro-preview",
] as const;

export type GeminiImageModel = (typeof geminiImageModels)[number];

export const geminiImageModelLabels: Record<GeminiImageModel, string> = {
  "gemini-2.5-flash-image": "Gemini 2.5 Flash Image",
  "nano-banana-pro-preview": "Nano Banana Pro (Preview)",
};

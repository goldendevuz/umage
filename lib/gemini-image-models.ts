export const geminiImageModels = [
  "imagen-3.0-generate-002",
  "imagen-3.0-capability-001",
] as const;

export type GeminiImageModel = (typeof geminiImageModels)[number];

export const geminiImageModelLabels: Record<GeminiImageModel, string> = {
  "imagen-3.0-generate-002": "Imagen 3.0 Generate",
  "imagen-3.0-capability-001": "Imagen 3.0 Capability",
};

import { countGenerationsSince, createGeneration, GEMINI_DAILY_LIMIT, getGeminiDailyUsageCount, incrementGeminiDailyUsage, utcMonthStart } from "@/db/generations";
import { getMonthlyGenerationLimit } from "@/lib/generation-quota";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import * as Sentry from "@sentry/nextjs";
import { generateGeminiImage, GEMINI_API_KEY } from "@/lib/gemini";
import { ACCEPTED_SOURCE_IMAGE_MIME_TYPES } from "@/lib/constants";
import { getStylePreset } from "@/lib/style-presets";

import { uploadBufferToImageKit } from "@/lib/imagekit";

export const runtime = "nodejs";

type GenerateImageRequest = {
  sourceImageUrl?: string;
  sourceMimeType?: string;
  originalFileName?: string;
  styleSlug?: string;
  model?: string;
};

export async function POST(request: Request) {
  const { userId, has } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthlyLimit = getMonthlyGenerationLimit(has);
  const usedThisMonth = await countGenerationsSince(userId, utcMonthStart());

  if (usedThisMonth >= monthlyLimit) {
    Sentry.logger.warn("generation.quota_exceeded", {
      limit: monthlyLimit,
      used: usedThisMonth,
    });

    return NextResponse.json(
      {
        error: `Monthly generation limit reached (${monthlyLimit} images). Upgrade your plan or try again next month.`,
        code: "QUOTA_EXCEEDED" as const,
        limit: monthlyLimit,
        used: usedThisMonth,
      },
      { status: 429 },
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY." }, { status: 500 });
  }

  const body = (await request.json()) as GenerateImageRequest;

  const { model, originalFileName, sourceImageUrl, sourceMimeType, styleSlug } = body;

  if (!sourceImageUrl) {
    return NextResponse.json({ error: "Please upload an image first." }, { status: 400 });
  }

  if (typeof sourceMimeType !== "string" || !ACCEPTED_SOURCE_IMAGE_MIME_TYPES.has(sourceMimeType)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP files are supported." },
      { status: 400 },
    );
  }

  if (typeof styleSlug !== "string") {
    return NextResponse.json({ error: "Please choose a style." }, { status: 400 });
  }

  if (!model) {
    return NextResponse.json({ error: "Please choose a model." }, { status: 400 });
  }

  const preset = getStylePreset(styleSlug);
  if (!preset) {
    return NextResponse.json({ error: "Unknown style preset." }, { status: 400 });
  }

  const dailyUsed = await getGeminiDailyUsageCount();
  if (dailyUsed >= GEMINI_DAILY_LIMIT) {
    Sentry.logger.warn("gemini.daily_limit_reached", {
      limit: GEMINI_DAILY_LIMIT,
      used: dailyUsed,
    });

    return NextResponse.json(
      {
        error: `You've reached the daily free-tier limit of ${GEMINI_DAILY_LIMIT} images. Please purchase a subscription to continue generating images.`,
        code: "DAILY_LIMIT_REACHED" as const,
        limit: GEMINI_DAILY_LIMIT,
        used: dailyUsed,
      },
      { status: 429 },
    );
  }

  const imageResponse = await fetch(sourceImageUrl);
  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: "Could not fetch the uploaded source image." },
      { status: 404 },
    );
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const prompt = [
    preset.prompt,
    "Do not add extra people, extra limbs, duplicate subjects, or change the overall camera angle.",
  ].join("\n\n");

  interface AppError {
    message: string;
    statusCode?: number;
    responseBody?: string;
    finishReason?: string;
  }

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await Sentry.startSpan(
        {
          name: `image edit ${model}`,
          op: "gen_ai.request",
          attributes: {
            "gen_ai.request.model": model,
            "gen_ai.operation.name": "request",
            "gen_ai.request.messages": JSON.stringify([
              { role: "user", content: prompt },
              { role: "user", content: "[source image attachment omitted]" },
            ]),
          },
        },
        () =>
          generateGeminiImage({
            model,
            prompt,
            imageBuffer,
            mimeType: sourceMimeType,
          }),
      );

      const { imageBase64, mimeType } = result;

      const resultBuffer = Buffer.from(imageBase64, "base64");

      const { url: resultImageUrl } = await uploadBufferToImageKit({
        buffer: resultBuffer,
        fileName: `${preset.slug}-result.png`,
        folder: `/users/${userId}/results`,
        mimeType: "image/png",
      });

      const savedGeneration = await createGeneration({
        clerkUserId: userId,
        originalFileName: typeof originalFileName === "string" ? originalFileName : null,
        sourceImageUrl,
        resultImageUrl,
        styleSlug: preset.slug,
        styleLabel: preset.label,
        model,
        promptUsed: prompt,
      });

      await incrementGeminiDailyUsage();

      Sentry.logger.info("generation.completed", {
        generationId: savedGeneration.id,
        styleSlug: preset.slug,
        model,
      });

      return NextResponse.json({
        imageBase64,
        mimeType,
        promptUsed: prompt,
        style: { slug: preset.slug, label: preset.label },
        model,
        savedGeneration,
      });
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const statusCode = typeof err.statusCode === "number" ? err.statusCode : 0;
      const finishReason = typeof err.finishReason === "string" ? err.finishReason : "";
      const responseBody = typeof err.responseBody === "string" ? err.responseBody : "";
      const errorMessage = typeof err.message === "string" ? err.message : String(error);

      lastError = {
        message: errorMessage,
        statusCode,
        responseBody,
        finishReason,
      };

      console.error(`Gemini error (attempt ${attempt + 1}/2):`, {
        message: errorMessage,
        statusCode,
        finishReason,
        responseBody: responseBody.slice(0, 500),
      });

      if (statusCode === 429) {
        Sentry.logger.warn("gemini.quota_exceeded", lastError as unknown as Record<string, unknown>);

        return NextResponse.json(
          {
            error:
              "You've reached the daily free-tier limit. Please purchase a subscription to continue generating images.",
            code: "DAILY_LIMIT_REACHED" as const,
          },
          { status: 429 },
        );
      }

      if (finishReason === "SAFETY" || finishReason === "BLOCKLIST" || finishReason === "PROHIBITED_CONTENT") {
        return NextResponse.json(
          { error: "Your request was blocked by content safety filters. Please try a different prompt or image." },
          { status: 400 },
        );
      }

      if (attempt === 0) {
        continue;
      }

      Sentry.logger.error("generation.gemini_error", lastError as unknown as Record<string, unknown>);

      return NextResponse.json(
        {
          error: "An error occurred, please try again",
          details: {
            message: errorMessage,
            statusCode,
          },
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      error: "An error occurred, please try again",
      details: lastError
        ? { message: lastError.message, statusCode: lastError.statusCode }
        : { message: "Unknown error after retries" },
    },
    { status: 500 },
  );
}

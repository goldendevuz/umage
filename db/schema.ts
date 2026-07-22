import { pgTable, uuid, text, timestamp, integer, date } from "drizzle-orm/pg-core";

export const generations = pgTable("generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  originalFileName: text("original_file_name"),
  sourceImageUrl: text("source_image_url").notNull(),
  resultImageUrl: text("result_image_url").notNull(),
  styleSlug: text("style_slug").notNull(),
  styleLabel: text("style_label").notNull(),
  model: text("model").notNull(),
  promptUsed: text("prompt_used").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyGeminiUsage = pgTable("daily_gemini_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull().unique(),
  count: integer("count").notNull().default(0),
});

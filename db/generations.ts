import { and, count, desc, eq, gte, sql, type InferInsertModel } from "drizzle-orm";

import { dailyGeminiUsage, generations } from "@/db/schema";
import { db } from "@/db/index";

/** Start of current month (UTC), used for monthly generation quotas. */
export function utcMonthStart() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1, 0, 0, 0, 0));
}

export async function countGenerationsSince(clerkUserId: string, since: Date) {
  const [row] = await db
    .select({ c: count() })
    .from(generations)
    .where(and(eq(generations.clerkUserId, clerkUserId), gte(generations.createdAt, since)));

  return Number(row?.c ?? 0);
}

export async function listUserGenerationSummaries(clerkUserId: string) {
  return db
    .select()
    .from(generations)
    .where(eq(generations.clerkUserId, clerkUserId))
    .orderBy(desc(generations.createdAt));
}

type InsertGenerationInput = Omit<InferInsertModel<typeof generations>, "id" | "createdAt">;

export async function createGeneration(input: InsertGenerationInput) {
  const [row] = await db.insert(generations).values(input).returning();

  return row;
}

/** Today's date string in YYYY-MM-DD format (local timezone). */
function todayDateString(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const GEMINI_DAILY_LIMIT = 500;

export async function getGeminiDailyUsageCount(): Promise<number> {
  const today = todayDateString();
  const [row] = await db
    .select({ c: sql<number>`coalesce(count, 0)` })
    .from(dailyGeminiUsage)
    .where(eq(dailyGeminiUsage.date, today));

  return Number(row?.c ?? 0);
}

export async function incrementGeminiDailyUsage(): Promise<void> {
  const today = todayDateString();

  await db
    .insert(dailyGeminiUsage)
    .values({ date: today, count: 1 })
    .onConflictDoUpdate({
      target: dailyGeminiUsage.date,
      set: { count: sql`${dailyGeminiUsage.count} + 1` },
    });
}

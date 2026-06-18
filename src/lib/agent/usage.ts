import { prisma } from "@/lib/db";

const DAILY_LIMIT = 5;

/**
 * Get today's date string in UTC (YYYY-MM-DD).
 */
function getTodayUtc(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get the current daily usage record for a user.
 */
export async function getDailyUsage(
  userId: string
): Promise<{ used: number; remaining: number; limit: number }> {
  const today = getTodayUtc();

  const record = await prisma.agentUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const used = record?.count ?? 0;
  return {
    used,
    remaining: Math.max(0, DAILY_LIMIT - used),
    limit: DAILY_LIMIT,
  };
}

/**
 * Check if a user is allowed to perform an AI action.
 */
export async function checkDailyLimit(
  userId: string
): Promise<{ allowed: boolean; used: number; remaining: number; limit: number }> {
  const usage = await getDailyUsage(userId);
  return {
    allowed: usage.used < DAILY_LIMIT,
    ...usage,
  };
}

/**
 * Increment the daily usage count for a user by 1.
 * Uses upsert so the first action of the day creates the row.
 */
export async function incrementUsage(userId: string): Promise<void> {
  const today = getTodayUtc();

  await prisma.agentUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });
}

export { DAILY_LIMIT, getTodayUtc };

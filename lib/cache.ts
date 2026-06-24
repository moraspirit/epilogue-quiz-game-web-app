import { getRedis } from "@/lib/redis";

export const CACHE_TTL = {
  LEADERBOARD: 30,
  ACTIVE_LEVELS: 300,
  QUIZ_LEVEL: 300,
  QUIZ_STRUCTURE: 300,
  USER_PROGRESS: 60,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (error) {
    console.error(`Cache read failed for ${key}:`, error);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (error) {
    console.error(`Cache write failed for ${key}:`, error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Cache delete failed for ${key}:`, error);
  }
}

export async function invalidateLeaderboardCache(): Promise<void> {
  await cacheDelete("leaderboard:full");
}

export async function invalidateUserProgressCache(
  userId: number
): Promise<void> {
  await cacheDelete(`user:progress:${userId}`);
}

export async function invalidateQuizLevelCache(uuid: string): Promise<void> {
  await cacheDelete(`quiz:level:${uuid}`);
}

export async function invalidateActiveLevelsCache(): Promise<void> {
  await cacheDelete("levels:active");
}

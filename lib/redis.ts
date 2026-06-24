import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redis: RedisClientType | null;
  redisConnecting: Promise<RedisClientType | null> | null;
};

async function connectRedis(): Promise<RedisClientType | null> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return null;
  }

  if (globalForRedis.redis?.isOpen) {
    return globalForRedis.redis;
  }

  if (globalForRedis.redisConnecting) {
    return globalForRedis.redisConnecting;
  }

  globalForRedis.redisConnecting = (async () => {
    try {
      const client = createClient({ url: redisUrl });
      client.on("error", (error) => {
        console.error("Redis client error:", error);
      });
      await client.connect();
      globalForRedis.redis = client as RedisClientType;
      return globalForRedis.redis;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      return null;
    } finally {
      globalForRedis.redisConnecting = null;
    }
  })();

  return globalForRedis.redisConnecting;
}

export async function getRedis(): Promise<RedisClientType | null> {
  return connectRedis();
}

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}

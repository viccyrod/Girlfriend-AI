import { Redis } from '@upstash/redis'

// Create a singleton Redis client with optimized configuration
const redisClientSingleton = () => {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    automaticDeserialization: false, // Disable automatic JSON parsing
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.min(Math.exp(retryCount) * 50, 1000)
    }
  });
}

type RedisClientSingleton = ReturnType<typeof redisClientSingleton>

const globalForRedis = globalThis as unknown as {
  redis: RedisClientSingleton | undefined
}

export const redis = globalForRedis.redis ?? redisClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis 
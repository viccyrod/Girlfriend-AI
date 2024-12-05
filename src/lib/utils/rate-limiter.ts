import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "@/lib/clients/redis"

// Create a new ratelimiter that allows 10 requests per 10 seconds
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await rateLimiter.limit(identifier)
  
  return {
    success,
    limit,
    reset,
    remaining,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString()
    }
  }
}

export class RateLimiter {
  private static instance: RateLimiter;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT = 50; // requests per hour
  private readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor() {
    if (RateLimiter.instance) {
      return RateLimiter.instance;
    }
    RateLimiter.instance = this;
  }

  public async checkLimit(userId: string): Promise<{ success: boolean; remainingTime?: number }> {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);

    if (!userRequests) {
      // First request for this user
      this.requestCounts.set(userId, { count: 1, resetTime: now + this.WINDOW_MS });
      return { success: true };
    }

    if (now >= userRequests.resetTime) {
      // Reset window
      this.requestCounts.set(userId, { count: 1, resetTime: now + this.WINDOW_MS });
      return { success: true };
    }

    if (userRequests.count >= this.RATE_LIMIT) {
      // Rate limit exceeded
      const remainingTime = userRequests.resetTime - now;
      return { success: false, remainingTime };
    }

    // Increment counter
    userRequests.count++;
    this.requestCounts.set(userId, userRequests);
    return { success: true };
  }

  public getRemainingRequests(userId: string): number {
    const userRequests = this.requestCounts.get(userId);
    if (!userRequests) return this.RATE_LIMIT;
    if (Date.now() >= userRequests.resetTime) return this.RATE_LIMIT;
    return Math.max(0, this.RATE_LIMIT - userRequests.count);
  }

  public getTimeUntilReset(userId: string): number {
    const userRequests = this.requestCounts.get(userId);
    if (!userRequests) return 0;
    const remaining = userRequests.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}
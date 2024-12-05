interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      time => now - time < this.config.timeWindow
    );
    
    if (validTimestamps.length < this.config.maxRequests) {
      validTimestamps.push(now);
      this.requests.set(key, validTimestamps);
      return true;
    }
    
    return false;
  }

  getTimeUntilNextAvailable(key: string): number {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;
    
    const now = Date.now();
    const oldestTimestamp = timestamps[0];
    return Math.max(0, this.config.timeWindow - (now - oldestTimestamp));
  }

  clearRequests(key: string) {
    this.requests.delete(key);
  }
}

// Create instances for different rate limits
export const messageRateLimiter = new RateLimiter({
  maxRequests: 20,  // 20 messages
  timeWindow: 60000 // per minute
});

export const aiRateLimiter = new RateLimiter({
  maxRequests: 50,  // 50 requests
  timeWindow: 3600000 // per hour
});

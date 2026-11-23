import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();
const mem = new Map<string, { n: number; reset: number }>();

// true = allowed. Uses Upstash when configured, otherwise a per-instance in-memory fallback.
export async function limit(key: string, max = 30, windowSec = 60): Promise<boolean> {
  if (redis) {
    const k = `${max}:${windowSec}`;
    let rl = limiters.get(k);
    if (!rl) {
      rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, `${windowSec} s`), prefix: 'edusite' });
      limiters.set(k, rl);
    }
    return (await rl.limit(key)).success;
  }
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.reset < now) {
    mem.set(key, { n: 1, reset: now + windowSec * 1000 });
    return true;
  }
  e.n += 1;
  return e.n <= max;
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  existing.count += 1;
  return existing.count > limit;
}

export function getClientKey(req: Request, routeName: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${routeName}:${ip}`;
}
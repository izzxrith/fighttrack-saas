import { describe, it, expect, vi, afterEach } from "vitest";
import { isRateLimited } from "@/lib/rateLimit";

afterEach(() => {
  vi.useRealTimers();
});

describe("isRateLimited", () => {
  it("blocks once the limit is passed", () => {
    const key = "test:block";
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
    expect(isRateLimited(key, 3, 60_000)).toBe(true);
  });

  it("tracks each key separately", () => {
    for (let i = 0; i < 5; i++) isRateLimited("test:one", 3, 60_000);
    expect(isRateLimited("test:two", 3, 60_000)).toBe(false);
  });

  it("lets requests through again after the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-12T12:00:00Z"));
    const key = "test:reset";
    for (let i = 0; i < 4; i++) isRateLimited(key, 3, 60_000);
    expect(isRateLimited(key, 3, 60_000)).toBe(true);

    vi.advanceTimersByTime(61_000);
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
  });
});
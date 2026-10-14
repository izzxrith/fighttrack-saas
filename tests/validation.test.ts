import { describe, it, expect } from "vitest";
import {
  signupSchema,
  createFighterSchema,
  createSessionSchema,
  createFightRecordSchema,
} from "@/lib/validation";

const validCuid = "clh3am9xk0000qzrmn831i7rn";

describe("signupSchema", () => {
  const valid = {
    gymName: "Iron Corner",
    email: "coach@ironcorner.gym",
    password: "correcthorsebattery",
  };

  it("accepts valid input", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password under 10 characters", () => {
    const result = signupSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password needs at least 10 characters.");
    }
  });

  it("caps passwords by bytes, not characters, because bcrypt reads 72 bytes", () => {
    // 40 characters, but 80 bytes
    const result = signupSchema.safeParse({ ...valid, password: "é".repeat(40) });
    expect(result.success).toBe(false);
  });
});

describe("createFighterSchema", () => {
  const base = { email: "fighter@test.com", password: "correcthorsebattery" };

  it("accepts the three stances and trims the weight class", () => {
    const result = createFighterSchema.safeParse({
      ...base,
      stance: "Southpaw",
      weightClass: " Welterweight ",
    });
    expect(result.success && result.data.weightClass).toBe("Welterweight");
  });

  it("rejects an unknown stance", () => {
    expect(createFighterSchema.safeParse({ ...base, stance: "Lefty" }).success).toBe(false);
  });
});

describe("createSessionSchema", () => {
  const valid = {
    fighterId: validCuid,
    type: "SPARRING",
    durationMin: 60,
    date: "2026-10-12T12:00:00.000Z",
  };

  it("accepts a valid session", () => {
    expect(createSessionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects impossible durations", () => {
    expect(createSessionSchema.safeParse({ ...valid, durationMin: 0 }).success).toBe(false);
    expect(createSessionSchema.safeParse({ ...valid, durationMin: 601 }).success).toBe(false);
    expect(createSessionSchema.safeParse({ ...valid, durationMin: 30.5 }).success).toBe(false);
  });

  it("rejects an unknown session type", () => {
    expect(createSessionSchema.safeParse({ ...valid, type: "KICKBOXING" }).success).toBe(false);
  });
});

describe("createFightRecordSchema", () => {
  const valid = {
    fighterId: validCuid,
    opponent: "Karim",
    result: "WIN",
    date: "2026-10-12T12:00:00.000Z",
  };

  it("accepts a valid fight", () => {
    expect(createFightRecordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown result and angle brackets in the opponent", () => {
    expect(createFightRecordSchema.safeParse({ ...valid, result: "KO" }).success).toBe(false);
    expect(createFightRecordSchema.safeParse({ ...valid, opponent: "<script>" }).success).toBe(
      false
    );
  });
});
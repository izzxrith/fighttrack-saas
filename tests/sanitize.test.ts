import { describe, it, expect } from "vitest";
import { cleanLine, cleanNote, nameField, emailField } from "@/lib/sanitize";

describe("cleanLine", () => {
  it("strips zero-width characters and collapses whitespace", () => {
    expect(cleanLine("  Iron\u200B Corner\n\nBoxing  ")).toBe("Iron Corner Boxing");
  });

  it("strips bidi override characters used to spoof text", () => {
    expect(cleanLine("\u202Eevil")).toBe("evil");
  });

  it("normalizes look-alike characters", () => {
    expect(cleanLine("ＦＩＧＨＴ")).toBe("FIGHT");
  });
});

describe("cleanNote", () => {
  it("keeps line breaks, drops control characters, and limits blank lines", () => {
    expect(cleanNote("line1\r\nline2\u0000\n\n\n\nline3")).toBe("line1\nline2\n\nline3");
  });
});

describe("nameField", () => {
  const gym = nameField("Gym name", 2, 80);

  it("accepts a normal name with an apostrophe", () => {
    expect(gym.safeParse("O'Brien Boxing Club").success).toBe(true);
  });

  it("rejects angle brackets", () => {
    expect(gym.safeParse("<b>Gym</b>").success).toBe(false);
  });

  it("rejects too short, too long, empty, and whitespace-only values", () => {
    expect(gym.safeParse("A").success).toBe(false);
    expect(gym.safeParse("x".repeat(81)).success).toBe(false);
    expect(gym.safeParse("").success).toBe(false);
    expect(gym.safeParse("   ").success).toBe(false);
  });

  it("rejects a missing value", () => {
    expect(gym.safeParse(undefined).success).toBe(false);
  });
});

describe("emailField", () => {
  it("trims and lowercases", () => {
    const result = emailField.safeParse("  Coach@IronCorner.GYM ");
    expect(result.success && result.data).toBe("coach@ironcorner.gym");
  });

  it("rejects something that isn't an email", () => {
    expect(emailField.safeParse("not-an-email").success).toBe(false);
  });
});
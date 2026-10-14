import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { hashPassword, verifyPassword, signSession, verifySession } from "@/lib/auth";

const payload = { userId: "u1", gymId: "gym-a", role: "COACH" as const };
const secret = process.env.JWT_SECRET as string;

describe("password hashing", () => {
  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correcthorsebattery");
    expect(await verifyPassword("correcthorsebattery", hash)).toBe(true);
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("salts every hash, so the same password never hashes the same twice", async () => {
    const a = await hashPassword("correcthorsebattery");
    const b = await hashPassword("correcthorsebattery");
    expect(a).not.toBe(b);
  });
});

describe("session tokens", () => {
  it("round-trips the payload", () => {
    const result = verifySession(signSession(payload));
    expect(result).toMatchObject(payload);
  });

  it("rejects a token whose payload was edited to another gym", () => {
    const [header, , signature] = signSession(payload).split(".");
    const forged = Buffer.from(JSON.stringify({ ...payload, gymId: "gym-b" })).toString(
      "base64url"
    );
    expect(verifySession(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign(payload, "some-other-secret");
    expect(verifySession(token)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 10 }, secret);
    expect(verifySession(token)).toBeNull();
  });

  it("rejects an unsigned token that claims alg none", () => {
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const token = `${enc({ alg: "none", typ: "JWT" })}.${enc(payload)}.`;
    expect(verifySession(token)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifySession("not-a-token")).toBeNull();
    expect(verifySession("")).toBeNull();
  });
});
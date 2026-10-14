import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    fighter: { findFirst: vi.fn(), delete: vi.fn() },
    user: { delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db";
import { signSession } from "@/lib/auth";
import { GET, DELETE } from "@/app/api/fighters/[id]/route";

const findFirst = prisma.fighter.findFirst as unknown as Mock;
const transaction = prisma.$transaction as unknown as Mock;

const ctx = { params: Promise.resolve({ id: "fighter-in-gym-b" }) };

function requestAs(
  session: { userId: string; gymId: string; role: "COACH" | "FIGHTER" },
  method = "GET"
) {
  return new NextRequest("http://localhost:3000/api/fighters/fighter-in-gym-b", {
    method,
    headers: { cookie: `ft_session=${signSession(session)}` },
  });
}

const coachA = { userId: "coach-a", gymId: "gym-a", role: "COACH" as const };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/fighters/[id]", () => {
  it("only ever searches inside the caller's own gym", async () => {
    findFirst.mockResolvedValue(null);
    await GET(requestAs(coachA), ctx);

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "fighter-in-gym-b",
      gymId: "gym-a",
    });
  });

  it("answers 404, not 403, when the fighter belongs to another gym", async () => {
    findFirst.mockResolvedValue(null);
    const res = await GET(requestAs(coachA), ctx);

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Fighter not found.");
  });

  it("returns 401 with no session cookie and never queries the database", async () => {
    const res = await GET(new NextRequest("http://localhost:3000/api/fighters/x"), ctx);
    expect(res.status).toBe(401);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns 401 for a garbage cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/fighters/x", {
      headers: { cookie: "ft_session=garbage" },
    });
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("lets a coach view a fighter in their own gym", async () => {
    findFirst.mockResolvedValue({
      id: "fighter-in-gym-b",
      userId: "fighter-user",
      gymId: "gym-a",
      user: { email: "f@test.com" },
      sessions: [],
      fightRecords: [],
      trainingPlans: [],
    });
    const res = await GET(requestAs(coachA), ctx);

    expect(res.status).toBe(200);
    expect((await res.json()).viewerRole).toBe("COACH");
  });

  it("stops a fighter account from viewing a teammate", async () => {
    findFirst.mockResolvedValue({
      id: "fighter-in-gym-b",
      userId: "someone-else",
      gymId: "gym-a",
      user: { email: "teammate@test.com" },
      sessions: [],
      fightRecords: [],
      trainingPlans: [],
    });
    const fighterMe = { userId: "me", gymId: "gym-a", role: "FIGHTER" as const };
    const res = await GET(requestAs(fighterMe), ctx);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/fighters/[id]", () => {
  it("rejects a fighter account with 403 before touching the database", async () => {
    const fighterMe = { userId: "me", gymId: "gym-a", role: "FIGHTER" as const };
    const res = await DELETE(requestAs(fighterMe, "DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(findFirst).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes nothing when the fighter is in another gym", async () => {
    findFirst.mockResolvedValue(null);
    const res = await DELETE(requestAs(coachA, "DELETE"), ctx);

    expect(res.status).toBe(404);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "fighter-in-gym-b",
      gymId: "gym-a",
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});
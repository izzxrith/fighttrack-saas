import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createFightRecordSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createFightRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { fighterId, opponent, result, date, weightClass, notes } = parsed.data;

  // Only look inside the caller's own gym. Another gym's fighter returns 404.
  const fighter = await prisma.fighter.findFirst({
    where: { id: fighterId, gymId: session.gymId },
  });
  if (!fighter) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  // A fighter account can only add records for themselves.
  if (session.role === Role.FIGHTER && fighter.userId !== session.userId) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  const record = await prisma.fightRecord.create({
    data: {
      fighterId,
      gymId: session.gymId, // from the session, never the request body
      opponent,
      result,
      date: new Date(date),
      weightClass,
      notes,
    },
  });

  return NextResponse.json({ record }, { status: 201 });
}
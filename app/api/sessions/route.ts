import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { fighterId, type, durationMin, notes, date } = parsed.data;

  // Only look inside the caller's own gym. Another gym's fighter returns 404.
  const fighter = await prisma.fighter.findFirst({
    where: { id: fighterId, gymId: session.gymId },
  });
  if (!fighter) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  // A fighter account can only log sessions for themselves.
  if (session.role === Role.FIGHTER && fighter.userId !== session.userId) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  const created = await prisma.trainingSession.create({
    data: {
      fighterId,
      gymId: session.gymId, // from the session, never the request body
      type,
      durationMin,
      notes,
      date: new Date(date),
    },
  });

  return NextResponse.json({ session: created }, { status: 201 });
}
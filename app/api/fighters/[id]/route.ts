import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// View one fighter
export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { id } = await params;

  // The gymId filter is the whole security trick: we only search inside the
  // caller's own gym, so another gym's fighter can never be returned.
  const fighter = await prisma.fighter.findFirst({
    where: { id, gymId: session.gymId },
    include: {
      user: { select: { email: true } },
      sessions: { orderBy: { date: "desc" } },
    },
  });

  if (!fighter) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  // A fighter account can only view themselves. Coaches can view anyone in their gym.
  if (session.role === Role.FIGHTER && fighter.userId !== session.userId) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  return NextResponse.json({ fighter });
}

// Remove one fighter (coach only)
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  if (session.role !== Role.COACH) {
    return NextResponse.json({ error: "Only coaches can remove fighters." }, { status: 403 });
  }

  const { id } = await params;

  const fighter = await prisma.fighter.findFirst({
    where: { id, gymId: session.gymId },
  });
  if (!fighter) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  // Delete the login account too. If we only deleted the fighter row, that
  // person could still sign in afterwards.
  await prisma.$transaction([
    prisma.fighter.delete({ where: { id: fighter.id } }),
    prisma.user.delete({ where: { id: fighter.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
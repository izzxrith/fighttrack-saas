import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { createFighterSchema } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rateLimit";

// gymId comes ONLY from the verified session cookie, never from a query
// param, header, or request body. This is what stops gym A from seeing
// or writing gym B's data.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

    const fighters = await prisma.fighter.findMany({
    where: {
      gymId: session.gymId,
      // Fighter accounts only ever see themselves. Coaches see the whole gym.
      ...(session.role === Role.FIGHTER ? { userId: session.userId } : {}),
    },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ fighters });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  if (session.role !== Role.COACH) {
    return NextResponse.json({ error: "Only coaches can add fighters." }, { status: 403 });
  }
  if (isRateLimited(getClientKey(req, "add-fighter"), 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a minute, then try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createFighterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, password, weightClass, stance } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const fighter = await prisma.fighter.create({
    data: {
      weightClass,
      stance,
      // Relation-style (checked) input all the way through. The gym id still
      // comes from the session, never from the request body.
      gym: { connect: { id: session.gymId } },
      user: {
        create: {
          email,
          passwordHash,
          role: Role.FIGHTER,
          gymId: session.gymId,
        },
      },
    },
    include: { user: { select: { email: true } } },
  });

  return NextResponse.json({ fighter }, { status: 201 });
}
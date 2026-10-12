import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createTrainingPlanSchema } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  if (session.role !== Role.COACH) {
    return NextResponse.json(
      { error: "Only coaches can assign training plans." },
      { status: 403 }
    );
  }
  if (isRateLimited(getClientKey(req, "training-plan"), 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a minute, then try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createTrainingPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { fighterId, title, description } = parsed.data;

  // Only look inside the coach's own gym. Another gym's fighter returns 404.
  const fighter = await prisma.fighter.findFirst({
    where: { id: fighterId, gymId: session.gymId },
  });
  if (!fighter) {
    return NextResponse.json({ error: "Fighter not found." }, { status: 404 });
  }

  const plan = await prisma.trainingPlan.create({
    data: {
      fighterId,
      gymId: session.gymId, // from the session, never the request body
      coachId: session.userId,
      title,
      description,
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
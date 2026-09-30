import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// gymId comes ONLY from the verified session cookie — never from a query
// param, header, or anything else the client could set. This one line is
// what actually prevents gym A from ever seeing gym B's fighters.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const fighters = await prisma.fighter.findMany({
    where: { gymId: session.gymId },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ fighters });
}
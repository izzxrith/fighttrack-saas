import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientKey(req, "signup"), 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute, then try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { gymName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Same-shaped response as a real success case's error path — never confirm
    // an email is already registered.
    return NextResponse.json(
      { error: "We couldn't create that account. If you already have one, sign in instead." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const { user, gym } = await prisma.$transaction(async (tx) => {
    const newGym = await tx.gym.create({ data: { name: gymName } });

    const user = await tx.user.create({
      data: { email, passwordHash, role: "COACH", gymId: newGym.id },
    });

    const gym = await tx.gym.update({
      where: { id: newGym.id },
      data: { ownerId: user.id },
    });

    return { user, gym };
  });

  const token = signSession({ userId: user.id, gymId: gym.id, role: "COACH" });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
    gym: { id: gym.id, name: gym.name },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
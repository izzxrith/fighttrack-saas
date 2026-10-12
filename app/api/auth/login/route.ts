import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  signSession,
  sessionCookieOptions,
  SESSION_COOKIE,
  DUMMY_HASH,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientKey(req, "login"), 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute, then try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That email and password don't match. Check both and try again." },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run exactly one bcrypt comparison, even for an unknown email, so
  // response time can't reveal which emails are registered.
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: "That email and password don't match. Check both and try again." },
      { status: 401 }
    );
  }

  const token = signSession({ userId: user.id, gymId: user.gymId, role: user.role });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
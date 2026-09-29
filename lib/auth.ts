import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to your .env file.");
}

const ACCESS_TOKEN_TTL = "15m";
export const SESSION_COOKIE = "ft_session";

export type SessionPayload = {
  userId: string;
  gymId: string;
  role: "COACH" | "FIGHTER";
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as SessionPayload;
  } catch {
    // Expired or tampered — treat as logged out, never leak why to the client.
    return null;
  }
}

/**
 * The ONLY source of truth for userId/gymId/role in every API route.
 * Never read these from req.body or query params.
 */
export function getSession(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 15, // matches ACCESS_TOKEN_TTL
};
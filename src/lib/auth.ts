import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, authUsers } from "@/db/schema";

export const SESSION_COOKIE = "tikley_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export function digestSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieValue(request: Request): string | null {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      try { return decodeURIComponent(value.join("=")); } catch { return null; }
    }
  }
  return null;
}

export async function getSessionUser(request: Request): Promise<AuthUser | null> {
  const token = cookieValue(request);
  if (!token || token.length > 128) return null;
  const [row] = await db
    .select({ id: authUsers.id, email: authUsers.email, role: authUsers.role })
    .from(authSessions)
    .innerJoin(authUsers, eq(authSessions.userId, authUsers.id))
    .where(and(eq(authSessions.tokenHash, digestSessionToken(token)), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await db.insert(authSessions).values({ userId, tokenHash: digestSessionToken(token), expiresAt });
  return { token, expiresAt };
}

export async function revokeSession(request: Request): Promise<void> {
  const token = cookieValue(request);
  if (!token || token.length > 128) return;
  await db.delete(authSessions).where(eq(authSessions.tokenHash, digestSessionToken(token)));
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

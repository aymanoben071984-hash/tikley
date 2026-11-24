import { createHash } from "node:crypto";
import { inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { authLoginAttempts, authUsers } from "@/db/schema";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function keyHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || password.length < 1 || password.length > 256) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const forwarded = request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const keys = [keyHash(`ip:${forwarded}`), keyHash(`email:${email}`)];
  const now = new Date();
  const windowEndsAt = new Date(now.getTime() + WINDOW_MS);

  // Atomic, database-backed buckets work across serverless instances and restarts.
  const buckets = await db
    .insert(authLoginAttempts)
    .values(keys.map((keyHash) => ({ keyHash, attempts: 1, windowEndsAt, updatedAt: now })))
    .onConflictDoUpdate({
      target: authLoginAttempts.keyHash,
      set: {
        attempts: sql`CASE WHEN ${authLoginAttempts.windowEndsAt} <= ${now} THEN 1 ELSE ${authLoginAttempts.attempts} + 1 END`,
        windowEndsAt: sql`CASE WHEN ${authLoginAttempts.windowEndsAt} <= ${now} THEN ${windowEndsAt} ELSE ${authLoginAttempts.windowEndsAt} END`,
        updatedAt: now,
      },
    })
    .returning({ attempts: authLoginAttempts.attempts, windowEndsAt: authLoginAttempts.windowEndsAt });

  if (buckets.some((bucket) => bucket.attempts > MAX_ATTEMPTS)) {
    const retryAt = Math.max(...buckets.map((bucket) => bucket.windowEndsAt.getTime()));
    return NextResponse.json(
      { error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))) } },
    );
  }

  const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1);
  if (!user || !user.enabled || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await db.delete(authLoginAttempts).where(inArray(authLoginAttempts.keyHash, keys));
  const session = await createSession(user.id);
  const response = NextResponse.json({ ok: true, user: { email: user.email, role: user.role } });
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
  return response;
}

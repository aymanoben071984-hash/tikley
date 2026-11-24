import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, withAdvisoryLock } from "@/db";
import { authUsers } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { isSameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "aymanoben071984@gmail.com";
const BOOTSTRAP_LOCK = 740_004;

function tokenMatches(candidate: string, expected: string): boolean {
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET() {
  try {
    const [existing] = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
    return NextResponse.json({ available: !existing });
  } catch {
    return NextResponse.json({ error: "Setup status unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  const expected = process.env.TIKLEY_BOOTSTRAP_SECRET;
  const provided = request.headers.get("x-tikley-bootstrap-secret") || "";
  if (!expected || expected.length < 32 || !provided || provided.length > 256 || !tokenMatches(provided, expected)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8 * 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email !== ADMIN_EMAIL || password.length < 14 || password.length > 128) {
    return NextResponse.json({ error: "Use the configured admin email and a password of 14–128 characters." }, { status: 400 });
  }

  try {
    const created = await withAdvisoryLock(BOOTSTRAP_LOCK, async () => {
      const [existing] = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
      if (existing) return false;
      const passwordHash = await hashPassword(password);
      await db.insert(authUsers).values({ email: ADMIN_EMAIL, passwordHash, role: "admin", enabled: true });
      return true;
    });
    if (!created) return NextResponse.json({ error: "First-admin setup is permanently closed." }, { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create the first admin account." }, { status: 500 });
  }
}

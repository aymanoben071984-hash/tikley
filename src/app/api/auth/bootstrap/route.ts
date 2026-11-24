import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { authUsers } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.TIKLEY_BOOTSTRAP_SECRET;
  if (!secret || !request.headers.get("x-tikley-bootstrap-secret") || !secretMatches(request.headers.get("x-tikley-bootstrap-secret")!, secret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [existing] = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
  if (existing) return NextResponse.json({ error: "Bootstrap already completed" }, { status: 409 });

  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 14 || password.length > 256) {
    return NextResponse.json({ error: "Use a valid email and a password of at least 14 characters" }, { status: 400 });
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(authUsers).values({ email, passwordHash, role: "admin" }).returning({ id: authUsers.id, email: authUsers.email });
  return NextResponse.json({ created: true, user }, { status: 201 });
}

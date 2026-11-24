import { NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  await revokeSession(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

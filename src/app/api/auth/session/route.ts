import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  return NextResponse.json({ authenticated: Boolean(user), user: user ? { email: user.email, role: user.role } : null });
}

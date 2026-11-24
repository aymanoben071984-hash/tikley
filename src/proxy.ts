import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isSameOrigin } from "@/lib/auth";

const ADMIN_API_PATHS = new Set([
  "/api/actions",
  "/api/actions/test",
  "/api/avatars",
  "/api/dashboard",
  "/api/games",
  "/api/scenes",
  "/api/top-boards",
  "/api/widgets",
  "/api/overlay-display",
]);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const dashboardPage = path === "/dashboard" || path.startsWith("/dashboard/");
  const protectedApi = ADMIN_API_PATHS.has(path);
  if (!dashboardPage && !protectedApi) return NextResponse.next();

  const user = await getSessionUser(request);
  if (user?.role === "admin") {\n    if (protectedApi && !["GET", "HEAD", "OPTIONS"].includes(request.method) && !isSameOrigin(request)) {\n      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });\n    }\n    return NextResponse.next();\n  }

  if (dashboardPage) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export const config = {
  matcher: [\n    "/dashboard/:path*",\n    "/api/actions", "/api/actions/test", "/api/avatars", "/api/dashboard",\n    "/api/games", "/api/scenes", "/api/top-boards", "/api/widgets", "/api/overlay-display",\n  ],
};

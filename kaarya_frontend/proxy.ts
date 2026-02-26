import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/oauth/callback"];
const adminRoutes = ["/admin"];

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (base64.length % 4)) % 4;
    const normalized = `${base64}${"=".repeat(padLength)}`;
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isPublicRoute = (path: string) =>
  publicRoutes.some((route) =>
    route === "/"
      ? path === route
      : path === route || path.startsWith(`${route}/`),
  );

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const token = request.cookies.get("access_token")?.value;
  const isPublic = isPublicRoute(path);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (token && (path === "/sign-in" || path === "/sign-up")) {
    const payload = decodeJwtPayload(token);
    const role = typeof payload?.role === "string" ? payload.role : null;
    const destination = role === "admin" ? "/admin" : "/overview";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const isAdminRoute = adminRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const payload = decodeJwtPayload(token);
    const role = typeof payload?.role === "string" ? payload.role : null;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/overview", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

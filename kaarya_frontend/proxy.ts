import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];
const adminRoutes = ["/admin"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route),
  );

  const token = request.cookies.get("access_token")?.value;

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const isAdminRoute = adminRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

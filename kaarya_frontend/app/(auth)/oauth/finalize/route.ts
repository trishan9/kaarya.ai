import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "access_token";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const SESSION_SECURE = process.env.NODE_ENV === "production";

const safeNextPath = (value: string | null) => {
  if (!value) return "/overview";
  if (!value.startsWith("/")) return "/overview";
  if (value.startsWith("//")) return "/overview";
  return value;
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!token) {
    return NextResponse.redirect(
      new URL("/sign-in?oauthError=invalid_session", request.url)
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: SESSION_SECURE,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}

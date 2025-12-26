import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createSession(token: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const cookieStore = await cookies();

  cookieStore.set("access_token", token, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export const verifySession = cache(async () => {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return null;
  }

  return { isAuth: true, token, dummyUserId: "2" };
});

export async function updateSession() {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) return null;

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const cookieStore = await cookies();
  cookieStore.set("access_token", token, {
    httpOnly: true,
    secure: true,
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
}

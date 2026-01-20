import "server-only";

import { cache } from "react";
import { TUser } from "./definitions";
import { verifySession } from "./session";
import { getMe } from "./actions/auth-action";

export const getCurrentUser = cache(async (): Promise<TUser | null> => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const response = await getMe();
    return response.data ?? null;
  } catch {
    console.log("Failed to fetch user");
    return null;
  }
});

import "server-only";

import { cache } from "react";
import { TUser } from "./definitions";
import { verifySession } from "./session";
import { authActions } from "./actions/auth-action";

export const getCurrentUser = cache(async (): Promise<TUser | null> => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const response = await authActions.auth.getMe();
    return response.data.data ?? null;
  } catch {
    console.log("Failed to fetch user");
    return null;
  }
});

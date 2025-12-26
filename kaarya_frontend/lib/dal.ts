import "server-only";
import { cache } from "react";
import { Role, TUser } from "./definitions";
import { verifySession } from "./session";

const dummyUsers: TUser[] = [
  {
    id: "1",
    name: "Trishan",
    role: Role.USER,
  },
  {
    id: "2",
    name: "Albert",
    role: Role.ADMIN,
  },
];

export const getCurrentUser = cache(async (): Promise<TUser | null> => {
  const session = await verifySession();
  if (!session) return null;

  try {
    if (session.token !== "dummy_access_token") {
      return null;
    }

    const user = dummyUsers.find((user) => user.id === session.dummyUserId); // later on API call to check with the token as Bearer!
    return user ?? null;
  } catch (error) {
    console.log("Failed to fetch user");
    return null;
  }
});

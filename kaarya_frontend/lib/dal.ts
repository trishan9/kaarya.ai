import { cookies } from "next/headers";

export async function getCurrentUser(): Promise<{
  id: number;
  name: string;
} | null> {
  const token = (await cookies()).get("access_token");

  if (!token) return null;

  // Later here I will call the API to check if this user exists or not, currently just dummy
  const user = {
    id: 1,
    name: "Trishan Wagle",
  };

  if (!user) return null;
  return user;
}

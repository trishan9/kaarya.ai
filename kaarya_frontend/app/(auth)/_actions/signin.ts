"use server";

import { cookies } from "next/headers";
import z from "zod";
import { signinSchema } from "../_schemas";

export async function signinAction(payload: z.infer<typeof signinSchema>) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(payload);
  const cookieStore = await cookies();
  cookieStore.set("access_token", "dummy_trishan_jwt", { secure: true });
}

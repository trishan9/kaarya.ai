"use server";

import { redirect } from "next/navigation";
import z from "zod";
import { signupSchema } from "../_schemas";

export async function signupAction(payload: z.infer<typeof signupSchema>) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(payload);
  redirect("/sign-in");
}

"use server";

import { redirect } from "next/navigation";
import z from "zod";
import { signinSchema } from "../_schemas";
import { createSession } from "@/lib/session";

export async function signinAction(payload: z.infer<typeof signinSchema>) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(payload); // call API later with this payload
  await createSession("dummy_access_token");
  redirect("/overview");
}

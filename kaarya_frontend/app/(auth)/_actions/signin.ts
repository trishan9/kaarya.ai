"use server";

import { cookies } from "next/headers";

export async function signinAction() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const cookieStore = await cookies();
    cookieStore.set("access_token", "dummy_trishan_jwt", { secure: true });
}

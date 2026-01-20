"use server";

import { TSigninSchema, TSignupSchema } from "@/app/(auth)/_schemas";
import { api } from "../api/axios-instance";
import { API_URLS } from "../api/endpoints";
import { clearSession } from "../session";
import { redirect } from "next/navigation";

export const authActions = {
  auth: {
    signup: async (data: TSignupSchema) => {
      return await api.post(API_URLS.AUTH.SIGNUP, data);
    },
    signin: async (credentials: TSigninSchema) => {
      return await api.post(API_URLS.AUTH.SIGNIN, credentials);
    },
    logout: async () => {
      await clearSession();
      return redirect("/sign-in");
    },
    getMe: async () => {
      return await api.get(API_URLS.AUTH.ME);
    },
  },
};

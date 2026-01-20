"use server";

import { TSigninSchema, TSignupSchema } from "@/app/(auth)/_schemas";
import { api } from "../api/axios-instance";
import { API_URLS } from "../api/endpoints";
import { clearSession } from "../session";

export async function signup(data: TSignupSchema) {
  try {
    const response = await api.post(API_URLS.AUTH.SIGNUP, data);
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Signup failed",
    };
  }
}

export async function signin(credentials: TSigninSchema) {
  try {
    const response = await api.post(API_URLS.AUTH.SIGNIN, credentials);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Signin failed";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function logout() {
  await clearSession();
}

export async function getMe() {
  try {
    const response = await api.get(API_URLS.AUTH.ME);
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Failed to fetch user data",
    };
  }
}

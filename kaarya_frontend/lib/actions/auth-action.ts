"use server";

import { TSigninSchema, TSignupSchema } from "@/app/(auth)/_schemas";
import { api } from "../api/axios-instance";
import { API_URLS } from "../api/endpoints";
import { clearSession } from "../session";

export async function signup(data: TSignupSchema) {
  try {
    const response = await api.post(API_URLS.AUTH.SIGNUP, {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Signup failed";
    return {
      success: false,
      message: errorMessage,
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
    const errorMessage =
      error?.response?.data?.message || error.message || "Fetching user failed";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

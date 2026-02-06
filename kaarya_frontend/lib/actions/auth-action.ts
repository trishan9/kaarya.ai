"use server";

import {
  TConfirmPasswordResetSchema,
  TRequestPasswordResetSchema,
  TSigninSchema,
  TSignupSchema,
  TVerifyPasswordResetOtpSchema,
} from "@/app/(auth)/_schemas";
import { api, MULTIPART_FORM_DATA_CONFIG } from "../api/axios-instance";
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

export async function updateProfile(formData: FormData) {
  try {
    const response = await api.put(
      API_URLS.AUTH.UPDATE_ME,
      formData,
      MULTIPART_FORM_DATA_CONFIG
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update profile";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function requestPasswordReset(data: TRequestPasswordResetSchema) {
  try {
    const response = await api.post(API_URLS.AUTH.PASSWORD_RESET_REQUEST, data);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to request password reset";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function verifyPasswordResetOtp(
  data: TVerifyPasswordResetOtpSchema
) {
  try {
    const response = await api.post(API_URLS.AUTH.PASSWORD_RESET_VERIFY, data);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to verify reset code";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function confirmPasswordReset(data: TConfirmPasswordResetSchema) {
  try {
    const response = await api.post(API_URLS.AUTH.PASSWORD_RESET_CONFIRM, data);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to reset password";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

"use server";

import { headers } from "next/headers";
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
import { AuthProvider } from "../definitions";

const pickHeaderValue = (...values: Array<string | null>) => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
};

async function getClientMetadataHeaders() {
  const incomingHeaders = await headers();
  const forwardedFor = pickHeaderValue(
    incomingHeaders.get("x-forwarded-for"),
    incomingHeaders.get("x-real-ip"),
    incomingHeaders.get("cf-connecting-ip")
  );
  const userAgent = pickHeaderValue(incomingHeaders.get("user-agent"));
  const requestHeaders: Record<string, string> = {};

  if (forwardedFor) {
    requestHeaders["x-client-ip"] = forwardedFor.split(",")[0]?.trim() ?? "";
  }
  if (userAgent) {
    requestHeaders["x-client-user-agent"] = userAgent;
  }

  return requestHeaders;
}

async function getAppOrigin() {
  const incomingHeaders = await headers();
  const host = pickHeaderValue(
    incomingHeaders.get("x-forwarded-host"),
    incomingHeaders.get("host")
  );
  const protocol =
    pickHeaderValue(incomingHeaders.get("x-forwarded-proto")) || "http";

  if (!host) {
    return null;
  }

  return `${protocol.split(",")[0]?.trim() || "http"}://${host
    .split(",")[0]
    ?.trim()}`;
}

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

export async function exchangeOAuthResult(resultToken: string) {
  try {
    const response = await api.post(API_URLS.AUTH.OAUTH_EXCHANGE, {
      resultToken,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to complete social authentication";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function completeOAuthLink(linkToken: string) {
  try {
    const response = await api.post(API_URLS.AUTH.OAUTH_LINK_COMPLETE, {
      linkToken,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to link social account";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getOAuthLinkAuthorizeUrl(
  provider: Extract<AuthProvider, "google" | "github">,
  nextPath = "/settings"
) {
  try {
    const origin = await getAppOrigin();
    if (!origin) {
      return {
        success: false,
        message: "Unable to resolve app URL for account linking.",
      };
    }

    const callbackUrl = new URL("/oauth/callback", origin);
    callbackUrl.searchParams.set("next", nextPath);
    callbackUrl.searchParams.set("mode", "link");

    const response = await api.get(
      API_URLS.AUTH.OAUTH_LINK_AUTHORIZE(provider),
      {
        params: {
          redirectUri: callbackUrl.toString(),
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 300 && status < 400,
      }
    );

    const locationHeader = response.headers?.location;
    const authorizeUrl = Array.isArray(locationHeader)
      ? locationHeader[0]
      : locationHeader;

    if (!authorizeUrl) {
      return {
        success: false,
        message: "Unable to start account linking right now.",
      };
    }

    return {
      success: true,
      message: "Link flow initiated.",
      data: {
        authorizeUrl,
      },
    };
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to initialize account linking";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getLinkedAccounts() {
  try {
    const response = await api.get(API_URLS.AUTH.OAUTH_LINKED_ACCOUNTS);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to load linked accounts";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function unlinkOAuthAccount(
  provider: Extract<AuthProvider, "google" | "github">
) {
  try {
    const response = await api.delete(API_URLS.AUTH.OAUTH_UNLINK(provider));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to unlink account";
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
    const response = await api.post(
      API_URLS.AUTH.PASSWORD_RESET_REQUEST,
      data,
      {
        headers: await getClientMetadataHeaders(),
      }
    );
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
    const response = await api.post(API_URLS.AUTH.PASSWORD_RESET_VERIFY, data, {
      headers: await getClientMetadataHeaders(),
    });
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
    const response = await api.post(
      API_URLS.AUTH.PASSWORD_RESET_CONFIRM,
      data,
      {
        headers: await getClientMetadataHeaders(),
      }
    );
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

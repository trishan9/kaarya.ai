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
import { createCompany } from "./company-actions";
import { createCollege } from "./college-actions";

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
      role: data.role,
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

export async function signupRecruiterWithCompany(data: TSignupSchema) {
  if (data.role !== "recruiter") {
    return {
      success: false,
      message: "Recruiter role is required for this flow.",
    };
  }

  if (!data.companyName?.trim()) {
    return {
      success: false,
      message: "Company name is required for recruiter signup.",
    };
  }

  try {
    const signupResponse = await signup(data);
    if (!signupResponse?.success) {
      return signupResponse;
    }

    const loginResponse = await signin({
      email: data.email,
      password: data.password,
    });

    const accessToken = loginResponse?.data?.accessToken;
    if (!loginResponse?.success || !accessToken) {
      return {
        success: false,
        message:
          loginResponse?.message ||
          "Recruiter account created but sign-in failed. Please sign in manually.",
      };
    }

    const companyResponse = await createCompany(
      {
        name: data.companyName.trim(),
        industry: data.companyIndustry,
        location: data.companyLocation,
        designation: data.designation,
      },
      {
        accessToken,
      },
    );

    if (!companyResponse?.success) {
      return {
        success: false,
        message:
          companyResponse?.message ||
          "Recruiter account created but company setup failed.",
      };
    }

    return {
      success: true,
      message: "Recruiter account and company workspace created.",
      data: {
        accessToken,
        user: signupResponse.data,
        company: companyResponse.data,
      },
    };
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to complete recruiter signup";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function signupCollegeWithWorkspace(data: TSignupSchema) {
  if (data.role !== "college") {
    return {
      success: false,
      message: "College role is required for this flow.",
    };
  }

  if (!data.collegeName?.trim()) {
    return {
      success: false,
      message: "College name is required for college signup.",
    };
  }

  try {
    const signupResponse = await signup(data);
    if (!signupResponse?.success) {
      return signupResponse;
    }

    const loginResponse = await signin({
      email: data.email,
      password: data.password,
    });

    const accessToken = loginResponse?.data?.accessToken;
    if (!loginResponse?.success || !accessToken) {
      return {
        success: false,
        message:
          loginResponse?.message ||
          "College account created but sign-in failed. Please sign in manually.",
      };
    }

    const collegeResponse = await createCollege(
      {
        name: data.collegeName.trim(),
        institutionType: data.collegeInstitutionType,
        location: data.collegeLocation,
      },
      {
        accessToken,
      },
    );

    if (!collegeResponse?.success) {
      return {
        success: false,
        message:
          collegeResponse?.message ||
          "College account created but workspace setup failed.",
      };
    }

    return {
      success: true,
      message: "College account and workspace created.",
      data: {
        accessToken,
        user: signupResponse.data,
        college: collegeResponse.data,
      },
    };
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to complete college signup";
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

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  try {
    const res = await api.post(API_URLS.AUTH.CHANGE_PASSWORD, payload);
    return res.data as { success: boolean; message?: string };
  } catch (error: unknown) {
    const msg =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
        ? error.response.data.message
        : "Failed to change password.";
    return { success: false, message: msg };
  }
}

export async function uploadCertificationMedia(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      API_URLS.AUTH.CERTIFICATION_UPLOAD,
      formData,
      MULTIPART_FORM_DATA_CONFIG,
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to upload certification media";
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

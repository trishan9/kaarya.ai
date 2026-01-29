"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

export type AdminUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  provider?: string;
  photo?: File | null;
};

const buildUserFormData = (payload: AdminUserPayload) => {
  const formData = new FormData();

  if (payload.name) formData.append("name", payload.name);
  if (payload.email) formData.append("email", payload.email);
  if (payload.password) formData.append("password", payload.password);
  if (payload.confirmPassword) {
    formData.append("confirmPassword", payload.confirmPassword);
  }
  if (payload.role) formData.append("role", payload.role);
  if (payload.provider) formData.append("provider", payload.provider);

  if (payload.photo instanceof File) {
    formData.append("photo", payload.photo);
  }

  return formData;
};

export async function getAdminUsers() {
  try {
    const response = await api.get(API_URLS.ADMIN.USERS);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch users";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getAdminUserById(id: string) {
  try {
    const response = await api.get(API_URLS.ADMIN.USER_BY_ID(id));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to fetch user";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function createAdminUser(payload: AdminUserPayload) {
  try {
    const formData = buildUserFormData(payload);
    const response = await api.post(API_URLS.ADMIN.USERS, formData);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to create user";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateAdminUser(id: string, payload: AdminUserPayload) {
  try {
    const formData = buildUserFormData(payload);
    const response = await api.put(API_URLS.ADMIN.USER_BY_ID(id), formData);
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update user";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function deleteAdminUser(id: string) {
  try {
    const response = await api.delete(API_URLS.ADMIN.USER_BY_ID(id));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to delete user";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

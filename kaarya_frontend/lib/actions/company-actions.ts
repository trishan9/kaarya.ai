"use server";

import { api, MULTIPART_FORM_DATA_CONFIG } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

type AuthOptions = {
  accessToken?: string;
};

type CompanyFormPayload = {
  name: string;
  industry?: string;
  location?: string;
  designation?: string;
  logo?: File | null;
  verifiedStatus?: boolean;
};

type CompanyUpdatePayload = {
  name?: string;
  industry?: string;
  location?: string;
  logo?: File | null;
  verifiedStatus?: boolean;
};

const toTrimmedOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildCompanyFormData = (payload: CompanyFormPayload) => {
  const formData = new FormData();
  formData.append("name", payload.name.trim());

  const industry = toTrimmedOrUndefined(payload.industry);
  const location = toTrimmedOrUndefined(payload.location);
  const designation = toTrimmedOrUndefined(payload.designation);

  if (industry) formData.append("industry", industry);
  if (location) formData.append("location", location);
  if (designation) formData.append("designation", designation);
  if (typeof payload.verifiedStatus === "boolean") {
    formData.append("verifiedStatus", String(payload.verifiedStatus));
  }
  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  return formData;
};

const buildCompanyUpdateFormData = (payload: CompanyUpdatePayload) => {
  const formData = new FormData();
  const name = toTrimmedOrUndefined(payload.name);
  const industry = toTrimmedOrUndefined(payload.industry);
  const location = toTrimmedOrUndefined(payload.location);

  if (name) formData.append("name", name);
  if (industry !== undefined) formData.append("industry", industry);
  if (location !== undefined) formData.append("location", location);
  if (typeof payload.verifiedStatus === "boolean") {
    formData.append("verifiedStatus", String(payload.verifiedStatus));
  }
  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  return formData;
};

export async function listRecruiterWorkspaces(params?: {
  page?: number;
  size?: number;
}) {
  try {
    const response = await api.get(API_URLS.COMPANY.WORKSPACES_ME, {
      params: {
        page: params?.page,
        size: params?.size,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to load recruiter workspaces";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function listCompanies(params?: {
  page?: number;
  size?: number;
  search?: string;
}) {
  try {
    const response = await api.get(API_URLS.COMPANY.LIST, {
      params: {
        page: params?.page,
        size: params?.size,
        search: toTrimmedOrUndefined(params?.search),
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to load companies";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function listCompanyRecruiters(
  companyId: string,
  params?: {
    page?: number;
    size?: number;
  },
) {
  try {
    const response = await api.get(API_URLS.COMPANY.RECRUITERS(companyId), {
      params: {
        page: params?.page,
        size: params?.size,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to load company members";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function createCompany(
  payload: CompanyFormPayload,
  options?: AuthOptions,
) {
  try {
    const formData = buildCompanyFormData(payload);
    const response = await api.post(API_URLS.COMPANY.LIST, formData, {
      headers: {
        ...MULTIPART_FORM_DATA_CONFIG.headers,
        ...(options?.accessToken
          ? { Authorization: `Bearer ${options.accessToken}` }
          : {}),
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to create company";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getCompanyById(companyId: string) {
  try {
    const response = await api.get(API_URLS.COMPANY.BY_ID(companyId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to load company";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateCompany(
  companyId: string,
  payload: CompanyUpdatePayload,
) {
  try {
    const formData = buildCompanyUpdateFormData(payload);
    const response = await api.patch(API_URLS.COMPANY.BY_ID(companyId), formData, {
      headers: {
        ...MULTIPART_FORM_DATA_CONFIG.headers,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update company";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function joinCompanyByCode(payload: {
  inviteCode: string;
  designation?: string;
}) {
  try {
    const response = await api.post(API_URLS.COMPANY.JOIN_BY_CODE, {
      inviteCode: payload.inviteCode.trim(),
      designation: toTrimmedOrUndefined(payload.designation),
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to join company";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function resetCompanyInviteCode(companyId: string) {
  try {
    const response = await api.post(API_URLS.COMPANY.INVITE_CODE_RESET(companyId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to reset invite code";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function inviteRecruiterToCompany(
  companyId: string,
  payload: {
    email: string;
    designation?: string;
  },
) {
  try {
    const response = await api.post(API_URLS.COMPANY.INVITES(companyId), {
      email: payload.email.trim().toLowerCase(),
      designation: toTrimmedOrUndefined(payload.designation),
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to send recruiter invitation";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function removeRecruiterFromCompany(
  companyId: string,
  recruiterId: string,
) {
  try {
    const response = await api.delete(
      API_URLS.COMPANY.RECRUITER_BY_ID(companyId, recruiterId),
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to remove recruiter";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

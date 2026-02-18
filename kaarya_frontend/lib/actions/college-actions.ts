"use server";

import { api, MULTIPART_FORM_DATA_CONFIG } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";
import type { TLeaderboardScope } from "@/lib/definitions";

type AuthOptions = {
  accessToken?: string;
};

type CollegeFormPayload = {
  name: string;
  institutionType?: string;
  location?: string;
  logo?: File | null;
};

type CollegeUpdatePayload = {
  name?: string;
  institutionType?: string;
  location?: string;
  logo?: File | null;
};

const toTrimmedOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildCollegeFormData = (payload: CollegeFormPayload) => {
  const formData = new FormData();
  formData.append("name", payload.name.trim());

  const institutionType = toTrimmedOrUndefined(payload.institutionType);
  const location = toTrimmedOrUndefined(payload.location);

  if (institutionType) formData.append("institutionType", institutionType);
  if (location) formData.append("location", location);
  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  return formData;
};

const buildCollegeUpdateFormData = (payload: CollegeUpdatePayload) => {
  const formData = new FormData();
  const name = toTrimmedOrUndefined(payload.name);
  const institutionType = toTrimmedOrUndefined(payload.institutionType);
  const location = toTrimmedOrUndefined(payload.location);

  if (name) formData.append("name", name);
  if (institutionType !== undefined) {
    formData.append("institutionType", institutionType);
  }
  if (location !== undefined) formData.append("location", location);
  if (payload.logo instanceof File) {
    formData.append("logo", payload.logo);
  }

  return formData;
};

export async function listCollegeWorkspaces(params?: { page?: number; size?: number }) {
  try {
    const response = await api.get(API_URLS.COLLEGE.WORKSPACES_ME, {
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
      "Failed to load college workspaces";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function listColleges(params?: {
  page?: number;
  size?: number;
  search?: string;
}) {
  try {
    const response = await api.get(API_URLS.COLLEGE.LIST, {
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
      "Failed to load colleges";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function listCollegeStudents(
  collegeId: string,
  params?: {
    page?: number;
    size?: number;
  },
) {
  try {
    const response = await api.get(API_URLS.COLLEGE.STUDENTS(collegeId), {
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
      "Failed to load college students";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getCollegeMetrics(collegeId: string) {
  try {
    const response = await api.get(API_URLS.COLLEGE.METRICS(collegeId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to load college metrics";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function createCollege(
  payload: CollegeFormPayload,
  options?: AuthOptions,
) {
  try {
    const formData = buildCollegeFormData(payload);
    const response = await api.post(API_URLS.COLLEGE.LIST, formData, {
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
      error?.response?.data?.message || error.message || "Failed to create college";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getCollegeById(collegeId: string) {
  try {
    const response = await api.get(API_URLS.COLLEGE.BY_ID(collegeId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to load college";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateCollege(
  collegeId: string,
  payload: CollegeUpdatePayload,
) {
  try {
    const formData = buildCollegeUpdateFormData(payload);
    const response = await api.patch(API_URLS.COLLEGE.BY_ID(collegeId), formData, {
      headers: {
        ...MULTIPART_FORM_DATA_CONFIG.headers,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update college";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function joinCollegeByCode(payload: {
  inviteCode: string;
  program?: string;
  year?: number;
}) {
  try {
    const response = await api.post(API_URLS.COLLEGE.JOIN_BY_CODE, {
      inviteCode: payload.inviteCode.trim(),
      program: toTrimmedOrUndefined(payload.program),
      year: payload.year,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to join college";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function resetCollegeInviteCode(collegeId: string) {
  try {
    const response = await api.post(API_URLS.COLLEGE.INVITE_CODE_RESET(collegeId));
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

export async function inviteStudentToCollege(
  collegeId: string,
  payload: {
    email: string;
    program?: string;
    year?: number;
  },
) {
  try {
    const response = await api.post(API_URLS.COLLEGE.INVITES(collegeId), {
      email: payload.email.trim().toLowerCase(),
      program: toTrimmedOrUndefined(payload.program),
      year: payload.year,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to send student invitation";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function removeStudentFromCollege(
  collegeId: string,
  studentId: string,
) {
  try {
    const response = await api.delete(
      API_URLS.COLLEGE.STUDENT_BY_ID(collegeId, studentId),
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to remove student";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getLeaderboard(params?: {
  scope?: TLeaderboardScope;
  collegeId?: string;
  page?: number;
  size?: number;
}) {
  try {
    const response = await api.get(API_URLS.LEADERBOARD.LIST, {
      params: {
        scope: params?.scope,
        collegeId: params?.collegeId,
        page: params?.page,
        size: params?.size,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to load leaderboard";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

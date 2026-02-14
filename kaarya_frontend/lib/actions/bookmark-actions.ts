"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

export type BookmarkListQuery = {
  type?: "all" | "jobs" | "interviews";
  search?: string;
  sortBy?: "saved_at_desc" | "saved_at_asc";
};

const toTrimmedOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export async function getMyBookmarks(query?: BookmarkListQuery) {
  try {
    const response = await api.get(API_URLS.BOOKMARK.ME, {
      params: {
        type: query?.type,
        search: toTrimmedOrUndefined(query?.search),
        sortBy: query?.sortBy,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to load saved bookmarks",
    };
  }
}

export async function saveJobBookmark(jobId: string) {
  try {
    const response = await api.post(API_URLS.BOOKMARK.JOB(jobId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message || error.message || "Failed to save job",
    };
  }
}

export async function unsaveJobBookmark(jobId: string) {
  try {
    const response = await api.delete(API_URLS.BOOKMARK.JOB(jobId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to remove saved job",
    };
  }
}

export async function saveInterviewBookmark(interviewId: string) {
  try {
    const response = await api.post(API_URLS.BOOKMARK.INTERVIEW(interviewId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to save interview",
    };
  }
}

export async function unsaveInterviewBookmark(interviewId: string) {
  try {
    const response = await api.delete(API_URLS.BOOKMARK.INTERVIEW(interviewId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to remove saved interview",
    };
  }
}

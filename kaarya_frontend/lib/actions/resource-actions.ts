"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

export type ResourceCourseListQuery = {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  visibility?: "private" | "public";
  source?: "candidate" | "company" | "college";
  ownership?: "all" | "mine" | "public";
  sortBy?: "newest" | "updated" | "title";
};

export type CreateResourceCoursePayload = {
  title: string;
  description?: string;
  category: string;
  generationMode?: "learn" | "interview_prep";
  difficulty: "beginner" | "intermediate" | "advanced";
  targetRoles: string[];
  chapterCount?: number;
  chapterTitles?: string[];
  visibility?: "private" | "public";
  includeVideoRecommendations?: boolean;
  customVideoUrls?: string[];
  promptContext?: string;
  jobDescriptionContext?: string;
  companyId?: string;
  collegeId?: string;
};

export type UpdateResourceCoursePayload = Partial<{
  title: string;
  description: string;
  category: string;
  generationMode: "learn" | "interview_prep";
  difficulty: "beginner" | "intermediate" | "advanced";
  targetRoles: string[];
  chapterCount: number;
  chapterTitles: string[];
  visibility: "private" | "public";
  includeVideoRecommendations: boolean;
  customVideoUrls: string[];
  promptContext: string;
  jobDescriptionContext: string;
  regenerateContent: boolean;
}>;

const toTrimmedOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toErrorMessage = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    if ("response" in value) {
      const response = (
        value as {
          response?: { data?: { message?: string | string[] }; status?: number };
        }
      ).response;
      const message = response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (Array.isArray(message) && message.length > 0) {
        return message.map((item) => String(item)).join(", ");
      }
      if (response?.status === 502) {
        return "AI service could not generate the course right now. Please try again.";
      }
    }

    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.message)) {
      return record.message.map((item) => String(item)).join(", ");
    }
    if (record.message) return toErrorMessage(record.message, fallback);
    if (typeof record.error === "string") return record.error;
    if (record.error) return toErrorMessage(record.error, fallback);
    if (Array.isArray(record.errors)) {
      return record.errors.map((item) => String(item)).join(", ");
    }

    try {
      return JSON.stringify(record);
    } catch {
      return fallback;
    }
  }

  if (value instanceof Error) return value.message || fallback;
  return fallback;
};

export async function listResourceCourses(query?: ResourceCourseListQuery) {
  try {
    const response = await api.get(API_URLS.RESOURCE.LIST, {
      params: {
        page: query?.page,
        size: query?.size,
        search: toTrimmedOrUndefined(query?.search),
        category: toTrimmedOrUndefined(query?.category),
        difficulty: query?.difficulty,
        visibility: query?.visibility,
        source: query?.source,
        ownership: query?.ownership,
        sortBy: query?.sortBy,
      },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to fetch resource courses."),
    };
  }
}

export async function getResourceCourseById(courseId: string) {
  try {
    const response = await api.get(API_URLS.RESOURCE.BY_ID(courseId));
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to fetch resource course."),
    };
  }
}

export async function createResourceCourse(payload: CreateResourceCoursePayload) {
  try {
    const response = await api.post(API_URLS.RESOURCE.LIST, {
      title: payload.title.trim(),
      description: toTrimmedOrUndefined(payload.description),
      category: payload.category.trim(),
      generationMode: payload.generationMode ?? "learn",
      difficulty: payload.difficulty,
      targetRoles: payload.targetRoles.map((item) => item.trim()).filter(Boolean),
      chapterCount: payload.chapterCount ?? 6,
      chapterTitles:
        payload.chapterTitles?.map((item) => item.trim()).filter(Boolean) ?? [],
      visibility: payload.visibility ?? "private",
      includeVideoRecommendations:
        typeof payload.includeVideoRecommendations === "boolean"
          ? payload.includeVideoRecommendations
          : true,
      customVideoUrls:
        payload.customVideoUrls?.map((item) => item.trim()).filter(Boolean) ?? [],
      promptContext: toTrimmedOrUndefined(payload.promptContext),
      jobDescriptionContext: toTrimmedOrUndefined(payload.jobDescriptionContext),
      companyId: payload.companyId,
      collegeId: payload.collegeId,
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to create resource course."),
    };
  }
}

export async function updateResourceCourse(
  courseId: string,
  payload: UpdateResourceCoursePayload,
) {
  try {
    const response = await api.patch(API_URLS.RESOURCE.BY_ID(courseId), {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.description !== undefined
        ? { description: toTrimmedOrUndefined(payload.description) }
        : {}),
      ...(payload.category !== undefined ? { category: payload.category.trim() } : {}),
      ...(payload.generationMode ? { generationMode: payload.generationMode } : {}),
      ...(payload.difficulty ? { difficulty: payload.difficulty } : {}),
      ...(payload.targetRoles
        ? {
            targetRoles: payload.targetRoles
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : {}),
      ...(payload.chapterCount !== undefined
        ? { chapterCount: payload.chapterCount }
        : {}),
      ...(payload.chapterTitles
        ? {
            chapterTitles: payload.chapterTitles
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : {}),
      ...(payload.visibility ? { visibility: payload.visibility } : {}),
      ...(typeof payload.includeVideoRecommendations === "boolean"
        ? { includeVideoRecommendations: payload.includeVideoRecommendations }
        : {}),
      ...(payload.customVideoUrls
        ? {
            customVideoUrls: payload.customVideoUrls
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : {}),
      ...(payload.promptContext !== undefined
        ? { promptContext: toTrimmedOrUndefined(payload.promptContext) }
        : {}),
      ...(payload.jobDescriptionContext !== undefined
        ? { jobDescriptionContext: toTrimmedOrUndefined(payload.jobDescriptionContext) }
        : {}),
      ...(typeof payload.regenerateContent === "boolean"
        ? { regenerateContent: payload.regenerateContent }
        : {}),
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to update resource course."),
    };
  }
}

export async function deleteResourceCourse(courseId: string) {
  try {
    const response = await api.delete(API_URLS.RESOURCE.BY_ID(courseId));
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: toErrorMessage(error, "Failed to delete resource course."),
    };
  }
}

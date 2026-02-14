"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

export type InterviewOwnershipFilter =
  | "all"
  | "created_by_me"
  | "taken_by_me"
  | "not_taken";
export type InterviewSortBy = "newest" | "popular" | "updated" | "title";

export type ListInterviewsQuery = {
  page?: number;
  size?: number;
  search?: string;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "college_only" | "private";
  interviewType?:
    | "technical"
    | "behavioral"
    | "mixed"
    | "system_design"
    | "custom";
  companyId?: string;
  collegeId?: string;
  ownership?: InterviewOwnershipFilter;
  discover?: boolean;
  sortBy?: InterviewSortBy;
};

export type CreateInterviewPayload = {
  title: string;
  description?: string;
  interviewType:
    | "technical"
    | "behavioral"
    | "mixed"
    | "system_design"
    | "custom";
  role: string;
  level?: string;
  techStack?: string[];
  questionCount?: number;
  durationMinutes?: number;
  visibility?: "public" | "college_only" | "private";
  status?: "draft" | "published" | "archived";
  companyId?: string;
  collegeId?: string;
  tags?: string[];
  instructions?: string;
  generateQuestions?: boolean;
  questions?: string[];
};

export type UpdateInterviewPayload = Partial<CreateInterviewPayload>;

export type StartInterviewSessionPayload = {
  mode?: "web" | "mobile";
  metadata?: Record<string, unknown>;
};

export type CompleteInterviewSessionPayload = {
  status?: "in_progress" | "completed" | "abandoned";
  transcript?: Array<{
    role: "assistant" | "user" | "system";
    content: string;
    timestamp?: string | null;
  }>;
  recordingUrl?: string;
  vapiCallId?: string;
  durationSeconds?: number;
  generateEvaluation?: boolean;
};

const toTrimmedOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toErrorMessage = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;

  if (typeof value === "object") {
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

  return fallback;
};

export async function listInterviews(query?: ListInterviewsQuery) {
  try {
    const response = await api.get(API_URLS.INTERVIEW.LIST, {
      params: {
        page: query?.page,
        size: query?.size,
        search: toTrimmedOrUndefined(query?.search),
        status: query?.status,
        visibility: query?.visibility,
        interviewType: query?.interviewType,
        companyId: query?.companyId,
        collegeId: query?.collegeId,
        ownership: query?.ownership,
        discover: query?.discover,
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
        "Failed to list interviews",
    };
  }
}

export async function getInterviewById(interviewId: string) {
  try {
    const response = await api.get(API_URLS.INTERVIEW.BY_ID(interviewId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to load interview",
    };
  }
}

export async function createInterview(payload: CreateInterviewPayload) {
  try {
    const response = await api.post(API_URLS.INTERVIEW.LIST, {
      title: payload.title.trim(),
      description: toTrimmedOrUndefined(payload.description),
      interviewType: payload.interviewType,
      role: payload.role.trim(),
      level: toTrimmedOrUndefined(payload.level),
      techStack: payload.techStack?.map((item) => item.trim()).filter(Boolean) ?? [],
      questionCount: payload.questionCount ?? 8,
      durationMinutes: payload.durationMinutes ?? 25,
      visibility: payload.visibility,
      status: payload.status,
      companyId: payload.companyId,
      collegeId: payload.collegeId,
      tags: payload.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
      instructions: toTrimmedOrUndefined(payload.instructions),
      generateQuestions:
        typeof payload.generateQuestions === "boolean"
          ? payload.generateQuestions
          : false,
      questions:
        payload.questions?.map((question) => question.trim()).filter(Boolean) ?? [],
    });
    return response.data;
  } catch (error: Error | any) {
    const backendPayload = error?.response?.data;
    const statusCode = error?.response?.status as number | undefined;
    return {
      success: false,
      message: toErrorMessage(
        backendPayload?.message ?? backendPayload?.errors ?? error,
        "Failed to create interview",
      ),
      ...(typeof statusCode === "number" ? { statusCode } : {}),
      ...(backendPayload ? { errors: backendPayload.errors } : {}),
    };
  }
}

export async function updateInterview(
  interviewId: string,
  payload: UpdateInterviewPayload,
) {
  try {
    const response = await api.patch(API_URLS.INTERVIEW.BY_ID(interviewId), {
      ...(payload.title ? { title: payload.title.trim() } : {}),
      ...(payload.description !== undefined
        ? { description: toTrimmedOrUndefined(payload.description) }
        : {}),
      ...(payload.interviewType ? { interviewType: payload.interviewType } : {}),
      ...(payload.role ? { role: payload.role.trim() } : {}),
      ...(payload.level !== undefined
        ? { level: toTrimmedOrUndefined(payload.level) }
        : {}),
      ...(payload.techStack
        ? {
            techStack: payload.techStack
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : {}),
      ...(payload.questionCount ? { questionCount: payload.questionCount } : {}),
      ...(payload.durationMinutes
        ? { durationMinutes: payload.durationMinutes }
        : {}),
      ...(payload.visibility ? { visibility: payload.visibility } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.tags ? { tags: payload.tags.map((tag) => tag.trim()).filter(Boolean) } : {}),
      ...(payload.instructions !== undefined
        ? { instructions: toTrimmedOrUndefined(payload.instructions) }
        : {}),
      ...(typeof payload.generateQuestions === "boolean"
        ? { generateQuestions: payload.generateQuestions }
        : {}),
      ...(payload.questions
        ? { questions: payload.questions.map((item) => item.trim()).filter(Boolean) }
        : {}),
    });
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to update interview",
    };
  }
}

export async function deleteInterview(interviewId: string) {
  try {
    const response = await api.delete(API_URLS.INTERVIEW.BY_ID(interviewId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to delete interview",
    };
  }
}

export async function startInterviewSession(
  interviewId: string,
  payload?: StartInterviewSessionPayload,
) {
  try {
    const response = await api.post(API_URLS.INTERVIEW.SESSIONS(interviewId), {
      mode: payload?.mode ?? "web",
      metadata: payload?.metadata ?? {},
    });
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to start interview session",
    };
  }
}

export async function getVoiceInterviewCreationConfig() {
  try {
    const response = await api.post(API_URLS.INTERVIEW.VOICE_CREATION_CONFIG);
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to load voice creation config",
    };
  }
}

export async function completeInterviewSession(
  interviewId: string,
  sessionId: string,
  payload: CompleteInterviewSessionPayload,
) {
  try {
    const response = await api.patch(
      API_URLS.INTERVIEW.SESSION_COMPLETE(interviewId, sessionId),
      {
        status: payload.status ?? "completed",
        transcript: payload.transcript ?? [],
        recordingUrl: toTrimmedOrUndefined(payload.recordingUrl),
        vapiCallId: toTrimmedOrUndefined(payload.vapiCallId),
        durationSeconds: payload.durationSeconds,
        generateEvaluation:
          typeof payload.generateEvaluation === "boolean"
            ? payload.generateEvaluation
            : true,
      },
    );
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to complete interview session",
    };
  }
}

export async function listMyInterviewSessions(
  interviewId: string,
  query?: { page?: number; size?: number },
) {
  try {
    const response = await api.get(API_URLS.INTERVIEW.MY_SESSIONS(interviewId), {
      params: {
        page: query?.page,
        size: query?.size,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to load interview sessions",
    };
  }
}

export async function getInterviewSessionFeedback(sessionId: string) {
  try {
    const response = await api.get(API_URLS.INTERVIEW.SESSION_FEEDBACK(sessionId));
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to load interview feedback",
    };
  }
}

export async function getInterviewAnalytics(
  interviewId: string,
  query?: { page?: number; size?: number },
) {
  try {
    const response = await api.get(API_URLS.INTERVIEW.ANALYTICS(interviewId), {
      params: {
        page: query?.page,
        size: query?.size,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Failed to load interview analytics",
    };
  }
}

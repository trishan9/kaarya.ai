"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";
import type { TJobFeed } from "@/lib/definitions";

export type JobListQuery = {
  page?: number;
  size?: number;
  feed?: TJobFeed;
  search?: string;
  status?: "open" | "closed" | "draft";
  visibility?: "global" | "college_only";
  companyId?: string;
  collegeId?: string;
  location?: string;
  employmentType?: string;
  engagementType?: string;
  workMode?: "remote" | "onsite" | "hybrid";
  remoteOnly?: boolean;
  createdFrom?: string;
  createdTo?: string;
};

export type CreateJobPostingPayload = {
  companyId?: string;
  collegeId?: string;
  visibility?: "global" | "college_only";
  title: string;
  description: string;
  location?: string;
  employmentType?: string;
  engagementType?: string;
  workMode?: "remote" | "onsite" | "hybrid";
  salaryRange?: string;
  requirements?: Record<string, unknown>;
  deadline: string;
  status?: "open" | "closed" | "draft";
};

export type UpdateJobPostingPayload = {
  title?: string;
  description?: string;
  location?: string;
  employmentType?: string;
  engagementType?: string;
  workMode?: "remote" | "onsite" | "hybrid";
  salaryRange?: string;
  requirements?: Record<string, unknown>;
  deadline?: string;
  status?: "open" | "closed" | "draft";
  visibility?: "global" | "college_only";
};

export type JobApplicationPayload = {
  resumeFile?: File;
  resumeId?: string;
  coverLetter?: string;
  portfolioLinks?: string[];
};

export type UpdateJobApplicationPayload = {
  status?:
    | "applied"
    | "reviewing"
    | "shortlisted"
    | "interview_scheduled"
    | "accepted"
    | "rejected"
    | "withdrawn";
  interviewScheduledAt?: string;
  interviewNote?: string;
};

export type MyApplicationsQuery = {
  page?: number;
  size?: number;
  status?:
    | "applied"
    | "reviewing"
    | "shortlisted"
    | "interview_scheduled"
    | "accepted"
    | "rejected"
    | "withdrawn";
  fromDate?: string;
  toDate?: string;
};

export type MyApplicationsSummaryQuery = {
  month?: string;
  statuses?: Array<
    | "applied"
    | "reviewing"
    | "shortlisted"
    | "interview_scheduled"
    | "accepted"
    | "rejected"
    | "withdrawn"
  >;
};

export type MyResumesQuery = {
  page?: number;
  size?: number;
};

const toTrimmedOrUndefined = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export async function getJobs(query?: JobListQuery) {
  try {
    const response = await api.get(API_URLS.JOB.LIST, {
      params: {
        page: query?.page,
        size: query?.size,
        feed: query?.feed,
        search: toTrimmedOrUndefined(query?.search),
        status: query?.status,
        visibility: query?.visibility,
        companyId: query?.companyId,
        collegeId: query?.collegeId,
        location: toTrimmedOrUndefined(query?.location),
        employmentType: toTrimmedOrUndefined(query?.employmentType),
        engagementType: toTrimmedOrUndefined(query?.engagementType),
        workMode: query?.workMode,
        remoteOnly: query?.remoteOnly,
        createdFrom: query?.createdFrom,
        createdTo: query?.createdTo,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to fetch jobs";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getJobById(jobId: string) {
  try {
    const response = await api.get(API_URLS.JOB.BY_ID(jobId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message || error.message || "Failed to fetch job";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function createJobPosting(payload: CreateJobPostingPayload) {
  try {
    const response = await api.post(API_URLS.JOB.LIST, {
      companyId: payload.companyId,
      collegeId: payload.collegeId,
      visibility: payload.visibility,
      title: payload.title.trim(),
      description: payload.description.trim(),
      location: toTrimmedOrUndefined(payload.location),
      employmentType: toTrimmedOrUndefined(payload.employmentType),
      engagementType: toTrimmedOrUndefined(payload.engagementType),
      workMode: payload.workMode,
      salaryRange: toTrimmedOrUndefined(payload.salaryRange),
      requirements: payload.requirements ?? {},
      deadline: payload.deadline,
      status: payload.status,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to create job posting";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateJobPosting(
  jobId: string,
  payload: UpdateJobPostingPayload,
) {
  try {
    const response = await api.patch(API_URLS.JOB.BY_ID(jobId), {
      title: toTrimmedOrUndefined(payload.title),
      description: toTrimmedOrUndefined(payload.description),
      location: toTrimmedOrUndefined(payload.location),
      employmentType: toTrimmedOrUndefined(payload.employmentType),
      engagementType: toTrimmedOrUndefined(payload.engagementType),
      workMode: payload.workMode,
      salaryRange: toTrimmedOrUndefined(payload.salaryRange),
      requirements: payload.requirements,
      deadline: payload.deadline,
      status: payload.status,
      visibility: payload.visibility,
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update job posting";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function recordJobView(jobId: string) {
  try {
    const response = await api.post(API_URLS.JOB.VIEW(jobId));
    return response.data;
  } catch (primaryError: Error | any) {
    try {
      const fallbackResponse = await api.patch(API_URLS.JOB.VIEW(jobId), {});
      return fallbackResponse.data;
    } catch (error: Error | any) {
      const errorMessage =
        error?.response?.data?.message ||
        primaryError?.response?.data?.message ||
        error.message ||
        "Failed to record job view";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

export async function getJobApplications(jobId: string, params?: { page?: number; size?: number }) {
  try {
    const response = await api.get(API_URLS.APPLICATION.APPLICATIONS_BY_JOB(jobId), {
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
      "Failed to fetch job applications";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getMyApplications(params?: MyApplicationsQuery) {
  try {
    const response = await api.get(API_URLS.APPLICATION.MY_APPLICATIONS, {
      params: {
        page: params?.page,
        size: params?.size,
        status: params?.status,
        fromDate: params?.fromDate,
        toDate: params?.toDate,
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch my applications";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getMyApplicationsSummary(
  params?: MyApplicationsSummaryQuery,
) {
  try {
    const response = await api.get(API_URLS.APPLICATION.MY_APPLICATIONS_SUMMARY, {
      params: {
        month: params?.month,
        statuses: params?.statuses?.join(","),
      },
    });
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch applications summary";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getMyApplicationForJob(jobId: string) {
  try {
    const response = await api.get(API_URLS.APPLICATION.MY_APPLICATION_BY_JOB(jobId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch your application for this job";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function getMyResumes(params?: MyResumesQuery) {
  try {
    const response = await api.get(API_URLS.APPLICATION.RESUMES_ME, {
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
      "Failed to fetch resumes";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function deleteMyResume(resumeId: string) {
  try {
    const response = await api.delete(API_URLS.APPLICATION.RESUME_BY_ID(resumeId));
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to delete resume";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function uploadMyResume(file: File) {
  try {
    const formData = new FormData();
    formData.append("resume", file);
    const response = await api.post(
      API_URLS.APPLICATION.RESUMES_ME,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to upload resume";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function createJobApplication(
  jobId: string,
  payload: JobApplicationPayload,
) {
  try {
    const hasResumeFile = payload.resumeFile instanceof File;
    const hasResumeId = typeof payload.resumeId === "string" && payload.resumeId.trim().length > 0;
    if (!hasResumeFile && !hasResumeId) {
      return {
        success: false,
        message: "Choose a resume from your library or upload a new file.",
      };
    }
    if (hasResumeFile && hasResumeId) {
      return {
        success: false,
        message: "Choose either resume upload or existing resume.",
      };
    }

    const coverLetter = toTrimmedOrUndefined(payload.coverLetter);
    const portfolioLinks = (payload.portfolioLinks ?? [])
      .map((link) => link.trim())
      .filter(Boolean);

    const formData = new FormData();
    if (hasResumeFile) {
      formData.append("resume", payload.resumeFile as File);
    }
    if (hasResumeId) {
      formData.append("resumeId", payload.resumeId!.trim());
    }

    if (coverLetter) {
      formData.append("coverLetter", coverLetter);
    }

    for (const link of portfolioLinks) {
      formData.append("portfolioLinks", link);
    }

    const response = await api.post(
      API_URLS.APPLICATION.APPLICATIONS_BY_JOB(jobId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to submit application";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateJobApplication(
  jobId: string,
  applicationId: string,
  payload: UpdateJobApplicationPayload,
) {
  try {
    const response = await api.patch(
      API_URLS.APPLICATION.APPLICATION_BY_JOB_AND_ID(jobId, applicationId),
      {
        status: payload.status,
        interviewScheduledAt: payload.interviewScheduledAt,
        interviewNote: toTrimmedOrUndefined(payload.interviewNote),
      },
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update application";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

export async function updateApplicationResumeActivity(
  jobId: string,
  applicationId: string,
  action: "viewed" | "downloaded",
) {
  try {
    const response = await api.patch(
      API_URLS.APPLICATION.APPLICATION_RESUME_ACTIVITY(jobId, applicationId),
      {
        action,
      },
    );
    return response.data;
  } catch (error: Error | any) {
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update resume activity";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

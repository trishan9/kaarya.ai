"use server";

import { api } from "@/lib/api/axios-instance";
import { API_URLS } from "@/lib/api/endpoints";

export type ResumeBuilderContent = {
  personalInfo?: {
    firstName?: string | null;
    lastName?: string | null;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
  } | null;
  professionalSummary?: string | null;
  targetRole?: string | null;
  experience?: Array<{
    id?: string;
    company?: string | null;
    position?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    currentlyWorking?: boolean;
    bulletPoints?: string[];
  }>;
  education?: Array<{
    id?: string;
    school?: string | null;
    degree?: string | null;
    major?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    coursework?: string | null;
  }>;
  skills?: string[];
  projects?: Array<{
    id?: string;
    name?: string | null;
    description?: string | null;
    url?: string | null;
    technologies?: string | null;
  }>;
  achievements?: Array<{
    id?: string;
    text?: string | null;
  }>;
};

export type ResumeBuilderTemplateId =
  | "professional"
  | "modern"
  | "minimal"
  | "executive";

export type ResumeBuilderListItem = {
  id: string;
  title: string;
  targetRole: string | null;
  templateId: string;
  generatedResumeId: string | null;
  updatedAt: string;
};

export type ResumeBuilderDetail = ResumeBuilderListItem & {
  content: ResumeBuilderContent;
  createdAt: string;
};

export type AtsScanSuggestion = { type: "good" | "improve"; tip: string; explanation?: string };
export type AtsScanCategory = { score: number; tips: AtsScanSuggestion[] };
export type AtsScanResult = {
  documentType?: "resume" | "not_resume";
  classificationReason?: string;
  overallScore: number;
  ATS: AtsScanCategory;
  toneAndStyle?: AtsScanCategory;
  content?: AtsScanCategory;
  structure?: AtsScanCategory;
  skills?: AtsScanCategory;
};
export type ResumeAiSuggestions = {
  targetRole?: string;
  jobTitle?: string;
  professionalSummary?: string;
  skills?: string[];
};

const RB = API_URLS.RESUME_BUILDER;

function getData<T>(res: { data?: { data?: T } }): T {
  const d = res?.data?.data;
  if (d === undefined) throw new Error("Invalid API response");
  return d as T;
}

function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: { message?: string }; statusText?: string } })
      .response;
    const msg = res?.data?.message ?? res?.statusText;
    if (typeof msg === "string" && msg) return msg;
  }
  return err instanceof Error ? err.message : "Request failed.";
}

export async function createResumeDraft(payload: {
  title?: string;
  targetRole?: string | null;
  templateId?: ResumeBuilderTemplateId;
  content?: ResumeBuilderContent;
}) {
  const res = await api.post<{ data: ResumeBuilderDetail }>(RB.BASE, payload);
  return getData<ResumeBuilderDetail>(res);
}

export async function listResumeBuilders(params?: { page?: number; size?: number }) {
  const res = await api.get<{ data: { items: ResumeBuilderListItem[]; total: number; page: number; size: number } }>(
    RB.LIST,
    { params }
  );
  return getData<{ items: ResumeBuilderListItem[]; total: number; page: number; size: number }>(res);
}

export async function getResumeBuilder(id: string) {
  const res = await api.get<{ data: ResumeBuilderDetail }>(RB.BY_ID(id));
  return getData<ResumeBuilderDetail>(res);
}

export async function updateResumeBuilder(
  id: string,
  payload: {
    title?: string;
    targetRole?: string | null;
    templateId?: ResumeBuilderTemplateId;
    content?: ResumeBuilderContent;
  }
) {
  try {
    const res = await api.patch<{ data: ResumeBuilderDetail }>(RB.BY_ID(id), payload);
    return getData<ResumeBuilderDetail>(res);
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function deleteResumeBuilder(id: string) {
  try {
    await api.delete(RB.BY_ID(id));
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function generateResumePdf(id: string) {
  const res = await api.post<{ data: { pdfUrl: string } }>(RB.GENERATE_PDF(id));
  return getData<{ pdfUrl: string }>(res);
}

export async function saveResumeToMyResumes(id: string) {
  const res = await api.post<{ data: { resumeId: string; pdfUrl: string; fileName: string } }>(
    RB.SAVE(id)
  );
  return getData<{ resumeId: string; pdfUrl: string; fileName: string }>(res);
}

export async function generateAiSummary(payload: {
  targetRole?: string | null;
  professionalSummary?: string | null;
  experience?: ResumeBuilderContent["experience"];
  education?: ResumeBuilderContent["education"];
  skills?: string[];
}) {
  try {
    const res = await api.post<{ data: { summary: string } }>(RB.AI_SUMMARY, payload);
    return getData<{ summary: string }>(res);
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function generateExperienceBullets(payload: {
  targetRole?: string | null;
  position?: string | null;
  company?: string | null;
  description: string;
}) {
  try {
    const res = await api.post<{ data: { bullets: string[] } }>(
      RB.AI_EXPERIENCE_BULLETS,
      payload
    );
    return getData<{ bullets: string[] }>(res);
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function generateAiSuggestions(payload: {
  focus: "setup" | "personal" | "summary" | "skills";
  targetRole?: string | null;
  personalInfo?: ResumeBuilderContent["personalInfo"];
  professionalSummary?: string | null;
  experience?: ResumeBuilderContent["experience"];
  education?: ResumeBuilderContent["education"];
  skills?: string[];
}) {
  try {
    const res = await api.post<{ data: ResumeAiSuggestions }>(RB.AI_SUGGESTIONS, payload);
    return getData<ResumeAiSuggestions>(res);
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function atsScanResume(formData: FormData): Promise<AtsScanResult> {
  const file = formData.get("resume") as File | null;
  if (!file || !(file instanceof File)) throw new Error("Resume file is required.");
  try {
    const res = await api.post<{ data: AtsScanResult }>(RB.ATS_SCAN, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return getData<AtsScanResult>(res);
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

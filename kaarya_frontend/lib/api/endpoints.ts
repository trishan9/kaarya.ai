export const API_URLS = {
  BASE: process.env.NEXT_PUBLIC_API_BASE_URL,
  AUTH: {
    SIGNUP: "/auth/signup",
    SIGNIN: "/auth/login",
    OAUTH_AUTHORIZE: (provider: "google" | "github") =>
      `/auth/oauth/${provider}/authorize`,
    OAUTH_LINK_AUTHORIZE: (provider: "google" | "github") =>
      `/auth/oauth/${provider}/link/authorize`,
    OAUTH_EXCHANGE: "/auth/oauth/exchange",
    OAUTH_LINK_COMPLETE: "/auth/oauth/link/complete",
    OAUTH_LINKED_ACCOUNTS: "/auth/oauth/accounts",
    OAUTH_UNLINK: (provider: "google" | "github") =>
      `/auth/oauth/${provider}/unlink`,
    ME: "/auth/me",
    UPDATE_ME: "/auth/update-me",
    PASSWORD_RESET_REQUEST: "/auth/password-reset/request",
    PASSWORD_RESET_VERIFY: "/auth/password-reset/verify",
    PASSWORD_RESET_CONFIRM: "/auth/password-reset/confirm",
    CHANGE_PASSWORD: "/auth/change-password",
    CERTIFICATION_UPLOAD: "/auth/candidate-profile/certifications/upload",
  },
  ADMIN: {
    USERS: "/admin/users",
    USERS_ANALYTICS: "admin/users/analytics",
    USER_BY_ID: (id: string) => `/admin/users/${id}`,
  },
  COMPANY: {
    LIST: "/companies",
    BY_ID: (id: string) => `/companies/${id}`,
    ME: "/companies/me",
    WORKSPACES_ME: "/companies/workspaces/me",
    JOIN_BY_CODE: "/companies/join-by-code",
    INVITE_CODE_RESET: (id: string) => `/companies/${id}/invite-code/reset`,
    INVITES: (id: string) => `/companies/${id}/invites`,
    RECRUITERS: (id: string) => `/companies/${id}/recruiters`,
    RECRUITER_BY_ID: (id: string, recruiterId: string) =>
      `/companies/${id}/recruiters/${recruiterId}`,
  },
  COLLEGE: {
    LIST: "/colleges",
    BY_ID: (id: string) => `/colleges/${id}`,
    ME: "/colleges/me",
    WORKSPACES_ME: "/colleges/workspaces/me",
    JOIN_BY_CODE: "/colleges/join-by-code",
    INVITE_CODE_RESET: (id: string) => `/colleges/${id}/invite-code/reset`,
    INVITES: (id: string) => `/colleges/${id}/invites`,
    STUDENTS: (id: string) => `/colleges/${id}/students`,
    STUDENT_BY_ID: (id: string, studentId: string) =>
      `/colleges/${id}/students/${studentId}`,
    METRICS: (id: string) => `/colleges/${id}/metrics`,
  },
  JOB: {
    LIST: "/jobs",
    BY_ID: (id: string) => `/jobs/${id}`,
    METRICS: (id: string) => `/jobs/${id}/metrics`,
    VIEW: (id: string) => `/jobs/${id}/view`,
  },
  APPLICATION: {
    MY_APPLICATIONS: "/applications/me",
    MY_APPLICATIONS_SUMMARY: "/applications/me/summary",
    MY_APPLICATION_BY_JOB: (jobId: string) => `/applications/job/${jobId}/me`,
    RESUMES_ME: "/applications/resumes/me",
    RESUME_BY_ID: (resumeId: string) => `/applications/resumes/${resumeId}`,
    APPLICATIONS_BY_JOB: (jobId: string) => `/applications/jobs/${jobId}`,
    APPLICATION_BY_JOB_AND_ID: (jobId: string, applicationId: string) =>
      `/applications/jobs/${jobId}/${applicationId}`,
    APPLICATION_RESUME_ACTIVITY: (jobId: string, applicationId: string) =>
      `/applications/jobs/${jobId}/${applicationId}/resume-activity`,
  },
  LEADERBOARD: {
    LIST: "/leaderboard",
  },
  BOOKMARK: {
    ME: "/bookmarks/me",
    JOB: (jobId: string) => `/bookmarks/jobs/${jobId}`,
    INTERVIEW: (interviewId: string) => `/bookmarks/interviews/${interviewId}`,
  },
  INTERVIEW: {
    LIST: "/interviews",
    BY_ID: (id: string) => `/interviews/${id}`,
    VOICE_CREATION_CONFIG: "/interviews/vapi/creation-config",
    SESSIONS: (id: string) => `/interviews/${id}/sessions`,
    SESSION_COMPLETE: (id: string, sessionId: string) =>
      `/interviews/${id}/sessions/${sessionId}/complete`,
    MY_SESSIONS: (id: string) => `/interviews/${id}/sessions/me`,
    SESSION_FEEDBACK: (sessionId: string) =>
      `/interviews/sessions/${sessionId}/feedback`,
    ANALYTICS: (id: string) => `/interviews/${id}/analytics`,
  },
  RESUME_BUILDER: {
    BASE: "/resume-builder",
    LIST: "/resume-builder/list",
    BY_ID: (id: string) => `/resume-builder/${id}`,
    GENERATE_PDF: (id: string) => `/resume-builder/${id}/generate-pdf`,
    SAVE: (id: string) => `/resume-builder/${id}/save`,
    AI_SUMMARY: "/resume-builder/ai/summary",
    AI_EXPERIENCE_BULLETS: "/resume-builder/ai/experience-bullets",
    AI_SUGGESTIONS: "/resume-builder/ai/suggestions",
    ATS_SCAN: "/resume-builder/ats-scan",
  },
};

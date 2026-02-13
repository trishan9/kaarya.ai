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
  JOB: {
    LIST: "/jobs",
    BY_ID: (id: string) => `/jobs/${id}`,
    METRICS: (id: string) => `/jobs/${id}/metrics`,
    VIEW: (id: string) => `/jobs/${id}/view`,
  },
  APPLICATION: {
    MY_APPLICATIONS: "/applications/me",
    MY_APPLICATION_BY_JOB: (jobId: string) => `/applications/job/${jobId}/me`,
    RESUMES_ME: "/applications/resumes/me",
    APPLICATIONS_BY_JOB: (jobId: string) => `/applications/jobs/${jobId}`,
    APPLICATION_BY_JOB_AND_ID: (jobId: string, applicationId: string) =>
      `/applications/jobs/${jobId}/${applicationId}`,
    APPLICATION_RESUME_ACTIVITY: (jobId: string, applicationId: string) =>
      `/applications/jobs/${jobId}/${applicationId}/resume-activity`,
  },
};

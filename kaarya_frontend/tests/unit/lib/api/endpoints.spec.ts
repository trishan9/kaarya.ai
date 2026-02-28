import { API_URLS } from "@/lib/api/endpoints";

describe("API_URLS endpoints", () => {
  it("builds auth and oauth endpoints", () => {
    expect(API_URLS.AUTH.SIGNIN).toBe("/auth/login");
    expect(API_URLS.AUTH.SIGNUP).toBe("/auth/signup");
    expect(API_URLS.AUTH.OAUTH_EXCHANGE).toBe("/auth/oauth/exchange");
    expect(API_URLS.AUTH.OAUTH_LINK_COMPLETE).toBe("/auth/oauth/link/complete");
    expect(API_URLS.AUTH.OAUTH_LINKED_ACCOUNTS).toBe("/auth/oauth/accounts");
    expect(API_URLS.AUTH.ME).toBe("/auth/me");
    expect(API_URLS.AUTH.UPDATE_ME).toBe("/auth/update-me");
    expect(API_URLS.AUTH.PASSWORD_RESET_REQUEST).toBe(
      "/auth/password-reset/request",
    );
    expect(API_URLS.AUTH.PASSWORD_RESET_VERIFY).toBe(
      "/auth/password-reset/verify",
    );
    expect(API_URLS.AUTH.PASSWORD_RESET_CONFIRM).toBe(
      "/auth/password-reset/confirm",
    );
    expect(API_URLS.AUTH.CHANGE_PASSWORD).toBe("/auth/change-password");
    expect(API_URLS.AUTH.CERTIFICATION_UPLOAD).toBe(
      "/auth/candidate-profile/certifications/upload",
    );
    expect(API_URLS.AUTH.OAUTH_AUTHORIZE("google")).toBe(
      "/auth/oauth/google/authorize",
    );
    expect(API_URLS.AUTH.OAUTH_LINK_AUTHORIZE("google")).toBe(
      "/auth/oauth/google/link/authorize",
    );
    expect(API_URLS.AUTH.OAUTH_UNLINK("github")).toBe(
      "/auth/oauth/github/unlink",
    );
  });

  it("builds dynamic company/college/job/application endpoints", () => {
    expect(API_URLS.ADMIN.USERS).toBe("/admin/users");
    expect(API_URLS.ADMIN.USERS_ANALYTICS).toBe("admin/users/analytics");
    expect(API_URLS.ADMIN.USER_BY_ID("u1")).toBe("/admin/users/u1");

    expect(API_URLS.COMPANY.LIST).toBe("/companies");
    expect(API_URLS.COMPANY.BY_ID("c1")).toBe("/companies/c1");
    expect(API_URLS.COMPANY.ME).toBe("/companies/me");
    expect(API_URLS.COMPANY.WORKSPACES_ME).toBe("/companies/workspaces/me");
    expect(API_URLS.COMPANY.JOIN_BY_CODE).toBe("/companies/join-by-code");
    expect(API_URLS.COMPANY.INVITE_CODE_RESET("c1")).toBe(
      "/companies/c1/invite-code/reset",
    );
    expect(API_URLS.COMPANY.INVITES("c1")).toBe("/companies/c1/invites");
    expect(API_URLS.COMPANY.RECRUITERS("c1")).toBe("/companies/c1/recruiters");
    expect(API_URLS.COMPANY.RECRUITER_BY_ID("c1", "r1")).toBe(
      "/companies/c1/recruiters/r1",
    );

    expect(API_URLS.COLLEGE.LIST).toBe("/colleges");
    expect(API_URLS.COLLEGE.BY_ID("cl1")).toBe("/colleges/cl1");
    expect(API_URLS.COLLEGE.ME).toBe("/colleges/me");
    expect(API_URLS.COLLEGE.WORKSPACES_ME).toBe("/colleges/workspaces/me");
    expect(API_URLS.COLLEGE.JOIN_BY_CODE).toBe("/colleges/join-by-code");
    expect(API_URLS.COLLEGE.INVITE_CODE_RESET("cl1")).toBe(
      "/colleges/cl1/invite-code/reset",
    );
    expect(API_URLS.COLLEGE.INVITES("cl1")).toBe("/colleges/cl1/invites");
    expect(API_URLS.COLLEGE.STUDENTS("cl1")).toBe("/colleges/cl1/students");
    expect(API_URLS.COLLEGE.STUDENT_BY_ID("cl1", "s1")).toBe(
      "/colleges/cl1/students/s1",
    );
    expect(API_URLS.COLLEGE.METRICS("cl1")).toBe("/colleges/cl1/metrics");

    expect(API_URLS.JOB.LIST).toBe("/jobs");
    expect(API_URLS.JOB.BY_ID("j1")).toBe("/jobs/j1");
    expect(API_URLS.JOB.METRICS("j1")).toBe("/jobs/j1/metrics");
    expect(API_URLS.JOB.VIEW("j1")).toBe("/jobs/j1/view");

    expect(API_URLS.APPLICATION.MY_APPLICATIONS).toBe("/applications/me");
    expect(API_URLS.APPLICATION.MY_APPLICATIONS_SUMMARY).toBe(
      "/applications/me/summary",
    );
    expect(API_URLS.APPLICATION.MY_APPLICATION_BY_JOB("j1")).toBe(
      "/applications/job/j1/me",
    );
    expect(API_URLS.APPLICATION.RESUMES_ME).toBe("/applications/resumes/me");
    expect(API_URLS.APPLICATION.RESUME_BY_ID("r1")).toBe("/applications/resumes/r1");
    expect(API_URLS.APPLICATION.APPLICATIONS_BY_JOB("j1")).toBe(
      "/applications/jobs/j1",
    );
    expect(API_URLS.APPLICATION.APPLICATION_BY_JOB_AND_ID("j1", "a1")).toBe(
      "/applications/jobs/j1/a1",
    );
    expect(API_URLS.APPLICATION.APPLICATION_RESUME_ACTIVITY("j1", "a1")).toBe(
      "/applications/jobs/j1/a1/resume-activity",
    );
  });

  it("builds interview/resource/stream endpoints", () => {
    expect(API_URLS.LEADERBOARD.LIST).toBe("/leaderboard");

    expect(API_URLS.BOOKMARK.ME).toBe("/bookmarks/me");
    expect(API_URLS.BOOKMARK.JOB("j1")).toBe("/bookmarks/jobs/j1");
    expect(API_URLS.BOOKMARK.INTERVIEW("i1")).toBe("/bookmarks/interviews/i1");

    expect(API_URLS.INTERVIEW.LIST).toBe("/interviews");
    expect(API_URLS.INTERVIEW.BY_ID("i1")).toBe("/interviews/i1");
    expect(API_URLS.INTERVIEW.VOICE_CREATION_CONFIG).toBe(
      "/interviews/vapi/creation-config",
    );
    expect(API_URLS.INTERVIEW.SESSIONS("i1")).toBe("/interviews/i1/sessions");
    expect(API_URLS.INTERVIEW.SESSION_COMPLETE("i1", "s1")).toBe(
      "/interviews/i1/sessions/s1/complete",
    );
    expect(API_URLS.INTERVIEW.MY_SESSIONS("i1")).toBe("/interviews/i1/sessions/me");
    expect(API_URLS.INTERVIEW.SESSION_FEEDBACK("s1")).toBe(
      "/interviews/sessions/s1/feedback",
    );
    expect(API_URLS.INTERVIEW.ANALYTICS("i1")).toBe("/interviews/i1/analytics");

    expect(API_URLS.RESUME_BUILDER.BASE).toBe("/resume-builder");
    expect(API_URLS.RESUME_BUILDER.LIST).toBe("/resume-builder/list");
    expect(API_URLS.RESUME_BUILDER.BY_ID("r1")).toBe("/resume-builder/r1");
    expect(API_URLS.RESUME_BUILDER.GENERATE_PDF("r1")).toBe(
      "/resume-builder/r1/generate-pdf",
    );
    expect(API_URLS.RESUME_BUILDER.SAVE("r1")).toBe("/resume-builder/r1/save");
    expect(API_URLS.RESUME_BUILDER.AI_SUMMARY).toBe("/resume-builder/ai/summary");
    expect(API_URLS.RESUME_BUILDER.AI_EXPERIENCE_BULLETS).toBe(
      "/resume-builder/ai/experience-bullets",
    );
    expect(API_URLS.RESUME_BUILDER.AI_SUGGESTIONS).toBe(
      "/resume-builder/ai/suggestions",
    );
    expect(API_URLS.RESUME_BUILDER.ATS_SCAN).toBe("/resume-builder/ats-scan");

    expect(API_URLS.RESOURCE.LIST).toBe("/resources");
    expect(API_URLS.RESOURCE.BY_ID("rc1")).toBe("/resources/rc1");

    expect(API_URLS.STREAM.CHAT_TOKEN).toBe("/stream/chat-token");
    expect(API_URLS.STREAM.VIDEO_TOKEN).toBe("/stream/video-token");
    expect(API_URLS.STREAM.CONFIG).toBe("/stream/config");
    expect(API_URLS.STREAM.ENSURE_CHANNELS).toBe("/stream/ensure-channels");
    expect(API_URLS.STREAM.ENSURE_CHANNEL_WITH).toBe("/stream/ensure-channel-with");
  });
});

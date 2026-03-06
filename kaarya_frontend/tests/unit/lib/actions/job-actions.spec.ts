import {
  createJobApplication,
  createJobPosting,
  deleteMyResume,
  getJobApplications,
  getJobById,
  getJobs,
  getMyApplicationForJob,
  getMyApplications,
  getMyApplicationsSummary,
  getMyResumes,
  recordJobView,
  updateApplicationResumeActivity,
  updateJobApplication,
  updateJobPosting,
  uploadMyResume,
} from "@/lib/actions/job-actions";
import { API_URLS } from "@/lib/api/endpoints";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/api/axios-instance", () => ({
  api: apiMock,
}));

const responseError = (message: string) => ({
  response: {
    data: { message },
  },
});

describe("job actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches jobs with normalized query params", async () => {
    apiMock.get.mockResolvedValue({ data: { success: true } });

    await getJobs({
      page: 1,
      size: 20,
      search: "  backend ",
      location: " remote ",
      employmentType: " full-time ",
      engagementType: " internship ",
      remoteOnly: true,
      createdFrom: "2025-01-01",
      createdTo: "2025-02-01",
    });

    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.JOB.LIST, {
      params: expect.objectContaining({
        page: 1,
        size: 20,
        search: "backend",
        location: "remote",
        employmentType: "full-time",
        engagementType: "internship",
        remoteOnly: true,
        createdFrom: "2025-01-01",
        createdTo: "2025-02-01",
      }),
    });

    await getJobs({
      search: "   ",
      location: "   ",
      employmentType: "   ",
      engagementType: "   ",
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, API_URLS.JOB.LIST, {
      params: expect.objectContaining({
        search: undefined,
        location: undefined,
        employmentType: undefined,
        engagementType: undefined,
      }),
    });
  });

  it("returns getJobs error with response message, runtime message, and fallback", async () => {
    apiMock.get.mockRejectedValueOnce(responseError("from-response"));
    expect(await getJobs()).toEqual({ success: false, message: "from-response" });

    apiMock.get.mockRejectedValueOnce(new Error("from-runtime"));
    expect(await getJobs()).toEqual({ success: false, message: "from-runtime" });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getJobs()).toEqual({
      success: false,
      message: "Failed to fetch jobs",
    });
  });

  it("gets single job by id and handles error branches", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, id: "job-1" } });
    expect(await getJobById("job-1")).toEqual({ success: true, id: "job-1" });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.JOB.BY_ID("job-1"));

    apiMock.get.mockRejectedValueOnce(responseError("job-response"));
    expect(await getJobById("job-1")).toEqual({
      success: false,
      message: "job-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("job-runtime"));
    expect(await getJobById("job-1")).toEqual({
      success: false,
      message: "job-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getJobById("job-1")).toEqual({
      success: false,
      message: "Failed to fetch job",
    });
  });

  it("creates job posting payload with defaults and provided requirements", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true } });

    await createJobPosting({
      title: "  Backend Engineer  ",
      description: "  Build APIs and improve reliability.  ",
      location: "  Remote ",
      employmentType: " Full-time ",
      engagementType: " Internship ",
      salaryRange: " 100k-140k ",
      workMode: "remote",
      deadline: "2030-01-01T00:00:00.000Z",
    });

    expect(apiMock.post).toHaveBeenNthCalledWith(1, API_URLS.JOB.LIST, {
      companyId: undefined,
      collegeId: undefined,
      visibility: undefined,
      title: "Backend Engineer",
      description: "Build APIs and improve reliability.",
      location: "Remote",
      employmentType: "Full-time",
      engagementType: "Internship",
      workMode: "remote",
      salaryRange: "100k-140k",
      requirements: {},
      deadline: "2030-01-01T00:00:00.000Z",
      status: undefined,
    });

    await createJobPosting({
      title: "One",
      description: "Two",
      deadline: "2030-01-02T00:00:00.000Z",
      requirements: { years: 4 },
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(2, API_URLS.JOB.LIST, {
      companyId: undefined,
      collegeId: undefined,
      visibility: undefined,
      title: "One",
      description: "Two",
      location: undefined,
      employmentType: undefined,
      engagementType: undefined,
      workMode: undefined,
      salaryRange: undefined,
      requirements: { years: 4 },
      deadline: "2030-01-02T00:00:00.000Z",
      status: undefined,
    });
  });

  it("returns createJobPosting error with response message, runtime message, and fallback", async () => {
    apiMock.post.mockRejectedValueOnce(responseError("create-response"));
    expect(
      await createJobPosting({
        title: "a",
        description: "b",
        deadline: "2030-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      success: false,
      message: "create-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("create-runtime"));
    expect(
      await createJobPosting({
        title: "a",
        description: "b",
        deadline: "2030-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      success: false,
      message: "create-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(
      await createJobPosting({
        title: "a",
        description: "b",
        deadline: "2030-01-01T00:00:00.000Z",
      }),
    ).toEqual({
      success: false,
      message: "Failed to create job posting",
    });
  });

  it("updates job posting payload with trimmed values", async () => {
    apiMock.patch.mockResolvedValue({ data: { success: true } });

    await updateJobPosting("job-1", {
      title: "  Updated title ",
      description: " Updated description ",
      location: " Remote ",
      employmentType: " Full-time ",
      engagementType: " Internship ",
      salaryRange: " 90k-110k ",
    });

    expect(apiMock.patch).toHaveBeenCalledWith(API_URLS.JOB.BY_ID("job-1"), {
      title: "Updated title",
      description: "Updated description",
      location: "Remote",
      employmentType: "Full-time",
      engagementType: "Internship",
      workMode: undefined,
      salaryRange: "90k-110k",
      requirements: undefined,
      deadline: undefined,
      status: undefined,
      visibility: undefined,
    });
  });

  it("returns updateJobPosting error with response message, runtime message, and fallback", async () => {
    apiMock.patch.mockRejectedValueOnce(responseError("update-response"));
    expect(await updateJobPosting("job-1", {})).toEqual({
      success: false,
      message: "update-response",
    });

    apiMock.patch.mockRejectedValueOnce(new Error("update-runtime"));
    expect(await updateJobPosting("job-1", {})).toEqual({
      success: false,
      message: "update-runtime",
    });

    apiMock.patch.mockRejectedValueOnce({});
    expect(await updateJobPosting("job-1", {})).toEqual({
      success: false,
      message: "Failed to update job posting",
    });
  });

  it("records job view directly when post succeeds", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true, via: "post" } });

    const result = await recordJobView("job-9");
    expect(result).toEqual({ success: true, via: "post" });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.JOB.VIEW("job-9"));
    expect(apiMock.patch).not.toHaveBeenCalled();
  });

  it("records job view using patch fallback when post fails", async () => {
    apiMock.post.mockRejectedValueOnce(new Error("post failed"));
    apiMock.patch.mockResolvedValueOnce({
      data: { success: true, message: "patched" },
    });

    const result = await recordJobView("job-9");
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.JOB.VIEW("job-9"));
    expect(apiMock.patch).toHaveBeenCalledWith(API_URLS.JOB.VIEW("job-9"), {});
    expect(result).toEqual({ success: true, message: "patched" });
  });

  it("returns recordJobView error using patch response message", async () => {
    apiMock.post.mockRejectedValueOnce(new Error("post failed"));
    apiMock.patch.mockRejectedValueOnce(responseError("patch-response"));

    const result = await recordJobView("job-8");
    expect(result).toEqual({ success: false, message: "patch-response" });
  });

  it("returns recordJobView error using primary response message", async () => {
    apiMock.post.mockRejectedValueOnce(responseError("primary-response"));
    apiMock.patch.mockRejectedValueOnce(new Error("patch failed"));

    const result = await recordJobView("job-8");
    expect(result).toEqual({ success: false, message: "primary-response" });
  });

  it("returns recordJobView error using patch runtime message and default fallback", async () => {
    apiMock.post.mockRejectedValueOnce(new Error("post failed"));
    apiMock.patch.mockRejectedValueOnce(new Error("patch-runtime"));
    expect(await recordJobView("job-8")).toEqual({
      success: false,
      message: "patch-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    apiMock.patch.mockRejectedValueOnce({});
    expect(await recordJobView("job-8")).toEqual({
      success: false,
      message: "Failed to record job view",
    });
  });

  it("fetches applications by job and handles error branches", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, items: [] } });
    expect(await getJobApplications("job-1", { page: 1, size: 10 })).toEqual({
      success: true,
      items: [],
    });
    expect(apiMock.get).toHaveBeenCalledWith(
      API_URLS.APPLICATION.APPLICATIONS_BY_JOB("job-1"),
      { params: { page: 1, size: 10 } },
    );

    apiMock.get.mockRejectedValueOnce(responseError("apps-response"));
    expect(await getJobApplications("job-1")).toEqual({
      success: false,
      message: "apps-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("apps-runtime"));
    expect(await getJobApplications("job-1")).toEqual({
      success: false,
      message: "apps-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getJobApplications("job-1")).toEqual({
      success: false,
      message: "Failed to fetch job applications",
    });
  });

  it("fetches my applications and handles error branches", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, items: [] } });
    expect(
      await getMyApplications({
        page: 1,
        size: 20,
        status: "applied",
        fromDate: "2025-01-01",
        toDate: "2025-02-01",
      }),
    ).toEqual({
      success: true,
      items: [],
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.APPLICATION.MY_APPLICATIONS, {
      params: {
        page: 1,
        size: 20,
        status: "applied",
        fromDate: "2025-01-01",
        toDate: "2025-02-01",
      },
    });

    apiMock.get.mockRejectedValueOnce(responseError("myapps-response"));
    expect(await getMyApplications()).toEqual({
      success: false,
      message: "myapps-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("myapps-runtime"));
    expect(await getMyApplications()).toEqual({
      success: false,
      message: "myapps-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getMyApplications()).toEqual({
      success: false,
      message: "Failed to fetch my applications",
    });
  });

  it("fetches my applications summary and handles error branches", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, totals: {} } });
    expect(
      await getMyApplicationsSummary({
        month: "2025-02",
        statuses: ["applied", "reviewing"],
      }),
    ).toEqual({
      success: true,
      totals: {},
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      API_URLS.APPLICATION.MY_APPLICATIONS_SUMMARY,
      {
        params: {
          month: "2025-02",
          statuses: "applied,reviewing",
        },
      },
    );

    apiMock.get.mockResolvedValueOnce({ data: { success: true } });
    await getMyApplicationsSummary();
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      API_URLS.APPLICATION.MY_APPLICATIONS_SUMMARY,
      {
        params: {
          month: undefined,
          statuses: undefined,
        },
      },
    );

    apiMock.get.mockRejectedValueOnce(responseError("summary-response"));
    expect(await getMyApplicationsSummary()).toEqual({
      success: false,
      message: "summary-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("summary-runtime"));
    expect(await getMyApplicationsSummary()).toEqual({
      success: false,
      message: "summary-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getMyApplicationsSummary()).toEqual({
      success: false,
      message: "Failed to fetch applications summary",
    });
  });

  it("fetches my application for a job and handles error branches", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, id: "app-1" } });
    expect(await getMyApplicationForJob("job-1")).toEqual({
      success: true,
      id: "app-1",
    });
    expect(apiMock.get).toHaveBeenCalledWith(
      API_URLS.APPLICATION.MY_APPLICATION_BY_JOB("job-1"),
    );

    apiMock.get.mockRejectedValueOnce(responseError("myapp-response"));
    expect(await getMyApplicationForJob("job-1")).toEqual({
      success: false,
      message: "myapp-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("myapp-runtime"));
    expect(await getMyApplicationForJob("job-1")).toEqual({
      success: false,
      message: "myapp-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getMyApplicationForJob("job-1")).toEqual({
      success: false,
      message: "Failed to fetch your application for this job",
    });
  });

  it("fetches my resumes and handles error branches", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, items: [] } });
    expect(await getMyResumes({ page: 1, size: 10 })).toEqual({
      success: true,
      items: [],
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.APPLICATION.RESUMES_ME, {
      params: {
        page: 1,
        size: 10,
      },
    });

    apiMock.get.mockRejectedValueOnce(responseError("resumes-response"));
    expect(await getMyResumes()).toEqual({
      success: false,
      message: "resumes-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("resumes-runtime"));
    expect(await getMyResumes()).toEqual({
      success: false,
      message: "resumes-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getMyResumes()).toEqual({
      success: false,
      message: "Failed to fetch resumes",
    });
  });

  it("deletes my resume and handles error branches", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await deleteMyResume("resume-1")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(
      API_URLS.APPLICATION.RESUME_BY_ID("resume-1"),
    );

    apiMock.delete.mockRejectedValueOnce(responseError("delete-response"));
    expect(await deleteMyResume("resume-1")).toEqual({
      success: false,
      message: "delete-response",
    });

    apiMock.delete.mockRejectedValueOnce(new Error("delete-runtime"));
    expect(await deleteMyResume("resume-1")).toEqual({
      success: false,
      message: "delete-runtime",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await deleteMyResume("resume-1")).toEqual({
      success: false,
      message: "Failed to delete resume",
    });
  });

  it("uploads resume with multipart form data and handles error branches", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    await uploadMyResume(file);

    const [url, formData, config] = apiMock.post.mock.calls[0];
    expect(url).toBe(API_URLS.APPLICATION.RESUMES_ME);
    expect(formData).toBeInstanceOf(FormData);
    expect(Array.from((formData as FormData).entries())).toContainEqual([
      "resume",
      file,
    ]);
    expect(config).toEqual(
      expect.objectContaining({
        headers: {
          "Content-Type": "multipart/form-data",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );

    apiMock.post.mockRejectedValueOnce(responseError("upload-response"));
    expect(await uploadMyResume(file)).toEqual({
      success: false,
      message: "upload-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("upload-runtime"));
    expect(await uploadMyResume(file)).toEqual({
      success: false,
      message: "upload-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await uploadMyResume(file)).toEqual({
      success: false,
      message: "Failed to upload resume",
    });
  });

  it("validates mutually exclusive resume inputs for applications", async () => {
    const missingResume = await createJobApplication("job-1", {});
    expect(missingResume).toEqual({
      success: false,
      message: "Choose a resume from your library or upload a new file.",
    });

    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    const duplicateResume = await createJobApplication("job-1", {
      resumeFile: file,
      resumeId: "resume-id",
    });
    expect(duplicateResume).toEqual({
      success: false,
      message: "Choose either resume upload or existing resume.",
    });
  });

  it("submits application payload with file and appends links/cover letter", async () => {
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, id: "application-1" },
    });

    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    await createJobApplication("job-2", {
      resumeFile: file,
      coverLetter: "  Interested in this role. ",
      portfolioLinks: [" https://portfolio.test ", " "],
    });

    const [url, formData, config] = apiMock.post.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.APPLICATION.APPLICATIONS_BY_JOB("job-2"));
    expect(entries).toContainEqual(["resume", file]);
    expect(entries).toContainEqual(["coverLetter", "Interested in this role."]);
    expect(entries).toContainEqual(["portfolioLinks", "https://portfolio.test"]);
    expect(config).toEqual(
      expect.objectContaining({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  });

  it("submits application payload with resumeId and handles create errors", async () => {
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, id: "application-2" },
    });
    await createJobApplication("job-3", {
      resumeId: "  resume-id  ",
      coverLetter: "   ",
      portfolioLinks: [],
    });

    const [url, formData] = apiMock.post.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.APPLICATION.APPLICATIONS_BY_JOB("job-3"));
    expect(entries).toContainEqual(["resumeId", "resume-id"]);
    expect(entries.some(([key]) => key === "coverLetter")).toBe(false);

    apiMock.post.mockRejectedValueOnce(responseError("apply-response"));
    expect(await createJobApplication("job-3", { resumeId: "resume-id" })).toEqual({
      success: false,
      message: "apply-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("apply-runtime"));
    expect(await createJobApplication("job-3", { resumeId: "resume-id" })).toEqual({
      success: false,
      message: "apply-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await createJobApplication("job-3", { resumeId: "resume-id" })).toEqual({
      success: false,
      message: "Failed to submit application",
    });
  });

  it("updates job application and handles error branches", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    expect(
      await updateJobApplication("job-1", "application-1", {
        status: "reviewing",
        interviewScheduledAt: "2030-01-01T00:00:00.000Z",
        interviewNote: "  Bring portfolio  ",
      }),
    ).toEqual({ success: true });
    expect(apiMock.patch).toHaveBeenNthCalledWith(
      1,
      API_URLS.APPLICATION.APPLICATION_BY_JOB_AND_ID("job-1", "application-1"),
      {
        status: "reviewing",
        interviewScheduledAt: "2030-01-01T00:00:00.000Z",
        interviewNote: "Bring portfolio",
      },
    );

    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    await updateJobApplication("job-1", "application-1", {
      interviewNote: "   ",
    });
    expect(apiMock.patch).toHaveBeenNthCalledWith(
      2,
      API_URLS.APPLICATION.APPLICATION_BY_JOB_AND_ID("job-1", "application-1"),
      {
        status: undefined,
        interviewScheduledAt: undefined,
        interviewNote: undefined,
      },
    );

    apiMock.patch.mockRejectedValueOnce(responseError("update-app-response"));
    expect(
      await updateJobApplication("job-1", "application-1", {}),
    ).toEqual({
      success: false,
      message: "update-app-response",
    });

    apiMock.patch.mockRejectedValueOnce(new Error("update-app-runtime"));
    expect(
      await updateJobApplication("job-1", "application-1", {}),
    ).toEqual({
      success: false,
      message: "update-app-runtime",
    });

    apiMock.patch.mockRejectedValueOnce({});
    expect(
      await updateJobApplication("job-1", "application-1", {}),
    ).toEqual({
      success: false,
      message: "Failed to update application",
    });
  });

  it("updates application resume activity and handles error branches", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    expect(
      await updateApplicationResumeActivity("job-1", "app-1", "viewed"),
    ).toEqual({
      success: true,
    });
    expect(apiMock.patch).toHaveBeenCalledWith(
      API_URLS.APPLICATION.APPLICATION_RESUME_ACTIVITY("job-1", "app-1"),
      {
        action: "viewed",
      },
    );

    apiMock.patch.mockRejectedValueOnce(responseError("activity-response"));
    expect(
      await updateApplicationResumeActivity("job-1", "app-1", "downloaded"),
    ).toEqual({
      success: false,
      message: "activity-response",
    });

    apiMock.patch.mockRejectedValueOnce(new Error("activity-runtime"));
    expect(
      await updateApplicationResumeActivity("job-1", "app-1", "downloaded"),
    ).toEqual({
      success: false,
      message: "activity-runtime",
    });

    apiMock.patch.mockRejectedValueOnce({});
    expect(
      await updateApplicationResumeActivity("job-1", "app-1", "downloaded"),
    ).toEqual({
      success: false,
      message: "Failed to update resume activity",
    });
  });
});


import {
  atsScanResume,
  createResumeDraft,
  deleteResumeBuilder,
  generateAiSuggestions,
  generateAiSummary,
  generateExperienceBullets,
  generateResumePdf,
  getResumeBuilder,
  listResumeBuilders,
  saveResumeToMyResumes,
  updateResumeBuilder,
} from "@/lib/actions/resume-builder-actions";
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

describe("resume builder actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates/lists/gets resume builders via nested data shape", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { id: "rb-1" } } });
    expect(await createResumeDraft({ title: "My Resume" })).toEqual({ id: "rb-1" });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.RESUME_BUILDER.BASE, {
      title: "My Resume",
    });

    apiMock.get.mockResolvedValueOnce({
      data: { data: { items: [{ id: "rb-1" }], total: 1, page: 1, size: 10 } },
    });
    expect(await listResumeBuilders({ page: 1, size: 10 })).toEqual({
      items: [{ id: "rb-1" }],
      total: 1,
      page: 1,
      size: 10,
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.RESUME_BUILDER.LIST, {
      params: { page: 1, size: 10 },
    });

    apiMock.get.mockResolvedValueOnce({ data: { data: { id: "rb-1", title: "A" } } });
    expect(await getResumeBuilder("rb-1")).toEqual({ id: "rb-1", title: "A" });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.RESUME_BUILDER.BY_ID("rb-1"));
  });

  it("throws invalid API response when nested data is missing", async () => {
    apiMock.post.mockResolvedValueOnce({ data: {} });
    await expect(createResumeDraft({ title: "A" })).rejects.toThrow(
      "Invalid API response",
    );
  });

  it("updates and deletes builder with mapped API errors", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { data: { id: "rb-1" } } });
    expect(await updateResumeBuilder("rb-1", { title: "New" })).toEqual({
      id: "rb-1",
    });
    expect(apiMock.patch).toHaveBeenCalledWith(API_URLS.RESUME_BUILDER.BY_ID("rb-1"), {
      title: "New",
    });

    apiMock.patch.mockRejectedValueOnce({
      response: { data: { message: "update-response" } },
    });
    await expect(updateResumeBuilder("rb-1", {})).rejects.toThrow("update-response");

    apiMock.patch.mockRejectedValueOnce({
      response: { statusText: "Bad Request" },
    });
    await expect(updateResumeBuilder("rb-1", {})).rejects.toThrow("Bad Request");

    apiMock.patch.mockRejectedValueOnce(new Error("update-runtime"));
    await expect(updateResumeBuilder("rb-1", {})).rejects.toThrow("update-runtime");

    apiMock.delete.mockResolvedValueOnce({});
    await expect(deleteResumeBuilder("rb-1")).resolves.toBeUndefined();
    expect(apiMock.delete).toHaveBeenCalledWith(API_URLS.RESUME_BUILDER.BY_ID("rb-1"));

    apiMock.delete.mockRejectedValueOnce({});
    await expect(deleteResumeBuilder("rb-1")).rejects.toThrow("Request failed.");
  });

  it("generates/saves resume artifacts", async () => {
    apiMock.post.mockResolvedValueOnce({
      data: { data: { pdfUrl: "https://cdn.test/resume.pdf" } },
    });
    expect(await generateResumePdf("rb-1")).toEqual({
      pdfUrl: "https://cdn.test/resume.pdf",
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      API_URLS.RESUME_BUILDER.GENERATE_PDF("rb-1"),
    );

    apiMock.post.mockResolvedValueOnce({
      data: {
        data: {
          resumeId: "r-1",
          pdfUrl: "https://cdn.test/resume.pdf",
          fileName: "resume.pdf",
        },
      },
    });
    expect(await saveResumeToMyResumes("rb-1")).toEqual({
      resumeId: "r-1",
      pdfUrl: "https://cdn.test/resume.pdf",
      fileName: "resume.pdf",
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.RESUME_BUILDER.SAVE("rb-1"),
    );
  });

  it("generates summary/bullets/suggestions and maps errors", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { data: { summary: "hello" } } });
    expect(await generateAiSummary({ targetRole: "Backend" })).toEqual({
      summary: "hello",
    });

    apiMock.post.mockResolvedValueOnce({ data: { data: { bullets: ["a", "b"] } } });
    expect(
      await generateExperienceBullets({ description: "did work", targetRole: "Backend" }),
    ).toEqual({
      bullets: ["a", "b"],
    });

    apiMock.post.mockResolvedValueOnce({
      data: { data: { targetRole: "Backend", skills: ["Node"] } },
    });
    expect(await generateAiSuggestions({ focus: "skills", skills: ["Node"] })).toEqual({
      targetRole: "Backend",
      skills: ["Node"],
    });

    apiMock.post.mockRejectedValueOnce({
      response: { data: { message: "summary-failed" } },
    });
    await expect(generateAiSummary({})).rejects.toThrow("summary-failed");

    apiMock.post.mockRejectedValueOnce({
      response: { statusText: "Service Unavailable" },
    });
    await expect(generateExperienceBullets({ description: "x" })).rejects.toThrow(
      "Service Unavailable",
    );

    apiMock.post.mockRejectedValueOnce(new Error("suggestions-runtime"));
    await expect(generateAiSuggestions({ focus: "setup" })).rejects.toThrow(
      "suggestions-runtime",
    );
  });

  it("scans ATS resume with multipart and validates file presence", async () => {
    const missingFile = new FormData();
    await expect(atsScanResume(missingFile)).rejects.toThrow(
      "Resume file is required.",
    );

    const formData = new FormData();
    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    formData.append("resume", file);

    apiMock.post.mockResolvedValueOnce({
      data: { data: { overallScore: 82, ATS: { score: 80, tips: [] } } },
    });
    expect(await atsScanResume(formData)).toEqual({
      overallScore: 82,
      ATS: { score: 80, tips: [] },
    });
    expect(apiMock.post).toHaveBeenCalledWith(
      API_URLS.RESUME_BUILDER.ATS_SCAN,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    apiMock.post.mockRejectedValueOnce({
      response: { data: { message: "scan-failed" } },
    });
    await expect(atsScanResume(formData)).rejects.toThrow("scan-failed");
  });
});


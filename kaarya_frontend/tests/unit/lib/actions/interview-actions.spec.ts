import {
  completeInterviewSession,
  createInterview,
  deleteInterview,
  getInterviewAnalytics,
  getInterviewById,
  getInterviewSessionFeedback,
  getVoiceInterviewCreationConfig,
  listInterviews,
  listMyInterviewSessions,
  startInterviewSession,
  updateInterview,
} from "@/lib/actions/interview-actions";
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

describe("interview actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists interviews with normalized params", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, items: [] } });
    expect(
      await listInterviews({
        page: 1,
        size: 20,
        search: "  frontend ",
        status: "published",
        visibility: "public",
        interviewType: "technical",
        companyId: "co-1",
        collegeId: "cl-1",
        ownership: "created_by_me",
        discover: true,
        sortBy: "title",
      }),
    ).toEqual({
      success: true,
      items: [],
    });

    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.INTERVIEW.LIST, {
      params: {
        page: 1,
        size: 20,
        search: "frontend",
        status: "published",
        visibility: "public",
        interviewType: "technical",
        companyId: "co-1",
        collegeId: "cl-1",
        ownership: "created_by_me",
        discover: true,
        sortBy: "title",
      },
    });

  });

  it("gets interview by id and handles errors", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, id: "i-1" } });
    expect(await getInterviewById("i-1")).toEqual({ success: true, id: "i-1" });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.INTERVIEW.BY_ID("i-1"));

    apiMock.get.mockRejectedValueOnce(responseError("load-response"));
    expect(await getInterviewById("i-1")).toEqual({
      success: false,
      message: "load-response",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getInterviewById("i-1")).toEqual({
      success: false,
      message: "Failed to load interview",
    });
  });

  it("creates interview with normalized defaults", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(
      await createInterview({
        title: "  JS Interview ",
        description: "  Desc ",
        interviewType: "technical",
        role: "  Engineer ",
        level: "  Mid ",
        techStack: [" Node ", " "],
        tags: [" JS ", " "],
        instructions: "  Be clear ",
        questions: [" Q1 ", " "],
      }),
    ).toEqual({ success: true });

    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.INTERVIEW.LIST, {
      title: "JS Interview",
      description: "Desc",
      interviewType: "technical",
      role: "Engineer",
      level: "Mid",
      techStack: ["Node"],
      questionCount: 8,
      durationMinutes: 25,
      visibility: undefined,
      status: undefined,
      companyId: undefined,
      collegeId: undefined,
      tags: ["JS"],
      instructions: "Be clear",
      generateQuestions: false,
      questions: ["Q1"],
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    await createInterview({
      title: "Next",
      interviewType: "behavioral",
      role: "Lead",
      generateQuestions: true,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.INTERVIEW.LIST,
      expect.objectContaining({
        generateQuestions: true,
      }),
    );
  });

  it("maps createInterview errors with statusCode and details", async () => {
    apiMock.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: ["bad title", "bad role"],
          errors: [{ field: "title" }],
        },
      },
    });

    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "[\"bad title\",\"bad role\"]",
      statusCode: 400,
      errors: [{ field: "title" }],
    });

    apiMock.post.mockRejectedValueOnce({
      response: {
        data: { errors: ["x", "y"] },
      },
    });
    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "[\"x\",\"y\"]",
      errors: ["x", "y"],
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "{}",
    });

    apiMock.post.mockRejectedValueOnce({ message: ["m1", "m2"] });
    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "m1, m2",
    });

    apiMock.post.mockRejectedValueOnce({ errors: ["e1", "e2"] });
    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "e1, e2",
    });

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    apiMock.post.mockRejectedValueOnce(circular);
    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "Failed to create interview",
    });

    apiMock.post.mockRejectedValueOnce(123);
    expect(
      await createInterview({
        title: "a",
        interviewType: "technical",
        role: "r",
      }),
    ).toEqual({
      success: false,
      message: "Failed to create interview",
    });
  });

  it("updates interview with selective normalized fields", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });

    expect(
      await updateInterview("i-1", {
        title: "  New ",
        description: "  updated ",
        role: "  Engineer ",
        level: "  L2 ",
        techStack: [" React ", " "],
        questionCount: 12,
        durationMinutes: 30,
        visibility: "public",
        status: "published",
        tags: [" JS ", " "],
        instructions: "  follow up ",
        generateQuestions: true,
        questions: [" q1 ", " "],
      }),
    ).toEqual({ success: true });

    expect(apiMock.patch).toHaveBeenCalledWith(API_URLS.INTERVIEW.BY_ID("i-1"), {
      title: "New",
      description: "updated",
      role: "Engineer",
      level: "L2",
      techStack: ["React"],
      questionCount: 12,
      durationMinutes: 30,
      visibility: "public",
      status: "published",
      tags: ["JS"],
      instructions: "follow up",
      generateQuestions: true,
      questions: ["q1"],
    });

    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    await updateInterview("i-1", {
      interviewType: "system_design",
      questionCount: 0,
      durationMinutes: 0,
    });
    expect(apiMock.patch).toHaveBeenNthCalledWith(
      2,
      API_URLS.INTERVIEW.BY_ID("i-1"),
      {
        interviewType: "system_design",
      },
    );
  });

  it("deletes interview and handles errors", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await deleteInterview("i-1")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(API_URLS.INTERVIEW.BY_ID("i-1"));

    apiMock.delete.mockRejectedValueOnce({});
    expect(await deleteInterview("i-1")).toEqual({
      success: false,
      message: "Failed to delete interview",
    });
  });

  it("starts session, loads config, completes session with defaults", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await startInterviewSession("i-1")).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      API_URLS.INTERVIEW.SESSIONS("i-1"),
      {
        mode: "web",
        metadata: {},
      },
    );

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await getVoiceInterviewCreationConfig()).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.INTERVIEW.VOICE_CREATION_CONFIG,
    );

    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    expect(await completeInterviewSession("i-1", "s-1", {})).toEqual({
      success: true,
    });
    expect(apiMock.patch).toHaveBeenCalledWith(
      API_URLS.INTERVIEW.SESSION_COMPLETE("i-1", "s-1"),
      {
        status: "completed",
        transcript: [],
        recordingUrl: undefined,
        vapiCallId: undefined,
        durationSeconds: undefined,
        generateEvaluation: true,
      },
    );

    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    await completeInterviewSession("i-1", "s-1", {
      generateEvaluation: false,
      status: "abandoned",
      recordingUrl: "  https://recording.test ",
      vapiCallId: "  call-1 ",
      transcript: [{ role: "user", content: "hello" }],
    });
    expect(apiMock.patch).toHaveBeenNthCalledWith(
      2,
      API_URLS.INTERVIEW.SESSION_COMPLETE("i-1", "s-1"),
      {
        status: "abandoned",
        transcript: [{ role: "user", content: "hello" }],
        recordingUrl: "https://recording.test",
        vapiCallId: "call-1",
        durationSeconds: undefined,
        generateEvaluation: false,
      },
    );
  });

  it("lists sessions, feedback and analytics", async () => {
    apiMock.get.mockResolvedValue({ data: { success: true } });
    await listMyInterviewSessions("i-1", { page: 1, size: 10 });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      API_URLS.INTERVIEW.MY_SESSIONS("i-1"),
      {
        params: { page: 1, size: 10 },
      },
    );

    await getInterviewSessionFeedback("s-1");
    expect(apiMock.get).toHaveBeenNthCalledWith(
      2,
      API_URLS.INTERVIEW.SESSION_FEEDBACK("s-1"),
    );

    await getInterviewAnalytics("i-1", { page: 2, size: 5 });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      3,
      API_URLS.INTERVIEW.ANALYTICS("i-1"),
      {
        params: { page: 2, size: 5 },
      },
    );
  });

  it("returns fallback errors for remaining endpoints", async () => {
    apiMock.get.mockRejectedValueOnce(responseError("list-response"));
    expect(await listInterviews()).toEqual({
      success: false,
      message: "list-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("list-runtime"));
    expect(await listInterviews()).toEqual({
      success: false,
      message: "list-runtime",
    });

    apiMock.patch.mockRejectedValueOnce(responseError("update-response"));
    expect(await updateInterview("i-1", {})).toEqual({
      success: false,
      message: "update-response",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await startInterviewSession("i-1")).toEqual({
      success: false,
      message: "Failed to start interview session",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await getVoiceInterviewCreationConfig()).toEqual({
      success: false,
      message: "Failed to load voice creation config",
    });

    apiMock.patch.mockRejectedValueOnce({});
    expect(await completeInterviewSession("i-1", "s-1", {})).toEqual({
      success: false,
      message: "Failed to complete interview session",
    });

    apiMock.patch.mockRejectedValueOnce(new Error("update-runtime"));
    expect(await updateInterview("i-1", {})).toEqual({
      success: false,
      message: "update-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await listMyInterviewSessions("i-1")).toEqual({
      success: false,
      message: "Failed to load interview sessions",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getInterviewSessionFeedback("s-1")).toEqual({
      success: false,
      message: "Failed to load interview feedback",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getInterviewAnalytics("i-1")).toEqual({
      success: false,
      message: "Failed to load interview analytics",
    });
  });
});

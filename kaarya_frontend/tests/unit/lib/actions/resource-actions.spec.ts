import {
  createResourceCourse,
  deleteResourceCourse,
  getResourceCourseById,
  listResourceCourses,
  updateResourceCourse,
} from "@/lib/actions/resource-actions";
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

describe("resource actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists resources with normalized filters", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, items: [] } });

    expect(
      await listResourceCourses({
        page: 1,
        size: 12,
        search: "  react ",
        category: "  frontend ",
        difficulty: "beginner",
        visibility: "public",
        source: "candidate",
        ownership: "public",
        sortBy: "title",
      }),
    ).toEqual({
      success: true,
      items: [],
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.RESOURCE.LIST, {
      params: {
        page: 1,
        size: 12,
        search: "react",
        category: "frontend",
        difficulty: "beginner",
        visibility: "public",
        source: "candidate",
        ownership: "public",
        sortBy: "title",
      },
    });
  });

  it("gets course by id", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, id: "course-1" } });
    expect(await getResourceCourseById("course-1")).toEqual({
      success: true,
      id: "course-1",
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.RESOURCE.BY_ID("course-1"));
  });

  it("creates course with normalized payload and defaults", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(
      await createResourceCourse({
        title: "  React  ",
        description: "  Learn from scratch ",
        category: "  Frontend ",
        difficulty: "intermediate",
        targetRoles: ["  Developer ", " "],
        chapterTitles: [" Intro ", " "],
        customVideoUrls: [" https://video.test ", " "],
        promptContext: "  focus hooks ",
        jobDescriptionContext: "  jd ",
      }),
    ).toEqual({ success: true });

    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.RESOURCE.LIST, {
      title: "React",
      description: "Learn from scratch",
      category: "Frontend",
      generationMode: "learn",
      difficulty: "intermediate",
      targetRoles: ["Developer"],
      chapterCount: 6,
      chapterTitles: ["Intro"],
      visibility: "private",
      includeVideoRecommendations: true,
      customVideoUrls: ["https://video.test"],
      promptContext: "focus hooks",
      jobDescriptionContext: "jd",
      companyId: undefined,
      collegeId: undefined,
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    await createResourceCourse({
      title: "X",
      category: "Y",
      difficulty: "beginner",
      targetRoles: [],
      includeVideoRecommendations: false,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.RESOURCE.LIST,
      expect.objectContaining({
        includeVideoRecommendations: false,
      }),
    );
  });

  it("updates course using selective normalized patch payload", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });

    expect(
      await updateResourceCourse("course-1", {
        title: "  New ",
        description: "  Updated ",
        category: "  Backend ",
        generationMode: "interview_prep",
        difficulty: "advanced",
        targetRoles: [" Engineer ", " "],
        chapterCount: 10,
        chapterTitles: [" One ", " "],
        visibility: "public",
        includeVideoRecommendations: false,
        customVideoUrls: [" https://a.test ", " "],
        promptContext: "  context ",
        jobDescriptionContext: "  jd ",
        regenerateContent: true,
      }),
    ).toEqual({ success: true });

    expect(apiMock.patch).toHaveBeenCalledWith(
      API_URLS.RESOURCE.BY_ID("course-1"),
      {
        title: "New",
        description: "Updated",
        category: "Backend",
        generationMode: "interview_prep",
        difficulty: "advanced",
        targetRoles: ["Engineer"],
        chapterCount: 10,
        chapterTitles: ["One"],
        visibility: "public",
        includeVideoRecommendations: false,
        customVideoUrls: ["https://a.test"],
        promptContext: "context",
        jobDescriptionContext: "jd",
        regenerateContent: true,
      },
    );
  });

  it("deletes course by id", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await deleteResourceCourse("course-1")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(API_URLS.RESOURCE.BY_ID("course-1"));
  });

  it("maps resource errors from many backend formats", async () => {
    apiMock.get.mockRejectedValueOnce({
      response: { data: { message: "direct-message" } },
    });
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "direct-message",
    });

    apiMock.get.mockRejectedValueOnce({
      response: { data: { message: ["msg-a", "msg-b"] } },
    });
    expect(await getResourceCourseById("course-1")).toEqual({
      success: false,
      message: "msg-a, msg-b",
    });

    apiMock.post.mockRejectedValueOnce({
      response: { status: 502, data: {} },
    });
    expect(
      await createResourceCourse({
        title: "a",
        category: "b",
        difficulty: "beginner",
        targetRoles: [],
      }),
    ).toEqual({
      success: false,
      message: "AI service could not generate the course right now. Please try again.",
    });

    apiMock.patch.mockRejectedValueOnce({
      message: ["a", "b"],
    });
    expect(await updateResourceCourse("course-1", {})).toEqual({
      success: false,
      message: "a, b",
    });

    apiMock.delete.mockRejectedValueOnce({
      error: "delete-error",
    });
    expect(await deleteResourceCourse("course-1")).toEqual({
      success: false,
      message: "delete-error",
    });

    apiMock.get.mockRejectedValueOnce({
      errors: ["x", "y"],
    });
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "x, y",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(
      await createResourceCourse({
        title: "a",
        category: "b",
        difficulty: "beginner",
        targetRoles: [],
      }),
    ).toEqual({
      success: false,
      message: "{}",
    });

    apiMock.get.mockRejectedValueOnce({
      response: { data: { message: "   " } },
      message: { error: "nested-message" },
    });
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "nested-message",
    });

    apiMock.get.mockRejectedValueOnce({
      message: { error: { message: "deep-message" } },
    });
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "deep-message",
    });

    apiMock.get.mockRejectedValueOnce(123);
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "Failed to fetch resource courses.",
    });

    apiMock.get.mockRejectedValueOnce("string-error");
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "string-error",
    });

    const circular: Record<string, unknown> = {};
    circular.self = circular;
    apiMock.get.mockRejectedValueOnce(circular);
    expect(await listResourceCourses()).toEqual({
      success: false,
      message: "Failed to fetch resource courses.",
    });
  });
});

import {
  getMyBookmarks,
  saveInterviewBookmark,
  saveJobBookmark,
  unsaveInterviewBookmark,
  unsaveJobBookmark,
} from "@/lib/actions/bookmark-actions";
import { API_URLS } from "@/lib/api/endpoints";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
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

describe("bookmark actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches bookmarks with trimmed/normalized query params", async () => {
    apiMock.get.mockResolvedValue({
      data: { success: true, data: { items: [] } },
    });

    const result = await getMyBookmarks({
      type: "jobs",
      search: "  backend  ",
      sortBy: "saved_at_desc",
    });

    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.BOOKMARK.ME, {
      params: {
        type: "jobs",
        search: "backend",
        sortBy: "saved_at_desc",
      },
    });
    expect(result).toEqual({ success: true, data: { items: [] } });

    await getMyBookmarks({
      type: "all",
      search: "   ",
      sortBy: "saved_at_asc",
    });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, API_URLS.BOOKMARK.ME, {
      params: {
        type: "all",
        search: undefined,
        sortBy: "saved_at_asc",
      },
    });
  });

  it("returns bookmark list error from response message", async () => {
    apiMock.get.mockRejectedValue(responseError("from-response"));

    const result = await getMyBookmarks();
    expect(result).toEqual({
      success: false,
      message: "from-response",
    });
  });

  it("returns bookmark list error from runtime message", async () => {
    apiMock.get.mockRejectedValue(new Error("network"));

    const result = await getMyBookmarks();
    expect(result).toEqual({
      success: false,
      message: "network",
    });
  });

  it("returns bookmark list default fallback error", async () => {
    apiMock.get.mockRejectedValue({});

    const result = await getMyBookmarks();
    expect(result).toEqual({
      success: false,
      message: "Failed to load saved bookmarks",
    });
  });

  it("saves job bookmark and handles all error branches", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await saveJobBookmark("job-1")).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.BOOKMARK.JOB("job-1"));

    apiMock.post.mockRejectedValueOnce(responseError("save-job-response"));
    expect(await saveJobBookmark("job-1")).toEqual({
      success: false,
      message: "save-job-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("save-job-runtime"));
    expect(await saveJobBookmark("job-1")).toEqual({
      success: false,
      message: "save-job-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await saveJobBookmark("job-1")).toEqual({
      success: false,
      message: "Failed to save job",
    });
  });

  it("unsaves job bookmark and handles all error branches", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await unsaveJobBookmark("job-1")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(API_URLS.BOOKMARK.JOB("job-1"));

    apiMock.delete.mockRejectedValueOnce(responseError("unsave-job-response"));
    expect(await unsaveJobBookmark("job-1")).toEqual({
      success: false,
      message: "unsave-job-response",
    });

    apiMock.delete.mockRejectedValueOnce(new Error("unsave-job-runtime"));
    expect(await unsaveJobBookmark("job-1")).toEqual({
      success: false,
      message: "unsave-job-runtime",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await unsaveJobBookmark("job-1")).toEqual({
      success: false,
      message: "Failed to remove saved job",
    });
  });

  it("saves interview bookmark and handles all error branches", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await saveInterviewBookmark("int-1")).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenCalledWith(API_URLS.BOOKMARK.INTERVIEW("int-1"));

    apiMock.post.mockRejectedValueOnce(responseError("save-interview-response"));
    expect(await saveInterviewBookmark("int-1")).toEqual({
      success: false,
      message: "save-interview-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("save-interview-runtime"));
    expect(await saveInterviewBookmark("int-1")).toEqual({
      success: false,
      message: "save-interview-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await saveInterviewBookmark("int-1")).toEqual({
      success: false,
      message: "Failed to save interview",
    });
  });

  it("unsaves interview bookmark and handles all error branches", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await unsaveInterviewBookmark("int-1")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(
      API_URLS.BOOKMARK.INTERVIEW("int-1"),
    );

    apiMock.delete.mockRejectedValueOnce(responseError("unsave-int-response"));
    expect(await unsaveInterviewBookmark("int-1")).toEqual({
      success: false,
      message: "unsave-int-response",
    });

    apiMock.delete.mockRejectedValueOnce(new Error("unsave-int-runtime"));
    expect(await unsaveInterviewBookmark("int-1")).toEqual({
      success: false,
      message: "unsave-int-runtime",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await unsaveInterviewBookmark("int-1")).toEqual({
      success: false,
      message: "Failed to remove saved interview",
    });
  });
});

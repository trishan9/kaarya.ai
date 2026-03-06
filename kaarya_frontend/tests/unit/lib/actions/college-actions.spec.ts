import {
  createCollege,
  getCollegeById,
  getCollegeMetrics,
  getLeaderboard,
  inviteStudentToCollege,
  joinCollegeByCode,
  listCollegeStudents,
  listColleges,
  listCollegeWorkspaces,
  removeStudentFromCollege,
  resetCollegeInviteCode,
  updateCollege,
} from "@/lib/actions/college-actions";
import { API_URLS } from "@/lib/api/endpoints";

const { apiMock, multipartConfig } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  multipartConfig: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  },
}));

vi.mock("@/lib/api/axios-instance", () => ({
  api: apiMock,
  MULTIPART_FORM_DATA_CONFIG: multipartConfig,
}));

const responseError = (message: string) => ({
  response: {
    data: { message },
  },
});

describe("college actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists workspaces/colleges/students and applies trims", async () => {
    apiMock.get.mockResolvedValue({ data: { success: true } });

    await listCollegeWorkspaces({ page: 1, size: 10 });
    expect(apiMock.get).toHaveBeenNthCalledWith(1, API_URLS.COLLEGE.WORKSPACES_ME, {
      params: { page: 1, size: 10 },
    });

    await listColleges({ page: 2, size: 20, search: "  abc " });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, API_URLS.COLLEGE.LIST, {
      params: { page: 2, size: 20, search: "abc" },
    });

    await listColleges({ search: "   " });
    expect(apiMock.get).toHaveBeenNthCalledWith(3, API_URLS.COLLEGE.LIST, {
      params: { page: undefined, size: undefined, search: undefined },
    });

    await listCollegeStudents("c-1", { page: 1, size: 50 });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      4,
      API_URLS.COLLEGE.STUDENTS("c-1"),
      { params: { page: 1, size: 50 } },
    );
  });

  it("gets college metrics and college by id", async () => {
    apiMock.get.mockResolvedValue({ data: { success: true } });

    expect(await getCollegeMetrics("c-1")).toEqual({ success: true });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.COLLEGE.METRICS("c-1"));

    expect(await getCollegeById("c-1")).toEqual({ success: true });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.COLLEGE.BY_ID("c-1"));
  });

  it("creates college with auth header and multipart form data", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    const file = new File(["logo"], "logo.png", { type: "image/png" });
    await createCollege(
      {
        name: "  Acme College  ",
        institutionType: "  Public  ",
        location: "  Kathmandu ",
        logo: file,
      },
      { accessToken: "token-1" },
    );

    const [url, formData, config] = apiMock.post.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.COLLEGE.LIST);
    expect(entries).toContainEqual(["name", "Acme College"]);
    expect(entries).toContainEqual(["institutionType", "Public"]);
    expect(entries).toContainEqual(["location", "Kathmandu"]);
    expect(entries).toContainEqual(["logo", file]);
    expect(config).toEqual({
      headers: {
        ...multipartConfig.headers,
        Authorization: "Bearer token-1",
      },
    });
  });

  it("updates college with trimmed fields and multipart data", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    const file = new File(["logo"], "logo.png", { type: "image/png" });

    await updateCollege("c-1", {
      name: "  Updated ",
      institutionType: "  Private ",
      location: "  Pokhara ",
      logo: file,
    });

    const [url, formData, config] = apiMock.patch.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.COLLEGE.BY_ID("c-1"));
    expect(entries).toContainEqual(["name", "Updated"]);
    expect(entries).toContainEqual(["institutionType", "Private"]);
    expect(entries).toContainEqual(["location", "Pokhara"]);
    expect(entries).toContainEqual(["logo", file]);
    expect(config).toEqual({ headers: { ...multipartConfig.headers } });
  });

  it("joins/invites/removes/reset code and normalizes payload", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true } });
    apiMock.delete.mockResolvedValue({ data: { success: true } });

    await joinCollegeByCode({ inviteCode: "  CODE ", program: "  CS ", year: 2 });
    expect(apiMock.post).toHaveBeenNthCalledWith(1, API_URLS.COLLEGE.JOIN_BY_CODE, {
      inviteCode: "CODE",
      program: "CS",
      year: 2,
    });

    await resetCollegeInviteCode("c-1");
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.COLLEGE.INVITE_CODE_RESET("c-1"),
    );

    await inviteStudentToCollege("c-1", {
      email: "  USER@MAIL.COM  ",
      program: "  Engineering ",
      year: 3,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(3, API_URLS.COLLEGE.INVITES("c-1"), {
      email: "user@mail.com",
      program: "Engineering",
      year: 3,
    });

    await removeStudentFromCollege("c-1", "s-1");
    expect(apiMock.delete).toHaveBeenCalledWith(
      API_URLS.COLLEGE.STUDENT_BY_ID("c-1", "s-1"),
    );
  });

  it("loads leaderboard with params", async () => {
    apiMock.get.mockResolvedValue({ data: { success: true } });
    await getLeaderboard({
      scope: "college",
      collegeId: "c-1",
      page: 1,
      size: 10,
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.LEADERBOARD.LIST, {
      params: {
        scope: "college",
        collegeId: "c-1",
        page: 1,
        size: 10,
      },
    });
  });

  it("returns fallback error variants", async () => {
    apiMock.get.mockRejectedValueOnce(responseError("response-message"));
    expect(await listCollegeWorkspaces()).toEqual({
      success: false,
      message: "response-message",
    });

    apiMock.get.mockRejectedValueOnce(new Error("runtime-message"));
    expect(await listColleges()).toEqual({
      success: false,
      message: "runtime-message",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await listCollegeStudents("c-1")).toEqual({
      success: false,
      message: "Failed to load college students",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await createCollege({ name: "a" })).toEqual({
      success: false,
      message: "Failed to create college",
    });

    apiMock.patch.mockRejectedValueOnce({});
    expect(await updateCollege("c-1", {})).toEqual({
      success: false,
      message: "Failed to update college",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await joinCollegeByCode({ inviteCode: "A" })).toEqual({
      success: false,
      message: "Failed to join college",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await resetCollegeInviteCode("c-1")).toEqual({
      success: false,
      message: "Failed to reset invite code",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await inviteStudentToCollege("c-1", { email: "a@a.com" })).toEqual({
      success: false,
      message: "Failed to send student invitation",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await removeStudentFromCollege("c-1", "s-1")).toEqual({
      success: false,
      message: "Failed to remove student",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getLeaderboard()).toEqual({
      success: false,
      message: "Failed to load leaderboard",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getCollegeMetrics("c-1")).toEqual({
      success: false,
      message: "Failed to load college metrics",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getCollegeById("c-1")).toEqual({
      success: false,
      message: "Failed to load college",
    });
  });
});


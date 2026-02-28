const { verifySessionMock, getMeMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getMeMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  verifySession: verifySessionMock,
}));

vi.mock("@/lib/actions/auth-action", () => ({
  getMe: getMeMock,
}));

describe("lib/dal getCurrentUser", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns null when session is missing", async () => {
    verifySessionMock.mockResolvedValue(null);
    const { getCurrentUser } = await import("@/lib/dal");

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(getMeMock).not.toHaveBeenCalled();
  });

  it("returns user data from getMe response", async () => {
    verifySessionMock.mockResolvedValue({ token: "access-token" });
    getMeMock.mockResolvedValue({
      success: true,
      data: {
        id: "u1",
        name: "Test User",
      },
    });

    const { getCurrentUser } = await import("@/lib/dal");
    const result = await getCurrentUser();

    expect(result).toEqual({
      id: "u1",
      name: "Test User",
    });
  });

  it("returns null when getMe resolves without data", async () => {
    verifySessionMock.mockResolvedValue({ token: "access-token" });
    getMeMock.mockResolvedValue({
      success: true,
      data: undefined,
    });

    const { getCurrentUser } = await import("@/lib/dal");
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("returns null when getMe throws", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    verifySessionMock.mockResolvedValue({ token: "access-token" });
    getMeMock.mockRejectedValue(new Error("network error"));

    const { getCurrentUser } = await import("@/lib/dal");
    await expect(getCurrentUser()).resolves.toBeNull();

    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch user");
    consoleSpy.mockRestore();
  });
});

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("lib/session", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates session cookie with secure false in non-production mode", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const cookieStore = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };
    cookiesMock.mockResolvedValue(cookieStore);

    const { createSession } = await import("@/lib/session");
    await createSession("token-123");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "token-123",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      }),
    );
  });

  it("creates session cookie with secure true in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const cookieStore = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };
    cookiesMock.mockResolvedValue(cookieStore);

    const { createSession } = await import("@/lib/session");
    await createSession("token-abc");

    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "token-abc",
      expect.objectContaining({
        secure: true,
      }),
    );
  });

  it("verifies, updates, and clears session", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const cookieStore = {
      set: vi.fn(),
      get: vi.fn().mockReturnValue({ value: "token-x" }),
      delete: vi.fn(),
    };
    cookiesMock.mockResolvedValue(cookieStore);

    const { clearSession, updateSession, verifySession } = await import(
      "@/lib/session"
    );

    await expect(verifySession()).resolves.toEqual({ token: "token-x" });
    await expect(updateSession()).resolves.toBeUndefined();
    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "token-x",
      expect.objectContaining({
        httpOnly: true,
      }),
    );

    await clearSession();
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
  });

  it("returns null when session token is missing", async () => {
    const cookieStore = {
      set: vi.fn(),
      get: vi.fn().mockReturnValue(undefined),
      delete: vi.fn(),
    };
    cookiesMock.mockResolvedValue(cookieStore);

    const { updateSession, verifySession } = await import("@/lib/session");

    await expect(verifySession()).resolves.toBeNull();
    await expect(updateSession()).resolves.toBeNull();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

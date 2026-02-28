import OAuthCallbackPage from "@/app/(auth)/oauth/callback/page";

const {
  redirectMock,
  exchangeOAuthResultMock,
  completeOAuthLinkMock,
  verifySessionMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  exchangeOAuthResultMock: vi.fn(),
  completeOAuthLinkMock: vi.fn(),
  verifySessionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/actions/auth-action", () => ({
  exchangeOAuthResult: exchangeOAuthResultMock,
  completeOAuthLink: completeOAuthLinkMock,
}));

vi.mock("@/lib/session", () => ({
  verifySession: verifySessionMock,
}));

const invokePage = async (searchParams: Record<string, string | undefined>) =>
  OAuthCallbackPage({
    searchParams: Promise.resolve(searchParams),
  });

describe("OAuthCallbackPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to invalid request when oauth result token is missing", async () => {
    await expect(invokePage({})).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?oauthError=invalid_request",
    );
  });

  it("finalizes authenticated oauth response", async () => {
    exchangeOAuthResultMock.mockResolvedValueOnce({
      success: true,
      data: {
        status: "authenticated",
        accessToken: "oauth-token",
      },
    });

    await expect(
      invokePage({
        oauth_result_token: "oauth-result-token",
        next: "/overview",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/oauth/finalize?token=oauth-token&next=%2Foverview");
  });

  it("redirects to sign in with link token when link is required and no active session", async () => {
    exchangeOAuthResultMock.mockResolvedValueOnce({
      success: true,
      data: {
        status: "link_required",
        linkToken: "link-token-1",
        provider: "google",
      },
    });
    verifySessionMock.mockResolvedValueOnce(null);

    await expect(
      invokePage({
        oauth_result_token: "oauth-result-token",
      }),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?linkToken=link-token-1&provider=google",
    );
  });
});

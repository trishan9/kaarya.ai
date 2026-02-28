import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SigninPage from "@/app/(auth)/sign-in/page";

const {
  routerMock,
  searchParamsGetMock,
  signinMock,
  completeOAuthLinkMock,
  createSessionMock,
  toastMock,
} = vi.hoisted(() => ({
  routerMock: {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  },
  searchParamsGetMock: vi.fn(),
  signinMock: vi.fn(),
  completeOAuthLinkMock: vi.fn(),
  createSessionMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => ({
    get: searchParamsGetMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/actions/auth-action", () => ({
  signin: signinMock,
  completeOAuthLink: completeOAuthLinkMock,
}));

vi.mock("@/lib/session", () => ({
  createSession: createSessionMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/api/endpoints", () => ({
  API_URLS: {
    BASE: "https://api.kaarya.test",
    AUTH: {
      OAUTH_AUTHORIZE: (provider: "google" | "github") =>
        `/auth/oauth/${provider}/authorize`,
    },
  },
}));

describe("SigninPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signinMock.mockReset();
    completeOAuthLinkMock.mockReset();
    createSessionMock.mockReset();
    searchParamsGetMock.mockImplementation(() => null);
  });

  it("submits valid credentials and routes to overview", async () => {
    signinMock.mockResolvedValueOnce({
      success: true,
      message: "Signed in successfully.",
      data: {
        accessToken: "access-token",
        user: { role: "user" },
      },
    });

    render(<SigninPage />);

    expect(
      screen.getByRole("heading", { name: "Welcome back to Kaarya!" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Email address must be valid."),
    ).toBeInTheDocument();
    expect(screen.getByText("Password can't be empty.")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Email"));
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "StrongPass123!");

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signinMock).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "StrongPass123!",
      });
      expect(createSessionMock).toHaveBeenCalledWith("access-token");
      expect(routerMock.replace).toHaveBeenCalledWith("/overview");
      expect(toastMock.success).toHaveBeenCalledWith("Signed in successfully.");
    });
  });

  it("handles oauth account linking after sign in", async () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      if (key === "linkToken") return "link-token-1";
      if (key === "provider") return "google";
      return null;
    });

    signinMock.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: "signin-token",
        user: { role: "user" },
      },
    });

    completeOAuthLinkMock.mockResolvedValueOnce({
      success: true,
      message: "Social account linked.",
      data: {
        accessToken: "linked-token",
      },
    });

    render(<SigninPage />);

    expect(
      screen.getByText(
        "Sign in with your existing account to link google.",
      ),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "StrongPass123!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(completeOAuthLinkMock).toHaveBeenCalledWith("link-token-1");
      expect(createSessionMock).toHaveBeenCalledWith("signin-token");
      expect(createSessionMock).toHaveBeenCalledWith("linked-token");
      expect(routerMock.replace).toHaveBeenCalledWith("/overview");
      expect(toastMock.success).toHaveBeenCalledWith("Social account linked.");
    });
  });
});

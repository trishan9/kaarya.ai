import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/(auth)/sign-up/page";

const {
  routerMock,
  signupMock,
  signupRecruiterWithCompanyMock,
  signupCollegeWithWorkspaceMock,
  createSessionMock,
  toastMock,
} = vi.hoisted(() => ({
  routerMock: {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  },
  signupMock: vi.fn(),
  signupRecruiterWithCompanyMock: vi.fn(),
  signupCollegeWithWorkspaceMock: vi.fn(),
  createSessionMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/actions/auth-action", () => ({
  signup: signupMock,
  signupRecruiterWithCompany: signupRecruiterWithCompanyMock,
  signupCollegeWithWorkspace: signupCollegeWithWorkspaceMock,
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

async function fillCommonSignupFields() {
  await userEvent.type(screen.getByLabelText("First Name"), "Jane");
  await userEvent.type(screen.getByLabelText("Last Name"), "Recruiter");
  await userEvent.type(screen.getByLabelText("Email"), "jane@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "StrongPass123!");
  await userEvent.type(
    screen.getByLabelText("Confirm Password"),
    "StrongPass123!",
  );
}

describe("SignupPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signupMock.mockReset();
    signupRecruiterWithCompanyMock.mockReset();
    signupCollegeWithWorkspaceMock.mockReset();
    createSessionMock.mockReset();
  });

  it("supports recruiter signup flow with validation and workspace routing", async () => {
    signupRecruiterWithCompanyMock.mockResolvedValueOnce({
      success: true,
      message: "Recruiter workspace is ready.",
      data: {
        accessToken: "recruiter-token",
        company: {
          id: "co-1",
        },
      },
    });

    render(<SignupPage />);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Recruiter" }));

    expect(screen.getByLabelText("Company Name")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Signup with Google" }),
    ).not.toBeInTheDocument();

    await fillCommonSignupFields();

    await userEvent.click(
      screen.getByRole("button", { name: "Create Recruiter Workspace" }),
    );

    expect(
      await screen.findByText("Company name is required for recruiter signup."),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Company Name"), "Acme Inc");
    await userEvent.type(screen.getByLabelText("Industry"), "Technology");
    await userEvent.type(screen.getByLabelText("Designation"), "Talent Partner");
    await userEvent.type(screen.getByLabelText("Location"), "Kathmandu");

    await userEvent.click(
      screen.getByRole("button", { name: "Create Recruiter Workspace" }),
    );

    await waitFor(() => {
      expect(signupRecruiterWithCompanyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "recruiter",
          email: "jane@example.com",
          companyName: "Acme Inc",
        }),
      );
      expect(createSessionMock).toHaveBeenCalledWith("recruiter-token");
      expect(routerMock.replace).toHaveBeenCalledWith("/overview?workspace=co-1");
      expect(routerMock.refresh).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Recruiter workspace is ready.");
    });
  });

  it("submits candidate signup and routes to sign in", async () => {
    signupMock.mockResolvedValueOnce({
      success: true,
      message: "Account created.",
    });

    render(<SignupPage />);

    await fillCommonSignupFields();

    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "user",
          email: "jane@example.com",
        }),
      );
      expect(routerMock.push).toHaveBeenCalledWith("/sign-in");
      expect(toastMock.success).toHaveBeenCalledWith("Account created.");
    });
  });
});

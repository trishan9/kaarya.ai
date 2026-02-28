import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

const {
  routerMock,
  searchParamsGetMock,
  toastMock,
  requestPasswordResetMock,
  verifyPasswordResetOtpMock,
  confirmPasswordResetMock,
} = vi.hoisted(() => ({
  routerMock: {
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  },
  searchParamsGetMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  requestPasswordResetMock: vi.fn(),
  verifyPasswordResetOtpMock: vi.fn(),
  confirmPasswordResetMock: vi.fn(),
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

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/auth-action", () => ({
  requestPasswordReset: requestPasswordResetMock,
  verifyPasswordResetOtp: verifyPasswordResetOtpMock,
  confirmPasswordReset: confirmPasswordResetMock,
}));

describe("ForgotPasswordFlow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGetMock.mockImplementation(() => null);
    vi.useRealTimers();
  });

  it("handles full request -> verify -> reset flow and redirects to sign in", async () => {
    const user = userEvent.setup();

    requestPasswordResetMock.mockResolvedValue({
      success: true,
      message: "Verification code sent.",
    });
    verifyPasswordResetOtpMock.mockResolvedValue({
      success: true,
      message: "Code verified.",
      data: { resetToken: "reset-token-1" },
    });
    confirmPasswordResetMock.mockResolvedValue({
      success: true,
      message: "Password reset successful.",
    });

    render(<ForgotPasswordPage />);

    expect(
      screen.getByRole("heading", { name: "Forgot your password?" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Email"),
      "candidate@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send code" }));

    await waitFor(() => {
      expect(requestPasswordResetMock).toHaveBeenCalledWith({
        email: "candidate@example.com",
      });
      expect(
        screen.getByText("Verification code sent. Check your email inbox."),
      ).toBeInTheDocument();
    });

    const firstOtpInput = screen.getByLabelText("Verification code digit 1 of 6");
    await user.type(firstOtpInput, "123456");

    await user.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() => {
      expect(verifyPasswordResetOtpMock).toHaveBeenCalledWith({
        email: "candidate@example.com",
        otp: "123456",
      });
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("New Password"), "NewStrongPass123!");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "NewStrongPass123!",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(confirmPasswordResetMock).toHaveBeenCalledWith({
        token: "reset-token-1",
        password: "NewStrongPass123!",
        confirmPassword: "NewStrongPass123!",
      });
      expect(
        screen.getByText("Password updated successfully"),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Continue to sign in" }),
    );

    expect(routerMock.replace).toHaveBeenCalledWith("/sign-in");
    expect(routerMock.refresh).toHaveBeenCalled();
  });

  it("opens reset step immediately when token is provided", async () => {
    searchParamsGetMock.mockImplementation((key: string) => {
      if (key === "token") return "link-token-1";
      return null;
    });

    render(<ForgotPasswordPage />);

    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Back to verification" }),
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send code" })).toBeInTheDocument();
  });
});

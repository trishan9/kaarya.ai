import { act, renderHook, waitFor } from "@testing-library/react";
import { usePasswordResetFlow } from "@/app/(auth)/_hooks/use-password-reset-flow";

const {
  routerMock,
  searchParamsMock,
  toastMock,
  requestPasswordResetMock,
  verifyPasswordResetOtpMock,
  confirmPasswordResetMock,
} = vi.hoisted(() => ({
  routerMock: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  },
  searchParamsMock: {
    get: vi.fn(),
  },
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
  useSearchParams: () => searchParamsMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/auth-action", () => ({
  requestPasswordReset: requestPasswordResetMock,
  verifyPasswordResetOtp: verifyPasswordResetOtpMock,
  confirmPasswordReset: confirmPasswordResetMock,
}));

describe("usePasswordResetFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockReturnValue(null);
  });

  it("requests code and verifies otp successfully", async () => {
    requestPasswordResetMock.mockResolvedValueOnce({ success: true, message: "sent" });
    verifyPasswordResetOtpMock.mockResolvedValueOnce({
      success: true,
      data: { resetToken: "reset-token" },
      message: "verified",
    });

    const { result } = renderHook(() => usePasswordResetFlow());

    act(() => {
      result.current.verifyForm.setValue("email", "User@Example.com");
    });
    await act(async () => {
      result.current.onRequestCode();
    });

    await waitFor(() => {
      expect(requestPasswordResetMock).toHaveBeenCalledWith({
        email: "user@example.com",
      });
      expect(result.current.hasSentCode).toBe(true);
      expect(result.current.sendCodeInfo).toContain("Verification code sent");
      expect(toastMock.success).toHaveBeenCalledWith("sent");
    });

    await act(async () => {
      result.current.onSubmitVerify({
        email: "USER@example.com",
        otp: "123456",
      });
    });

    await waitFor(() => {
      expect(verifyPasswordResetOtpMock).toHaveBeenCalledWith({
        email: "user@example.com",
        otp: "123456",
      });
      expect(result.current.step).toBe("reset");
      expect(toastMock.success).toHaveBeenCalledWith("verified");
    });
  });

  it("handles request and verify failures", async () => {
    requestPasswordResetMock.mockResolvedValueOnce({
      success: false,
      message: "send-failed",
    });
    const { result } = renderHook(() => usePasswordResetFlow());

    act(() => {
      result.current.verifyForm.setValue("email", "bad-email");
    });
    await act(async () => {
      result.current.onRequestCode();
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
    });

    act(() => {
      result.current.verifyForm.setValue("email", "user@example.com");
    });
    await act(async () => {
      result.current.onRequestCode();
    });
    await waitFor(() => {
      expect(result.current.sendCodeError).toBe("send-failed");
      expect(toastMock.error).toHaveBeenCalledWith("send-failed");
    });

    verifyPasswordResetOtpMock.mockResolvedValueOnce({
      success: false,
      message: "otp-invalid",
    });
    await act(async () => {
      result.current.onSubmitVerify({
        email: "user@example.com",
        otp: "111111",
      });
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("otp-invalid");
    });
  });

  it("resets password and redirects to sign-in on success", async () => {
    vi.useFakeTimers();
    searchParamsMock.get.mockReturnValue("link-token");
    confirmPasswordResetMock.mockResolvedValueOnce({
      success: true,
      message: "reset-done",
    });

    const { result } = renderHook(() => usePasswordResetFlow());
    expect(result.current.step).toBe("reset");

    await act(async () => {
      result.current.onSubmitReset({
        password: "Password12",
        confirmPassword: "Password12",
      });
    });
    expect(confirmPasswordResetMock).toHaveBeenCalledWith({
      token: "link-token",
      password: "Password12",
      confirmPassword: "Password12",
    });
    expect(result.current.step).toBe("success");
    expect(toastMock.success).toHaveBeenCalledWith("reset-done");

    await act(async () => {
      vi.advanceTimersByTime(2200);
    });
    expect(routerMock.replace).toHaveBeenCalledWith("/sign-in");
    expect(routerMock.refresh).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("handles reset token missing and resend cooldown branch", async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => usePasswordResetFlow());

    await act(async () => {
      result.current.onSubmitReset({
        password: "Password12",
        confirmPassword: "Password12",
      });
    });
    expect(result.current.step).toBe("verify");
    expect(toastMock.error).toHaveBeenCalledWith(
      "Reset session expired. Please verify the code again.",
    );

    requestPasswordResetMock.mockResolvedValueOnce({ success: true });
    act(() => {
      result.current.verifyForm.setValue("email", "user@example.com");
    });
    await act(async () => {
      result.current.onRequestCode();
    });
    expect(result.current.hasSentCode).toBe(true);
    expect(result.current.resendSecondsLeft).toBeGreaterThan(0);

    await act(async () => {
      result.current.onResendCode();
    });
    expect(toastMock.message).toHaveBeenCalled();
    unmount();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
});

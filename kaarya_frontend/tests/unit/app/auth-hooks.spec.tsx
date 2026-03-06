import { act, renderHook, waitFor } from "@testing-library/react";
import { useLogOut } from "@/app/(auth)/_hooks/use-log-out";
import { useSignIn } from "@/app/(auth)/_hooks/use-sign-in";
import { useSignUp } from "@/app/(auth)/_hooks/use-sign-up";

const {
  routerMock,
  searchParamsMock,
  toastMock,
  signinMock,
  completeOAuthLinkMock,
  signupMock,
  signupRecruiterWithCompanyMock,
  signupCollegeWithWorkspaceMock,
  createSessionMock,
  logoutMock,
} = vi.hoisted(() => ({
  routerMock: {
    replace: vi.fn(),
    push: vi.fn(),
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
  signinMock: vi.fn(),
  completeOAuthLinkMock: vi.fn(),
  signupMock: vi.fn(),
  signupRecruiterWithCompanyMock: vi.fn(),
  signupCollegeWithWorkspaceMock: vi.fn(),
  createSessionMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParamsMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/auth-action", () => ({
  signin: signinMock,
  completeOAuthLink: completeOAuthLinkMock,
  signup: signupMock,
  signupRecruiterWithCompany: signupRecruiterWithCompanyMock,
  signupCollegeWithWorkspace: signupCollegeWithWorkspaceMock,
  logout: logoutMock,
}));

vi.mock("@/lib/session", () => ({
  createSession: createSessionMock,
}));

describe("auth hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock.get.mockReturnValue(null);
  });

  it("signs in and routes by role", async () => {
    signinMock.mockResolvedValueOnce({
      success: true,
      data: { accessToken: "token-1", user: { role: "admin" } },
      message: "ok",
    });

    const { result } = renderHook(() => useSignIn());
    await act(async () => {
      await result.current.onSubmit({
        email: "admin@example.com",
        password: "Password12",
      });
    });

    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalledWith("token-1");
      expect(routerMock.replace).toHaveBeenCalledWith("/admin");
      expect(toastMock.success).toHaveBeenCalledWith("ok");
    });
  });

  it("handles sign-in error states and oauth linking", async () => {
    signinMock.mockResolvedValueOnce({
      success: false,
      message: "Invalid credentials",
      data: {},
    });

    const { result: first } = renderHook(() => useSignIn());
    await act(async () => {
      await first.current.onSubmit({
        email: "user@example.com",
        password: "Password12",
      });
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Invalid credentials");
    });

    searchParamsMock.get.mockReturnValue("link-token");
    signinMock.mockResolvedValueOnce({
      success: true,
      data: { accessToken: "token-1", user: { role: "user" } },
    });
    completeOAuthLinkMock.mockResolvedValueOnce({
      success: true,
      message: "linked",
      data: { accessToken: "linked-token" },
    });

    const { result: second } = renderHook(() => useSignIn());
    await act(async () => {
      await second.current.onSubmit({
        email: "user@example.com",
        password: "Password12",
      });
    });
    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalledWith("token-1");
      expect(createSessionMock).toHaveBeenCalledWith("linked-token");
      expect(routerMock.replace).toHaveBeenCalledWith("/overview");
      expect(toastMock.success).toHaveBeenCalledWith("linked");
    });

    searchParamsMock.get.mockReturnValue("link-token");
    signinMock.mockResolvedValueOnce({
      success: true,
      data: { accessToken: "token-1", user: { role: "user" } },
    });
    completeOAuthLinkMock.mockResolvedValueOnce({
      success: false,
      message: "link failed",
      data: {},
    });

    const { result: third } = renderHook(() => useSignIn());
    await act(async () => {
      await third.current.onSubmit({
        email: "user@example.com",
        password: "Password12",
      });
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("link failed");
      expect(routerMock.refresh).toHaveBeenCalled();
    });
  });

  it("handles sign-up for user/recruiter/college and failures", async () => {
    signupMock.mockResolvedValueOnce({ success: true, message: "created" });
    const { result } = renderHook(() => useSignUp());
    await act(async () => {
      await result.current.onSubmit({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "user",
        password: "Password12",
        confirmPassword: "Password12",
        companyName: "",
        companyIndustry: "",
        companyLocation: "",
        designation: "",
        collegeName: "",
        collegeInstitutionType: "",
        collegeLocation: "",
      });
    });
    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith("/sign-in");
      expect(toastMock.success).toHaveBeenCalledWith("created");
    });

    signupRecruiterWithCompanyMock.mockResolvedValueOnce({
      success: true,
      message: "workspace",
      data: { accessToken: "token-r", company: { id: "co-1" } },
    });
    await act(async () => {
      await result.current.onSubmit({
        firstName: "R",
        lastName: "User",
        email: "recruiter@example.com",
        role: "recruiter",
        password: "Password12",
        confirmPassword: "Password12",
        companyName: "Acme",
        companyIndustry: "IT",
        companyLocation: "Kathmandu",
        designation: "HR",
        collegeName: "",
        collegeInstitutionType: "",
        collegeLocation: "",
      });
    });
    await waitFor(() => {
      expect(createSessionMock).toHaveBeenCalledWith("token-r");
      expect(routerMock.replace).toHaveBeenCalledWith("/overview?workspace=co-1");
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    signupCollegeWithWorkspaceMock.mockResolvedValueOnce({
      success: true,
      data: { company: null, college: { id: "cl-1" } },
    });
    await act(async () => {
      await result.current.onSubmit({
        firstName: "C",
        lastName: "User",
        email: "college@example.com",
        role: "college",
        password: "Password12",
        confirmPassword: "Password12",
        companyName: "",
        companyIndustry: "",
        companyLocation: "",
        designation: "",
        collegeName: "State",
        collegeInstitutionType: "Public",
        collegeLocation: "Pokhara",
      });
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Workspace created, but session could not be created.",
      );
      expect(routerMock.push).toHaveBeenCalledWith("/sign-in");
    });
  });

  it("handles logout success and failure", async () => {
    logoutMock.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLogOut());
    await act(async () => {
      await result.current.onLogOut();
    });

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("Successfully logged out.");
      expect(routerMock.replace).toHaveBeenCalledWith("/sign-in");
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    logoutMock.mockRejectedValueOnce(new Error("logout-failed"));
    await act(async () => {
      await result.current.onLogOut();
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("logout-failed");
    });
  });
});


import {
  changePassword,
  completeOAuthLink,
  confirmPasswordReset,
  exchangeOAuthResult,
  getLinkedAccounts,
  getMe,
  getOAuthLinkAuthorizeUrl,
  logout,
  requestPasswordReset,
  signin,
  signup,
  signupCollegeWithWorkspace,
  signupRecruiterWithCompany,
  unlinkOAuthAccount,
  updateProfile,
  uploadCertificationMedia,
  verifyPasswordResetOtp,
} from "@/lib/actions/auth-action";
import type { TSignupSchema } from "@/app/(auth)/_schemas";
import { API_URLS } from "@/lib/api/endpoints";

type HeaderMap = Record<string, string | null | undefined>;

const {
  apiMock,
  multipartConfig,
  clearSessionMock,
  createCompanyMock,
  createCollegeMock,
  headersMock,
  headerState,
} = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  multipartConfig: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  },
  clearSessionMock: vi.fn(),
  createCompanyMock: vi.fn(),
  createCollegeMock: vi.fn(),
  headersMock: vi.fn(),
  headerState: {
    values: {} as HeaderMap,
  },
}));

vi.mock("@/lib/api/axios-instance", () => ({
  api: apiMock,
  MULTIPART_FORM_DATA_CONFIG: multipartConfig,
}));

vi.mock("@/lib/session", () => ({
  clearSession: clearSessionMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  createCompany: createCompanyMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  createCollege: createCollegeMock,
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

const asSignup = (overrides: Partial<TSignupSchema> = {}): TSignupSchema => ({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "Password12",
  confirmPassword: "Password12",
  role: "user",
  companyName: "",
  companyIndustry: "",
  companyLocation: "",
  designation: "",
  collegeName: "",
  collegeInstitutionType: "",
  collegeLocation: "",
  ...overrides,
});

const responseError = (message: string) => ({
  response: {
    data: { message },
  },
});

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headerState.values = {};
    headersMock.mockImplementation(async () => ({
      get: (key: string) => headerState.values[key] ?? null,
    }));
  });

  it("handles signup and signin success plus fallback errors", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true, id: "u-1" } });
    expect(await signup(asSignup())).toEqual({ success: true, id: "u-1" });
    expect(apiMock.post).toHaveBeenNthCalledWith(1, API_URLS.AUTH.SIGNUP, {
      name: "John Doe",
      email: "john@example.com",
      password: "Password12",
      confirmPassword: "Password12",
      role: "user",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { accessToken: "t" } } });
    expect(await signin({ email: "john@example.com", password: "Password12" })).toEqual({
      success: true,
      data: { accessToken: "t" },
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.AUTH.SIGNIN,
      { email: "john@example.com", password: "Password12" },
    );

    apiMock.post.mockRejectedValueOnce({});
    expect(await signup(asSignup())).toEqual({
      success: false,
      message: "Signup failed",
    });

    apiMock.post.mockRejectedValueOnce(responseError("signup-response"));
    expect(await signup(asSignup())).toEqual({
      success: false,
      message: "signup-response",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await signin({ email: "x", password: "y" })).toEqual({
      success: false,
      message: "Signin failed",
    });
  });

  it("completes recruiter signup flow with workspace creation", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: "acc-1", user: { role: "recruiter" } } },
    });
    createCompanyMock.mockResolvedValueOnce({
      success: true,
      data: { id: "co-1" },
    });

    expect(
      await signupRecruiterWithCompany(
        asSignup({
          role: "recruiter",
          companyName: " Acme ",
          companyIndustry: "IT",
          companyLocation: "Kathmandu",
          designation: "Engineer",
        }),
      ),
    ).toEqual({
      success: true,
      message: "Recruiter account and company workspace created.",
      data: {
        accessToken: "acc-1",
        user: { id: "u-1" },
        company: { id: "co-1" },
      },
    });
    expect(createCompanyMock).toHaveBeenCalledWith(
      {
        name: "Acme",
        industry: "IT",
        location: "Kathmandu",
        designation: "Engineer",
      },
      { accessToken: "acc-1" },
    );
  });

  it("validates recruiter and college signup preconditions and fallback branches", async () => {
    expect(await signupRecruiterWithCompany(asSignup({ role: "user" }))).toEqual({
      success: false,
      message: "Recruiter role is required for this flow.",
    });
    expect(await signupRecruiterWithCompany(asSignup({ role: "recruiter", companyName: " " }))).toEqual({
      success: false,
      message: "Company name is required for recruiter signup.",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({ data: { success: false, message: "signin-failed" } });
    expect(
      await signupRecruiterWithCompany(
        asSignup({ role: "recruiter", companyName: "Acme" }),
      ),
    ).toEqual({
      success: false,
      message: "signin-failed",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: {} } });
    expect(
      await signupRecruiterWithCompany(
        asSignup({ role: "recruiter", companyName: "Acme" }),
      ),
    ).toEqual({
      success: false,
      message:
        "Recruiter account created but sign-in failed. Please sign in manually.",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { accessToken: "acc" } } });
    createCompanyMock.mockResolvedValueOnce({ success: false });
    expect(
      await signupRecruiterWithCompany(
        asSignup({ role: "recruiter", companyName: "Acme" }),
      ),
    ).toEqual({
      success: false,
      message: "Recruiter account created but company setup failed.",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: false, message: "signup-reject" } });
    expect(
      await signupRecruiterWithCompany(
        asSignup({ role: "recruiter", companyName: "Acme" }),
      ),
    ).toEqual({
      success: false,
      message: "signup-reject",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: "acc" } },
    });
    createCompanyMock.mockRejectedValueOnce(new Error("company-throw"));
    expect(
      await signupRecruiterWithCompany(
        asSignup({ role: "recruiter", companyName: "Acme" }),
      ),
    ).toEqual({
      success: false,
      message: "company-throw",
    });
  });

  it("completes college signup flow and validates branches", async () => {
    expect(await signupCollegeWithWorkspace(asSignup({ role: "user" }))).toEqual({
      success: false,
      message: "College role is required for this flow.",
    });
    expect(await signupCollegeWithWorkspace(asSignup({ role: "college", collegeName: " " }))).toEqual({
      success: false,
      message: "College name is required for college signup.",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: "acc-1" } },
    });
    createCollegeMock.mockResolvedValueOnce({ success: true, data: { id: "cl-1" } });
    expect(
      await signupCollegeWithWorkspace(
        asSignup({
          role: "college",
          collegeName: "  State College ",
          collegeInstitutionType: "Public",
          collegeLocation: "Pokhara",
        }),
      ),
    ).toEqual({
      success: true,
      message: "College account and workspace created.",
      data: {
        accessToken: "acc-1",
        user: { id: "u-1" },
        college: { id: "cl-1" },
      },
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: {} } });
    expect(
      await signupCollegeWithWorkspace(
        asSignup({ role: "college", collegeName: "A" }),
      ),
    ).toEqual({
      success: false,
      message:
        "College account created but sign-in failed. Please sign in manually.",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: "acc-1" } },
    });
    createCollegeMock.mockResolvedValueOnce({ success: false });
    expect(
      await signupCollegeWithWorkspace(
        asSignup({ role: "college", collegeName: "A" }),
      ),
    ).toEqual({
      success: false,
      message: "College account created but workspace setup failed.",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true, data: { id: "u-1" } } });
    apiMock.post.mockResolvedValueOnce({
      data: { success: true, data: { accessToken: "acc-1" } },
    });
    createCollegeMock.mockRejectedValueOnce(new Error("college-throw"));
    expect(
      await signupCollegeWithWorkspace(
        asSignup({ role: "college", collegeName: "A" }),
      ),
    ).toEqual({
      success: false,
      message: "college-throw",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: false, message: "signup-college-reject" } });
    expect(
      await signupCollegeWithWorkspace(
        asSignup({ role: "college", collegeName: "A" }),
      ),
    ).toEqual({
      success: false,
      message: "signup-college-reject",
    });
  });

  it("handles oauth exchange/link and linked account endpoints", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await exchangeOAuthResult("token-1")).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(1, API_URLS.AUTH.OAUTH_EXCHANGE, {
      resultToken: "token-1",
    });

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await completeOAuthLink("link-1")).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.AUTH.OAUTH_LINK_COMPLETE,
      { linkToken: "link-1" },
    );

    apiMock.get.mockResolvedValueOnce({ data: { success: true } });
    expect(await getLinkedAccounts()).toEqual({ success: true });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.AUTH.OAUTH_LINKED_ACCOUNTS);

    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await unlinkOAuthAccount("google")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(API_URLS.AUTH.OAUTH_UNLINK("google"));
  });

  it("builds oauth link authorize URL from incoming headers", async () => {
    headerState.values = {
      host: "localhost:3001",
      "x-forwarded-proto": "https",
    };

    apiMock.get.mockResolvedValueOnce({
      headers: {
        location: "https://accounts.google.com/oauth",
      },
    });

    expect(await getOAuthLinkAuthorizeUrl("google", "/settings")).toEqual({
      success: true,
      message: "Link flow initiated.",
      data: {
        authorizeUrl: "https://accounts.google.com/oauth",
      },
    });

    const [, config] = apiMock.get.mock.calls[0];
    const redirectUri = config.params.redirectUri as string;
    expect(redirectUri).toContain("/oauth/callback");
    expect(redirectUri).toContain("next=%2Fsettings");
    expect(redirectUri).toContain("mode=link");
    expect(config.validateStatus(302)).toBe(true);
    expect(config.validateStatus(200)).toBe(false);
  });

  it("handles oauth authorize URL failure branches", async () => {
    headerState.values = {};
    expect(await getOAuthLinkAuthorizeUrl("google")).toEqual({
      success: false,
      message: "Unable to resolve app URL for account linking.",
    });

    headerState.values = { host: "localhost:3001" };
    apiMock.get.mockResolvedValueOnce({ headers: {} });
    expect(await getOAuthLinkAuthorizeUrl("google")).toEqual({
      success: false,
      message: "Unable to start account linking right now.",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getOAuthLinkAuthorizeUrl("google")).toEqual({
      success: false,
      message: "Failed to initialize account linking",
    });
  });

  it("handles getMe, updateProfile, upload media and logout", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true } });
    expect(await getMe()).toEqual({ success: true });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.AUTH.ME);

    const profileData = new FormData();
    profileData.append("name", "John");
    apiMock.put.mockResolvedValueOnce({ data: { success: true } });
    expect(await updateProfile(profileData)).toEqual({ success: true });
    expect(apiMock.put).toHaveBeenCalledWith(
      API_URLS.AUTH.UPDATE_ME,
      profileData,
      multipartConfig,
    );

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    const file = new File(["proof"], "proof.png", { type: "image/png" });
    expect(await uploadCertificationMedia(file)).toEqual({ success: true });
    const [url, formData, config] = apiMock.post.mock.calls.at(-1)!;
    expect(url).toBe(API_URLS.AUTH.CERTIFICATION_UPLOAD);
    expect(Array.from((formData as FormData).entries())).toContainEqual(["file", file]);
    expect(config).toBe(multipartConfig);

    await logout();
    expect(clearSessionMock).toHaveBeenCalled();
  });

  it("handles change password typed error extraction", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true, message: "done" } });
    expect(
      await changePassword({
        currentPassword: "old",
        newPassword: "new",
        confirmNewPassword: "new",
      }),
    ).toEqual({ success: true, message: "done" });

    apiMock.post.mockRejectedValueOnce({
      response: { data: { message: "bad-password" } },
    });
    expect(
      await changePassword({
        currentPassword: "old",
        newPassword: "new",
        confirmNewPassword: "new",
      }),
    ).toEqual({ success: false, message: "bad-password" });

    apiMock.post.mockRejectedValueOnce({});
    expect(
      await changePassword({
        currentPassword: "old",
        newPassword: "new",
        confirmNewPassword: "new",
      }),
    ).toEqual({ success: false, message: "Failed to change password." });
  });

  it("sends password reset metadata headers and handles reset endpoints", async () => {
    headerState.values = {
      "x-forwarded-for": "1.1.1.1, 2.2.2.2",
      "user-agent": "UnitTest",
    };

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await requestPasswordReset({ email: "john@example.com" })).toEqual({
      success: true,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      1,
      API_URLS.AUTH.PASSWORD_RESET_REQUEST,
      { email: "john@example.com" },
      {
        headers: {
          "x-client-ip": "1.1.1.1",
          "x-client-user-agent": "UnitTest",
        },
      },
    );

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(await verifyPasswordResetOtp({ email: "john@example.com", otp: "123456" })).toEqual({
      success: true,
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.AUTH.PASSWORD_RESET_VERIFY,
      { email: "john@example.com", otp: "123456" },
      {
        headers: {
          "x-client-ip": "1.1.1.1",
          "x-client-user-agent": "UnitTest",
        },
      },
    );

    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    expect(
      await confirmPasswordReset({
        token: "t",
        password: "Password12",
        confirmPassword: "Password12",
      }),
    ).toEqual({ success: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(
      3,
      API_URLS.AUTH.PASSWORD_RESET_CONFIRM,
      {
        token: "t",
        password: "Password12",
        confirmPassword: "Password12",
      },
      {
        headers: {
          "x-client-ip": "1.1.1.1",
          "x-client-user-agent": "UnitTest",
        },
      },
    );
  });

  it("returns default fallbacks for remaining auth endpoints", async () => {
    apiMock.post.mockRejectedValueOnce({});
    expect(await exchangeOAuthResult("x")).toEqual({
      success: false,
      message: "Failed to complete social authentication",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await completeOAuthLink("x")).toEqual({
      success: false,
      message: "Failed to link social account",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getLinkedAccounts()).toEqual({
      success: false,
      message: "Failed to load linked accounts",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await unlinkOAuthAccount("github")).toEqual({
      success: false,
      message: "Failed to unlink account",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getMe()).toEqual({
      success: false,
      message: "Fetching user failed",
    });

    apiMock.put.mockRejectedValueOnce({});
    expect(await updateProfile(new FormData())).toEqual({
      success: false,
      message: "Failed to update profile",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await uploadCertificationMedia(new File(["x"], "x.png"))).toEqual({
      success: false,
      message: "Failed to upload certification media",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await requestPasswordReset({ email: "x@y.com" })).toEqual({
      success: false,
      message: "Failed to request password reset",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await verifyPasswordResetOtp({ email: "x@y.com", otp: "111111" })).toEqual({
      success: false,
      message: "Failed to verify reset code",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(
      await confirmPasswordReset({
        token: "t",
        password: "Password12",
        confirmPassword: "Password12",
      }),
    ).toEqual({
      success: false,
      message: "Failed to reset password",
    });
  });
});

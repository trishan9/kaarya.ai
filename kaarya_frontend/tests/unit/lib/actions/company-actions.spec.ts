import {
  createCompany,
  getCompanyById,
  inviteRecruiterToCompany,
  joinCompanyByCode,
  listCompanies,
  listCompanyRecruiters,
  listRecruiterWorkspaces,
  removeRecruiterFromCompany,
  resetCompanyInviteCode,
  updateCompany,
} from "@/lib/actions/company-actions";
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

describe("company actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists recruiter workspaces/companies/recruiters with normalized params", async () => {
    apiMock.get.mockResolvedValue({ data: { success: true } });

    await listRecruiterWorkspaces({ page: 1, size: 15 });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      1,
      API_URLS.COMPANY.WORKSPACES_ME,
      { params: { page: 1, size: 15 } },
    );

    await listCompanies({ page: 2, size: 25, search: "  acme " });
    expect(apiMock.get).toHaveBeenNthCalledWith(2, API_URLS.COMPANY.LIST, {
      params: { page: 2, size: 25, search: "acme" },
    });

    await listCompanyRecruiters("co-1", { page: 1, size: 10 });
    expect(apiMock.get).toHaveBeenNthCalledWith(
      3,
      API_URLS.COMPANY.RECRUITERS("co-1"),
      { params: { page: 1, size: 10 } },
    );
  });

  it("creates company with multipart payload and auth header", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });
    const file = new File(["logo"], "logo.png", { type: "image/png" });

    await createCompany(
      {
        name: "  Acme  ",
        industry: "  IT ",
        location: "  Kathmandu ",
        designation: "  Engineer ",
        verifiedStatus: true,
        logo: file,
      },
      { accessToken: "token-1" },
    );

    const [url, formData, config] = apiMock.post.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.COMPANY.LIST);
    expect(entries).toContainEqual(["name", "Acme"]);
    expect(entries).toContainEqual(["industry", "IT"]);
    expect(entries).toContainEqual(["location", "Kathmandu"]);
    expect(entries).toContainEqual(["designation", "Engineer"]);
    expect(entries).toContainEqual(["verifiedStatus", "true"]);
    expect(entries).toContainEqual(["logo", file]);
    expect(config).toEqual({
      headers: {
        ...multipartConfig.headers,
        Authorization: "Bearer token-1",
      },
    });
  });

  it("updates company with normalized multipart payload", async () => {
    apiMock.patch.mockResolvedValueOnce({ data: { success: true } });
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    await updateCompany("co-1", {
      name: "  New Name ",
      industry: "  Finance ",
      location: "  Pokhara ",
      verifiedStatus: false,
      logo: file,
    });

    const [url, formData, config] = apiMock.patch.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.COMPANY.BY_ID("co-1"));
    expect(entries).toContainEqual(["name", "New Name"]);
    expect(entries).toContainEqual(["industry", "Finance"]);
    expect(entries).toContainEqual(["location", "Pokhara"]);
    expect(entries).toContainEqual(["verifiedStatus", "false"]);
    expect(entries).toContainEqual(["logo", file]);
    expect(config).toEqual({ headers: { ...multipartConfig.headers } });
  });

  it("joins/resets/invites/removes company users", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true } });
    apiMock.delete.mockResolvedValue({ data: { success: true } });

    await joinCompanyByCode({ inviteCode: "  CODE  ", designation: "  HR " });
    expect(apiMock.post).toHaveBeenNthCalledWith(1, API_URLS.COMPANY.JOIN_BY_CODE, {
      inviteCode: "CODE",
      designation: "HR",
    });

    await resetCompanyInviteCode("co-1");
    expect(apiMock.post).toHaveBeenNthCalledWith(
      2,
      API_URLS.COMPANY.INVITE_CODE_RESET("co-1"),
    );

    await inviteRecruiterToCompany("co-1", {
      email: "  HR@ACME.COM ",
      designation: "  Recruiter ",
    });
    expect(apiMock.post).toHaveBeenNthCalledWith(3, API_URLS.COMPANY.INVITES("co-1"), {
      email: "hr@acme.com",
      designation: "Recruiter",
    });

    await removeRecruiterFromCompany("co-1", "r-1");
    expect(apiMock.delete).toHaveBeenCalledWith(
      API_URLS.COMPANY.RECRUITER_BY_ID("co-1", "r-1"),
    );
  });

  it("gets company by id", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, id: "co-1" } });
    expect(await getCompanyById("co-1")).toEqual({ success: true, id: "co-1" });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.COMPANY.BY_ID("co-1"));
  });

  it("returns fallback error variants", async () => {
    apiMock.get.mockRejectedValueOnce(responseError("workspace-response"));
    expect(await listRecruiterWorkspaces()).toEqual({
      success: false,
      message: "workspace-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("companies-runtime"));
    expect(await listCompanies()).toEqual({
      success: false,
      message: "companies-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await listCompanyRecruiters("co-1")).toEqual({
      success: false,
      message: "Failed to load company members",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await createCompany({ name: "A" })).toEqual({
      success: false,
      message: "Failed to create company",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getCompanyById("co-1")).toEqual({
      success: false,
      message: "Failed to load company",
    });

    apiMock.patch.mockRejectedValueOnce({});
    expect(await updateCompany("co-1", {})).toEqual({
      success: false,
      message: "Failed to update company",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await joinCompanyByCode({ inviteCode: "x" })).toEqual({
      success: false,
      message: "Failed to join company",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await resetCompanyInviteCode("co-1")).toEqual({
      success: false,
      message: "Failed to reset invite code",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await inviteRecruiterToCompany("co-1", { email: "x@y.com" })).toEqual({
      success: false,
      message: "Failed to send recruiter invitation",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await removeRecruiterFromCompany("co-1", "r-1")).toEqual({
      success: false,
      message: "Failed to remove recruiter",
    });
  });
});


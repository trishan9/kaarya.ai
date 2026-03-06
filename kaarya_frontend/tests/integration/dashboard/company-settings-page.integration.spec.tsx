import { render, screen } from "@testing-library/react";
import CompanySettingsPage from "@/app/(protected)/(dashboard)/company-settings/page";
import { Role } from "@/lib/definitions";

const {
  redirectMock,
  getCurrentUserMock,
  listRecruiterWorkspacesMock,
  listCompanyRecruitersMock,
  getCompanyByIdMock,
  companySettingsPanelMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  getCurrentUserMock: vi.fn(),
  listRecruiterWorkspacesMock: vi.fn(),
  listCompanyRecruitersMock: vi.fn(),
  getCompanyByIdMock: vi.fn(),
  companySettingsPanelMock: vi.fn(() => (
    <div data-testid="company-settings-panel">Company settings panel</div>
  )),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/dal", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  listRecruiterWorkspaces: listRecruiterWorkspacesMock,
  listCompanyRecruiters: listCompanyRecruitersMock,
  getCompanyById: getCompanyByIdMock,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/company-settings/_components/company-settings-panel",
  () => ({
    CompanySettingsPanel: companySettingsPanelMock,
  }),
);

vi.mock("@/app/(protected)/(dashboard)/_components/dashboard-header", () => ({
  DashboardHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe("CompanySettingsPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects when user is not a recruiter", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1", role: Role.USER });

    await expect(
      CompanySettingsPage({ searchParams: Promise.resolve({ workspace: "co-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/overview");

    expect(redirectMock).toHaveBeenCalledWith("/overview");
  });

  it("renders no-workspace fallback when recruiter has no company workspace", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "rec-1", role: Role.RECRUITER });
    listRecruiterWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    const page = await CompanySettingsPage({
      searchParams: Promise.resolve({ workspace: "missing-workspace" }),
    });

    render(page);

    expect(screen.getByText("No workspace selected")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Overview" })).toHaveAttribute(
      "href",
      "/overview",
    );
    expect(companySettingsPanelMock).not.toHaveBeenCalled();
  });

  it("resolves active workspace and passes fetched data into panel", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "rec-1", role: Role.RECRUITER });
    listRecruiterWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [
          {
            company: {
              id: "co-1",
              name: "Alpha",
              logo: "alpha-logo",
              inviteCode: "ALPHA-INV",
            },
          },
          {
            company: {
              id: "co-2",
              name: "Beta",
              logo: "beta-logo",
              inviteCode: "BETA-INV",
            },
          },
        ],
      },
    });

    listCompanyRecruitersMock.mockResolvedValue({
      data: {
        members: [{ id: "member-1" }],
        workspace: {
          inviteCode: "LIVE-INV",
        },
      },
    });

    getCompanyByIdMock.mockResolvedValue({
      data: {
        name: "Beta Company",
        industry: "Technology",
        location: "Kathmandu",
        logo: "beta-company-logo",
      },
    });

    const page = await CompanySettingsPage({
      searchParams: Promise.resolve({ workspace: "co-2" }),
    });

    render(page);

    expect(screen.getByTestId("company-settings-panel")).toBeInTheDocument();

    expect(listCompanyRecruitersMock).toHaveBeenCalledWith("co-2", {
      page: 1,
      size: 100,
    });
    expect(getCompanyByIdMock).toHaveBeenCalledWith("co-2");

    const panelProps = companySettingsPanelMock.mock.calls[0]?.[0];
    expect(panelProps).toEqual(
      expect.objectContaining({
        companyId: "co-2",
        workspaceName: "Beta Company",
        workspaceLogo: "beta-company-logo",
        workspaceIndustry: "Technology",
        workspaceLocation: "Kathmandu",
        inviteCode: "LIVE-INV",
        currentUserId: "rec-1",
      }),
    );
    expect(panelProps.members).toEqual([{ id: "member-1" }]);
  });
});

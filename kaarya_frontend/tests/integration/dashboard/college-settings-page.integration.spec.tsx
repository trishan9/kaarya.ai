import { render, screen } from "@testing-library/react";
import CollegeSettingsPage from "@/app/(protected)/(dashboard)/college-settings/page";
import { Role } from "@/lib/definitions";

const {
  redirectMock,
  getCurrentUserMock,
  listCollegeWorkspacesMock,
  listCollegeStudentsMock,
  getCollegeMetricsMock,
  getCollegeByIdMock,
  collegeSettingsPanelMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  getCurrentUserMock: vi.fn(),
  listCollegeWorkspacesMock: vi.fn(),
  listCollegeStudentsMock: vi.fn(),
  getCollegeMetricsMock: vi.fn(),
  getCollegeByIdMock: vi.fn(),
  collegeSettingsPanelMock: vi.fn(() => (
    <div data-testid="college-settings-panel">College settings panel</div>
  )),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/dal", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  listCollegeWorkspaces: listCollegeWorkspacesMock,
  listCollegeStudents: listCollegeStudentsMock,
  getCollegeMetrics: getCollegeMetricsMock,
  getCollegeById: getCollegeByIdMock,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/college-settings/_components/college-settings-panel",
  () => ({
    CollegeSettingsPanel: collegeSettingsPanelMock,
  }),
);

vi.mock("@/app/(protected)/(dashboard)/_components/dashboard-header", () => ({
  DashboardHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe("CollegeSettingsPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects when user is not a college user", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1", role: Role.USER });

    await expect(
      CollegeSettingsPage({
        searchParams: Promise.resolve({ workspace: "cl-1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/overview");

    expect(redirectMock).toHaveBeenCalledWith("/overview");
  });

  it("renders no-workspace fallback when no college workspace exists", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "col-1", role: Role.COLLEGE });
    listCollegeWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });

    const page = await CollegeSettingsPage({
      searchParams: Promise.resolve({ workspace: "missing" }),
    });

    render(page);

    expect(screen.getByText("No workspace selected")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Overview" }),
    ).toHaveAttribute("href", "/overview");
    expect(collegeSettingsPanelMock).not.toHaveBeenCalled();
  });

  it("fetches students/metrics/college and passes mapped props to panel", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "col-1", role: Role.COLLEGE });
    listCollegeWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [
          {
            college: {
              id: "cl-1",
              name: "Alpha College",
              logo: "alpha-logo",
              inviteCode: "ALPHA-INV",
            },
          },
          {
            college: {
              id: "cl-2",
              name: "Beta College",
              logo: "beta-logo",
              inviteCode: "BETA-INV",
            },
          },
        ],
      },
    });

    listCollegeStudentsMock.mockResolvedValue({
      data: {
        students: [{ id: "student-1" }],
        workspace: {
          inviteCode: "ACTIVE-INV",
        },
      },
    });

    getCollegeMetricsMock.mockResolvedValue({
      data: {
        summary: {
          students: 10,
        },
      },
    });

    getCollegeByIdMock.mockResolvedValue({
      data: {
        name: "Beta Engineering College",
        institutionType: "Engineering",
        location: "Pokhara",
        logo: "beta-college-logo",
      },
    });

    const page = await CollegeSettingsPage({
      searchParams: Promise.resolve({ workspace: "cl-2" }),
    });

    render(page);

    expect(screen.getByTestId("college-settings-panel")).toBeInTheDocument();

    expect(listCollegeStudentsMock).toHaveBeenCalledWith("cl-2", {
      page: 1,
      size: 200,
    });
    expect(getCollegeMetricsMock).toHaveBeenCalledWith("cl-2");
    expect(getCollegeByIdMock).toHaveBeenCalledWith("cl-2");

    const panelProps = collegeSettingsPanelMock.mock.calls[0]?.[0];
    expect(panelProps).toEqual(
      expect.objectContaining({
        collegeId: "cl-2",
        workspaceName: "Beta Engineering College",
        workspaceLogo: "beta-college-logo",
        workspaceInstitutionType: "Engineering",
        workspaceLocation: "Pokhara",
        inviteCode: "ACTIVE-INV",
        currentUserId: "col-1",
      }),
    );
    expect(panelProps.members).toEqual([{ id: "student-1" }]);
    expect(panelProps.metrics).toEqual({
      summary: {
        students: 10,
      },
    });
  });
});

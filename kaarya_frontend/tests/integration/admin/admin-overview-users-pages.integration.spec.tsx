import { render, screen } from "@testing-library/react";
import AdminDashboardPage from "@/app/(protected)/admin/page";
import AdminUsersPage from "@/app/(protected)/admin/users/page";
import AdminUserCreatePage from "@/app/(protected)/admin/users/create/page";
import AdminUserDetailPage from "@/app/(protected)/admin/users/[id]/page";
import AdminUserEditPage from "@/app/(protected)/admin/users/[id]/edit/page";
import { Role } from "@/lib/definitions";

const {
  getAdminUsersMock,
  getAdminUsersAnalyticsMock,
  getAdminUserByIdMock,
  listCompaniesMock,
  listCollegesMock,
  getJobsMock,
  listInterviewsMock,
  usersTableMock,
  editUserFormMock,
} = vi.hoisted(() => ({
  getAdminUsersMock: vi.fn(),
  getAdminUsersAnalyticsMock: vi.fn(),
  getAdminUserByIdMock: vi.fn(),
  listCompaniesMock: vi.fn(),
  listCollegesMock: vi.fn(),
  getJobsMock: vi.fn(),
  listInterviewsMock: vi.fn(),
  usersTableMock: vi.fn(() => <div data-testid="users-table">users-table</div>),
  editUserFormMock: vi.fn(() => <div data-testid="edit-user-form">edit-user-form</div>),
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

vi.mock("@/lib/actions/admin/admin-user-actions", () => ({
  getAdminUsers: getAdminUsersMock,
  getAdminUsersAnalytics: getAdminUsersAnalyticsMock,
  getAdminUserById: getAdminUserByIdMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  listCompanies: listCompaniesMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  listColleges: listCollegesMock,
}));

vi.mock("@/lib/actions/job-actions", () => ({
  getJobs: getJobsMock,
}));

vi.mock("@/lib/actions/interview-actions", () => ({
  listInterviews: listInterviewsMock,
}));

vi.mock("@/app/(protected)/(dashboard)/_components/dashboard-header", () => ({
  DashboardHeader: ({
    title,
    actions,
  }: {
    title: string;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="dashboard-header">
      <span>{title}</span>
      <div>{actions}</div>
    </div>
  ),
}));

vi.mock("@/app/(protected)/admin/users/_components/growth-chart", () => ({
  GrowthChart: () => <div data-testid="growth-chart">growth-chart</div>,
}));

vi.mock("@/app/(protected)/admin/users/_components/role-distribution-chart", () => ({
  RoleDistributionChart: () => (
    <div data-testid="role-distribution-chart">role-distribution-chart</div>
  ),
}));

vi.mock("@/app/(protected)/admin/users/_components/acquisition-chart", () => ({
  AcquisitionChart: () => <div data-testid="acquisition-chart">acquisition-chart</div>,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/overview/_components/overview-analytics-charts",
  () => ({
    OverviewAnalyticsCharts: () => (
      <div data-testid="overview-analytics-charts">overview-analytics-charts</div>
    ),
  }),
);

vi.mock("@/app/(protected)/admin/users/_components/user-analytics", () => ({
  AdminUsersAnalytics: () => (
    <div data-testid="admin-users-analytics">admin-users-analytics</div>
  ),
}));

vi.mock("@/app/(protected)/admin/users/_components/users-table", () => ({
  UsersTable: usersTableMock,
}));

vi.mock("@/app/(protected)/admin/users/_components/create-user-form", () => ({
  CreateUserForm: () => <div data-testid="create-user-form">create-user-form</div>,
}));

vi.mock("@/app/(protected)/admin/users/[id]/_components/user-profile-card", () => ({
  UserProfileCard: () => <div data-testid="user-profile-card">user-profile-card</div>,
}));

vi.mock("@/app/(protected)/admin/users/[id]/_components/quick-actions-card", () => ({
  QuickActionsCard: () => <div data-testid="quick-actions-card">quick-actions-card</div>,
}));

vi.mock("@/app/(protected)/admin/users/[id]/_components/user-not-found", () => ({
  UserNotFound: () => <div data-testid="user-not-found">user-not-found</div>,
}));

vi.mock("@/app/(protected)/admin/users/_components/edit-user-form", () => ({
  EditUserForm: editUserFormMock,
}));

vi.mock("@/app/(protected)/admin/users/[id]/edit/_components/user-not-found", () => ({
  UserNotFound: () => <div data-testid="edit-user-not-found">edit-user-not-found</div>,
}));

describe("Admin overview and users pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getAdminUsersAnalyticsMock.mockResolvedValue({
      success: true,
      data: {
        totalUsers: 42,
        totalAdmins: 2,
        totalStandardUsers: 40,
        newThisWeek: 5,
        signupTrend: [
          { label: "Jan", value: 4 },
          { label: "Feb", value: 6 },
        ],
        roleBreakdown: [
          { name: "admin", value: 2 },
          { name: "user", value: 40 },
        ],
      },
    });

    getAdminUsersMock.mockResolvedValue({
      success: true,
      data: {
        users: [
          {
            id: "user-1",
            name: "Jane Doe",
            email: "jane@example.com",
            role: Role.USER,
          },
        ],
        meta: {
          page: 1,
          size: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });

    getAdminUserByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "user-1",
        name: "Jane Doe",
        email: "jane@example.com",
        role: Role.USER,
        provider: "email",
        photo: null,
      },
    });

    listCompaniesMock.mockResolvedValue({
      success: true,
      data: {
        meta: {
          totalItems: 3,
        },
      },
    });

    listCollegesMock.mockResolvedValue({
      success: true,
      data: {
        meta: {
          totalItems: 2,
        },
      },
    });

    getJobsMock.mockImplementation(async (params?: { status?: string; size?: number }) => {
      if (params?.status === "open") {
        return { success: true, data: { meta: { totalItems: 5 } } };
      }
      if (params?.status === "draft") {
        return { success: true, data: { meta: { totalItems: 2 } } };
      }
      if (params?.status === "closed") {
        return { success: true, data: { meta: { totalItems: 1 } } };
      }
      return {
        success: true,
        data: {
          jobs: [{ id: "job-1", title: "Platform Engineer" }],
          meta: { totalItems: 8 },
        },
      };
    });

    listInterviewsMock.mockResolvedValue({
      success: true,
      data: {
        interviews: [{ id: "interview-1", title: "System Design Round" }],
        meta: {
          totalItems: 4,
        },
      },
    });
  });

  it("renders admin dashboard analytics and highlights", async () => {
    render(await AdminDashboardPage());

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Overview");
    expect(screen.getByText("Platform Control Center")).toBeInTheDocument();
    expect(screen.getByTestId("overview-analytics-charts")).toBeInTheDocument();
    expect(screen.getByTestId("growth-chart")).toBeInTheDocument();
    expect(screen.getByText("Platform Engineer")).toBeInTheDocument();
    expect(screen.getByText("System Design Round")).toBeInTheDocument();
    expect(getJobsMock).toHaveBeenCalledWith(expect.objectContaining({ status: "open" }));
    expect(getJobsMock).toHaveBeenCalledWith(expect.objectContaining({ status: "draft" }));
    expect(getJobsMock).toHaveBeenCalledWith(expect.objectContaining({ status: "closed" }));
  });

  it("renders admin dashboard empty highlights fallback", async () => {
    getJobsMock.mockResolvedValue({
      success: true,
      data: {
        jobs: [],
        meta: {
          totalItems: 0,
        },
      },
    });
    listInterviewsMock.mockResolvedValueOnce({
      success: true,
      data: {
        interviews: [],
        meta: {
          totalItems: 0,
        },
      },
    });

    render(await AdminDashboardPage());

    expect(screen.getByText("No job records available in this view.")).toBeInTheDocument();
    expect(
      screen.getByText("No interview records available in this view."),
    ).toBeInTheDocument();
  });

  it("renders users page with analytics and paginated table data", async () => {
    render(
      await AdminUsersPage({
        searchParams: Promise.resolve({
          page: "2",
          size: "20",
          search: "jane",
        }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Users");
    expect(screen.getByTestId("admin-users-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("users-table")).toBeInTheDocument();
    expect(getAdminUsersMock).toHaveBeenCalledWith({
      page: 2,
      size: 20,
      search: "jane",
    });
    expect(usersTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        users: [
          expect.objectContaining({
            id: "user-1",
          }),
        ],
        errorMessage: undefined,
      }),
      undefined,
    );
  });

  it("handles users page API failures and omits analytics widget", async () => {
    getAdminUsersMock.mockResolvedValueOnce({
      success: false,
      message: "Failed to fetch users",
    });
    getAdminUsersAnalyticsMock.mockResolvedValueOnce({
      success: false,
      message: "analytics unavailable",
    });

    render(
      await AdminUsersPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.queryByTestId("admin-users-analytics")).not.toBeInTheDocument();
    expect(usersTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        users: [],
        errorMessage: "Failed to fetch users",
      }),
      undefined,
    );
  });

  it("renders admin create user page with form", () => {
    render(<AdminUserCreatePage />);

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Create User");
    expect(screen.getByTestId("create-user-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to users/i })).toHaveAttribute(
      "href",
      "/admin/users",
    );
  });

  it("renders admin user detail page with profile actions", async () => {
    render(
      await AdminUserDetailPage({
        params: Promise.resolve({ id: "user-1" }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("User Details");
    expect(screen.getByTestId("user-profile-card")).toBeInTheDocument();
    expect(screen.getByTestId("quick-actions-card")).toBeInTheDocument();
    expect(getAdminUserByIdMock).toHaveBeenCalledWith("user-1");
  });

  it("renders user not found state in admin user detail page", async () => {
    getAdminUserByIdMock.mockResolvedValueOnce({
      success: false,
      data: undefined,
    });

    render(
      await AdminUserDetailPage({
        params: Promise.resolve({ id: "missing-user" }),
      }),
    );

    expect(screen.getByTestId("user-not-found")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-header")).not.toBeInTheDocument();
  });

  it("renders admin user edit page and maps initial form values", async () => {
    getAdminUserByIdMock.mockResolvedValueOnce({
      success: true,
      data: {
        id: "admin-2",
        name: "Platform Admin",
        email: "admin2@example.com",
        role: Role.ADMIN,
        provider: "google",
        photo: "https://example.com/photo.png",
      },
    });

    render(
      await AdminUserEditPage({
        params: Promise.resolve({ id: "admin-2" }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Edit User");
    expect(screen.getByTestId("edit-user-form")).toBeInTheDocument();
    expect(editUserFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-2",
        initialValues: {
          name: "Platform Admin",
          email: "admin2@example.com",
          role: "admin",
          provider: "google",
        },
        imageUrl: "https://example.com/photo.png",
      }),
      undefined,
    );
  });

  it("renders user not found state in admin user edit page", async () => {
    getAdminUserByIdMock.mockResolvedValueOnce({
      success: false,
      data: undefined,
    });

    render(
      await AdminUserEditPage({
        params: Promise.resolve({ id: "missing-user" }),
      }),
    );

    expect(screen.getByTestId("edit-user-not-found")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-header")).not.toBeInTheDocument();
  });
});

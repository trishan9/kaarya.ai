import { render, screen } from "@testing-library/react";
import MyApplicationsPage from "@/app/(protected)/(dashboard)/applications/page";
import BlogsPage from "@/app/(protected)/(dashboard)/blogs/page";
import InterviewHubPage from "@/app/(protected)/(dashboard)/interview-hub/page";
import InboxPage from "@/app/(protected)/(dashboard)/inbox/page";
import MyInterviewsPage from "@/app/(protected)/(dashboard)/interviews/page";
import JobsPage from "@/app/(protected)/(dashboard)/jobs/page";
import ResourcesPage from "@/app/(protected)/(dashboard)/resources/page";
import SavedPage from "@/app/(protected)/(dashboard)/saved/page";
import ResumeBuilderPage from "@/app/(protected)/(dashboard)/resume/page";
import SettingsPage from "@/app/(protected)/(dashboard)/settings/page";
import LeaderboardPage from "@/app/(protected)/(dashboard)/leaderboard/page";
import OverviewPage from "@/app/(protected)/(dashboard)/overview/page";
import { Role } from "@/lib/definitions";

const {
  redirectMock,
  getCurrentUserMock,
  getMyApplicationsPageDataMock,
  getBlogsPageDataMock,
  getInterviewHubPageDataMock,
  getInboxPageDataMock,
  getMyInterviewsPageDataMock,
  getExploreJobsPageDataMock,
  listResourceCoursesMock,
  getSavedPageDataMock,
  getMyResumesMock,
  listRecruiterWorkspacesMock,
  listCollegeWorkspacesMock,
  getLeaderboardMock,
  getOverviewDashboardDataMock,
  getRecruiterOverviewDashboardDataMock,
  computeProfileRatingMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  getCurrentUserMock: vi.fn(),
  getMyApplicationsPageDataMock: vi.fn(),
  getBlogsPageDataMock: vi.fn(),
  getInterviewHubPageDataMock: vi.fn(),
  getInboxPageDataMock: vi.fn(),
  getMyInterviewsPageDataMock: vi.fn(),
  getExploreJobsPageDataMock: vi.fn(),
  listResourceCoursesMock: vi.fn(),
  getSavedPageDataMock: vi.fn(),
  getMyResumesMock: vi.fn(),
  listRecruiterWorkspacesMock: vi.fn(),
  listCollegeWorkspacesMock: vi.fn(),
  getLeaderboardMock: vi.fn(),
  getOverviewDashboardDataMock: vi.fn(),
  getRecruiterOverviewDashboardDataMock: vi.fn(),
  computeProfileRatingMock: vi.fn(),
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

vi.mock("@/lib/actions/job-actions", () => ({
  getMyResumes: getMyResumesMock,
}));

vi.mock("@/lib/actions/resource-actions", () => ({
  listResourceCourses: listResourceCoursesMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  listRecruiterWorkspaces: listRecruiterWorkspacesMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  listCollegeWorkspaces: listCollegeWorkspacesMock,
  getLeaderboard: getLeaderboardMock,
}));

vi.mock("@/lib/compute-profile-rating", () => ({
  computeProfileRating: computeProfileRatingMock,
}));

vi.mock("@/app/(protected)/(dashboard)/applications/applications-data", () => ({
  getMyApplicationsPageData: getMyApplicationsPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/blogs/blogs-data", () => ({
  getBlogsPageData: getBlogsPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/interview-hub/interview-hub-data", () => ({
  getInterviewHubPageData: getInterviewHubPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/inbox/inbox-data", () => ({
  getInboxPageData: getInboxPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/interviews/interviews-data", () => ({
  getMyInterviewsPageData: getMyInterviewsPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/jobs/jobs-data", () => ({
  getExploreJobsPageData: getExploreJobsPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/saved/saved-data", () => ({
  getSavedPageData: getSavedPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/overview/overview-data", () => ({
  getOverviewDashboardData: getOverviewDashboardDataMock,
  getRecruiterOverviewDashboardData: getRecruiterOverviewDashboardDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/_components/dashboard-header", () => ({
  DashboardHeader: ({ title }: { title: string }) => (
    <div data-testid="dashboard-header">{title}</div>
  ),
}));

vi.mock("@/app/(protected)/(dashboard)/overview/_components/overview-header-actions", () => ({
  OverviewHeaderActions: () => <div data-testid="overview-actions">overview-actions</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/applications/_components/my-applications-hero", () => ({
  MyApplicationsHero: () => <div>applications-hero</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/applications/_components/my-applications-board", () => ({
  MyApplicationsBoard: () => <div>applications-board</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/blogs/_components/blog-article-card", () => ({
  BlogArticleCard: () => <div>blog-article-card</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/blogs/_components/blog-category-pills", () => ({
  BlogCategoryPills: () => <div>blog-category-pills</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/blogs/_components/blogs-search-hero", () => ({
  BlogsSearchHero: () => <div>blogs-search-hero</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/interview-hub/_components/ai-interview-hub-hero", () => ({
  AIInterviewHubHero: () => <div>interview-hub-hero</div>,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/interview-hub/_components/mock-interview-recommendations-card",
  () => ({
    MockInterviewRecommendationsCard: () => <div>interview-hub-recommendations</div>,
  }),
);

vi.mock("@/app/(protected)/(dashboard)/inbox/_components/inbox-container", () => ({
  InboxContainer: () => <div>inbox-container</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/interviews/_components/my-interviews-hero", () => ({
  MyInterviewsHero: () => <div>my-interviews-hero</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/interviews/_components/my-interviews-board", () => ({
  MyInterviewsBoard: () => <div>my-interviews-board</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/jobs/_components/explore-jobs-hero", () => ({
  ExploreJobsHero: () => <div>explore-jobs-hero</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/_components/job-recommendations-card", () => ({
  JobRecommendationsCard: () => <div>job-recommendations-card</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/resources/_components/resources-workspace", () => ({
  ResourcesWorkspace: () => <div>resources-workspace</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/saved/_components/saved-hero", () => ({
  SavedHero: () => <div>saved-hero</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/saved/_components/saved-bookmarks-board", () => ({
  SavedBookmarksBoard: () => <div>saved-bookmarks-board</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/resume/_components/resume-builder-hero", () => ({
  ResumeBuilderHero: () => <div>resume-builder-hero</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/resume/_components/resume-page-tabs", () => ({
  ResumePageTabs: () => <div>resume-page-tabs</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/settings/_components/settings-tabs", () => ({
  SettingsTabs: ({ resumeOptions }: { resumeOptions: unknown[] }) => (
    <div data-testid="settings-tabs">{resumeOptions.length}</div>
  ),
}));

vi.mock(
  "@/app/(protected)/(dashboard)/leaderboard/_components/leaderboard-rankings-card",
  () => ({
    LeaderboardRankingsCard: ({ activeScope }: { activeScope: string }) => (
      <div data-testid="leaderboard-rankings">{activeScope}</div>
    ),
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/leaderboard/_components/leaderboard-guide-card",
  () => ({
    LeaderboardGuideCard: () => <div>leaderboard-guide</div>,
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/overview/_components/applications-summary-card",
  () => ({
    ApplicationsSummaryCard: () => <div>overview-applications-summary</div>,
  }),
);

vi.mock("@/app/(protected)/(dashboard)/overview/_components/deadline-card", () => ({
  DeadlineCard: () => <div>overview-deadline</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/overview/_components/invitation-card", () => ({
  InvitationCard: () => <div>overview-invitation</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/overview/_components/rating-card", () => ({
  RatingCard: () => <div>overview-rating</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/overview/_components/tips-card", () => ({
  TipsCard: () => <div>overview-tips</div>,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/overview/_components/overview-analytics-charts",
  () => ({
    OverviewAnalyticsCharts: () => <div>overview-analytics</div>,
  }),
);

describe("Dashboard core pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      role: Role.USER,
      name: "User",
      email: "user@example.com",
      candidateProfile: {
        portfolioLinks: [],
      },
    });
    getMyApplicationsPageDataMock.mockResolvedValue({
      hero: {},
      board: {},
    });
    getBlogsPageDataMock.mockResolvedValue({
      hero: {
        title: "Blogs",
        description: "desc",
        searchPlaceholder: "search",
      },
      searchQuery: "",
      selectedFilterId: "all",
      topArticles: [{ id: "a1" }],
      categories: [],
      articles: [{ id: "a2" }],
    });
    getInterviewHubPageDataMock.mockResolvedValue({
      hero: {},
      interviewsSection: {},
    });
    getInboxPageDataMock.mockResolvedValue({
      title: "Inbox",
    });
    getMyInterviewsPageDataMock.mockResolvedValue({
      hero: {},
      board: {},
    });
    getExploreJobsPageDataMock.mockResolvedValue({
      hero: {},
      jobsSection: {},
    });
    listResourceCoursesMock.mockResolvedValue({
      data: {
        courses: [],
      },
    });
    getSavedPageDataMock.mockResolvedValue({
      hero: {},
      board: {},
    });
    getMyResumesMock.mockResolvedValue({
      data: {
        resumes: [{ id: "resume-1", fileName: "resume.pdf" }],
      },
    });
    listRecruiterWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [{ company: { id: "co-1", name: "Acme" } }],
      },
    });
    listCollegeWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [{ college: { id: "cl-1", name: "Softwarica" } }],
      },
    });
    getLeaderboardMock.mockResolvedValue({
      data: {
        scope: "global",
        rows: [],
        meta: {
          page: 1,
          size: 20,
          total: 0,
          totalPages: 1,
        },
      },
    });
    getOverviewDashboardDataMock.mockResolvedValue({
      ratings: {
        profile: 60,
        interview: 0,
      },
      applicationsSummary: {},
      deadlineCard: {},
      invitationCard: {},
      analytics: {},
      jobRecommendations: {},
    });
    getRecruiterOverviewDashboardDataMock.mockResolvedValue({
      workspaceName: "Acme",
      summary: {
        activeJobs: 1,
        draftJobs: 1,
        totalApplicants: 1,
        totalViews: 10,
        closingSoon: 0,
      },
      analytics: {},
      insights: {
        workModeDistribution: [{ mode: "Remote", count: 1 }],
        topSkills: [],
        upcomingDeadlines: [],
      },
      jobRecommendations: {},
    });
    computeProfileRatingMock.mockReturnValue({
      tierLabel: "STARTER",
      tierColor: "text-zinc-600",
      tierBadgeClass: "bg-zinc-100 text-zinc-600",
      summaryText: "Profile summary",
      suggestionBody: "Improve profile",
    });
  });

  it("renders applications page for candidate role", async () => {
    const page = await MyApplicationsPage({
      searchParams: Promise.resolve({ application: "app-1" }),
    });
    render(page);
    expect(screen.getByText("applications-hero")).toBeInTheDocument();
    expect(screen.getByText("applications-board")).toBeInTheDocument();
  });

  it("redirects applications page for non-candidate role", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });
    await expect(
      MyApplicationsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/overview");
  });

  it("renders blogs page sections", async () => {
    const page = await BlogsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);
    expect(screen.getByText("blogs-search-hero")).toBeInTheDocument();
    expect(screen.getAllByText("blog-article-card").length).toBeGreaterThan(0);
  });

  it("renders interview hub and inbox pages", async () => {
    render(await InterviewHubPage());
    expect(screen.getByText("interview-hub-hero")).toBeInTheDocument();
    expect(screen.getByText("interview-hub-recommendations")).toBeInTheDocument();

    render(await InboxPage());
    expect(screen.getByText("inbox-container")).toBeInTheDocument();
  });

  it("renders interview and saved pages", async () => {
    render(await MyInterviewsPage());
    expect(screen.getByText("my-interviews-hero")).toBeInTheDocument();
    expect(screen.getByText("my-interviews-board")).toBeInTheDocument();

    render(await SavedPage());
    expect(screen.getByText("saved-hero")).toBeInTheDocument();
    expect(screen.getByText("saved-bookmarks-board")).toBeInTheDocument();
  });

  it("renders jobs page for candidate and recruiter variants", async () => {
    render(await JobsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("dashboard-header")).toHaveTextContent(
      "Explore Jobs & Internships",
    );

    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });
    render(await JobsPage({ searchParams: Promise.resolve({ workspace: "co-1" }) }));
    expect(screen.getAllByTestId("dashboard-header")[1]).toHaveTextContent(
      "Company Jobs",
    );
  });

  it("renders resources page workspace shell", async () => {
    render(await ResourcesPage());
    expect(screen.getByText("resources-workspace")).toBeInTheDocument();
  });

  it("renders resume builder tabs", async () => {
    render(await ResumeBuilderPage());
    expect(screen.getByText("resume-builder-hero")).toBeInTheDocument();
    expect(screen.getByText("resume-page-tabs")).toBeInTheDocument();
  });

  it("handles settings page auth and resume option mapping", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT:/sign-in");

    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
      name: "User",
      email: "user@example.com",
    });
    const page = await SettingsPage();
    render(page);
    expect(screen.getByTestId("settings-tabs")).toHaveTextContent("1");
  });

  it("handles leaderboard auth and rendering", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    await expect(
      LeaderboardPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in");

    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
    });
    render(await LeaderboardPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("leaderboard-rankings")).toHaveTextContent("global");
    expect(screen.getByText("leaderboard-guide")).toBeInTheDocument();
  });

  it("redirects overview for admin and renders recruiter and candidate variants", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "admin-1",
      role: Role.ADMIN,
    });
    await expect(
      OverviewPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");

    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });
    render(
      await OverviewPage({
        searchParams: Promise.resolve({ workspace: "co-1" }),
      }),
    );
    expect(screen.getAllByTestId("dashboard-header")[0]).toHaveTextContent(
      "Recruiter Overview",
    );

    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
      candidateProfile: {
        portfolioLinks: [],
      },
    });
    render(await OverviewPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getAllByText("overview-applications-summary").length).toBeGreaterThan(0);
  });
});

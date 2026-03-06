import { render, screen } from "@testing-library/react";
import BlogArticleDetailPage from "@/app/(protected)/(dashboard)/blogs/[articleId]/page";
import CompanyProfilePage from "@/app/(protected)/(dashboard)/companies/[companyId]/page";
import NewJobPage from "@/app/(protected)/(dashboard)/jobs/new/page";
import EditJobPage from "@/app/(protected)/(dashboard)/jobs/[jobId]/edit/page";
import JobDetailPage from "@/app/(protected)/(dashboard)/jobs/[jobId]/page";
import ResourceCoursePage from "@/app/(protected)/(dashboard)/resources/[courseId]/page";
import CreateInterviewPage from "@/app/(protected)/(dashboard)/interviews/create/page";
import InterviewDetailsPage from "@/app/(protected)/(dashboard)/interviews/[interviewId]/page";
import TakeInterviewPage from "@/app/(protected)/(dashboard)/interviews/[interviewId]/take/page";
import SessionFeedbackPage from "@/app/(protected)/(dashboard)/interviews/sessions/[sessionId]/feedback/page";
import { Role } from "@/lib/definitions";

const {
  redirectMock,
  notFoundMock,
  getCurrentUserMock,
  getBlogDetailPageDataMock,
  getCompanyByIdMock,
  getJobsMock,
  listRecruiterWorkspacesMock,
  listCollegeWorkspacesMock,
  getJobByIdMock,
  getJobDetailPageDataMock,
  getResourceCourseByIdMock,
  getInterviewByIdMock,
  listMyInterviewSessionsMock,
  getInterviewAnalyticsMock,
  getInterviewSessionFeedbackMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getCurrentUserMock: vi.fn(),
  getBlogDetailPageDataMock: vi.fn(),
  getCompanyByIdMock: vi.fn(),
  getJobsMock: vi.fn(),
  listRecruiterWorkspacesMock: vi.fn(),
  listCollegeWorkspacesMock: vi.fn(),
  getJobByIdMock: vi.fn(),
  getJobDetailPageDataMock: vi.fn(),
  getResourceCourseByIdMock: vi.fn(),
  getInterviewByIdMock: vi.fn(),
  listMyInterviewSessionsMock: vi.fn(),
  getInterviewAnalyticsMock: vi.fn(),
  getInterviewSessionFeedbackMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
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

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

vi.mock("@/lib/dal", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  getCompanyById: getCompanyByIdMock,
  listRecruiterWorkspaces: listRecruiterWorkspacesMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  listCollegeWorkspaces: listCollegeWorkspacesMock,
}));

vi.mock("@/lib/actions/job-actions", () => ({
  getJobs: getJobsMock,
  getJobById: getJobByIdMock,
}));

vi.mock("@/lib/actions/resource-actions", () => ({
  getResourceCourseById: getResourceCourseByIdMock,
}));

vi.mock("@/lib/actions/interview-actions", () => ({
  getInterviewById: getInterviewByIdMock,
  listMyInterviewSessions: listMyInterviewSessionsMock,
  getInterviewAnalytics: getInterviewAnalyticsMock,
  getInterviewSessionFeedback: getInterviewSessionFeedbackMock,
}));

vi.mock("@/app/(protected)/(dashboard)/blogs/blogs-data", () => ({
  getBlogDetailPageData: getBlogDetailPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/jobs/job-detail-data", () => ({
  getJobDetailPageData: getJobDetailPageDataMock,
}));

vi.mock("@/app/(protected)/(dashboard)/_components/dashboard-header", () => ({
  DashboardHeader: ({ title }: { title: string }) => (
    <div data-testid="dashboard-header">{title}</div>
  ),
}));

vi.mock("@/app/(protected)/(dashboard)/_components/header-back-button", () => ({
  HeaderBackButton: () => <div>header-back-button</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/overview/_components/overview-header-actions", () => ({
  OverviewHeaderActions: () => <div>overview-actions</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/blogs/_components/blog-detail-header", () => ({
  BlogDetailHeader: () => <div>blog-detail-header</div>,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/blogs/_components/blog-article-detail-view",
  () => ({
    BlogArticleDetailView: () => <div>blog-article-detail-view</div>,
  }),
);

vi.mock("@/app/(protected)/(dashboard)/jobs/new/_components/create-job-form", () => ({
  CreateJobForm: () => <div>create-job-form</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/jobs/_components/job-detail-header", () => ({
  JobDetailHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/jobs/_components/job-detail-view", () => ({
  JobDetailView: () => <div>job-detail-view</div>,
}));

vi.mock("@/app/(protected)/(dashboard)/jobs/_components/job-view-tracker", () => ({
  JobViewTracker: () => <div>job-view-tracker</div>,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/resources/[courseId]/_components/course-detail-client-view",
  () => ({
    CourseDetailClientView: () => <div>course-detail-view</div>,
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/interviews/create/_components/create-interview-form",
  () => ({
    CreateInterviewForm: () => <div>create-interview-form</div>,
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/interviews/create/_components/voice-interview-create-panel",
  () => ({
    VoiceInterviewCreatePanel: () => <div>voice-interview-create-panel</div>,
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/interviews/[interviewId]/_components/delete-interview-button",
  () => ({
    DeleteInterviewButton: () => <div>delete-interview-button</div>,
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/interviews/[interviewId]/_components/interview-call-panel",
  () => ({
    InterviewCallPanel: () => <div>interview-call-panel</div>,
  }),
);

describe("Dashboard dynamic pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      role: Role.USER,
      name: "User",
      email: "user@example.com",
      photo: null,
      candidateProfile: {
        defaultResumeId: null,
        portfolioLinks: [],
      },
    });
    getBlogDetailPageDataMock.mockResolvedValue({
      article: { id: "article-1" },
      trendingTopics: [],
      relatedArticle: null,
    });
    getCompanyByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "company-1",
        name: "Acme",
        industry: "Tech",
        location: "Kathmandu",
      },
    });
    getJobsMock.mockResolvedValue({
      data: {
        jobs: [{ id: "job-1", title: "Engineer" }],
      },
    });
    listRecruiterWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [{ company: { id: "company-1", name: "Acme" } }],
      },
    });
    listCollegeWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [{ college: { id: "college-1", name: "Softwarica" } }],
      },
    });
    getJobByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "job-1",
        title: "Engineer",
        description: "Build APIs",
        workMode: "remote",
        requirements: { skills: ["Node"] },
        deadline: new Date().toISOString(),
        companyId: "company-1",
        company: { name: "Acme" },
      },
    });
    getJobDetailPageDataMock.mockResolvedValue({
      id: "job-1",
      title: "Engineer",
    });
    getResourceCourseByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "course-1",
        title: "Course",
      },
    });
    getInterviewByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "interview-1",
        title: "Interview",
        description: "desc",
        interviewType: "technical",
        visibility: "public",
        status: "published",
        role: "Backend",
        level: "Mid",
        questionCount: 3,
        durationMinutes: 20,
        questions: [{ order: 1, question: "Q1" }],
        createdBy: "user-1",
      },
    });
    listMyInterviewSessionsMock.mockResolvedValue({
      data: {
        sessions: [{ id: "session-1", status: "completed", evaluation: { totalScore: 80 } }],
      },
    });
    getInterviewAnalyticsMock.mockResolvedValue({
      success: true,
      data: {
        summary: {
          totalSessions: 1,
          uniqueParticipants: 1,
          completionRate: 100,
          averageScore: 80,
          highestScore: 80,
        },
        recentSessions: [],
      },
    });
    getInterviewSessionFeedbackMock.mockResolvedValue({
      success: true,
      data: {
        interview: {
          id: "interview-1",
          title: "Interview",
          level: "Mid",
        },
        session: {
          id: "session-1",
          endedAt: new Date().toISOString(),
          durationSeconds: 600,
          transcript: [],
        },
        evaluation: {
          totalScore: 78,
          createdAt: new Date().toISOString(),
          categoryScores: [],
          strengths: [],
          areasForImprovement: [],
          finalAssessment: "Good",
        },
      },
    });
  });

  it("renders blog detail page", async () => {
    render(
      await BlogArticleDetailPage({
        params: Promise.resolve({ articleId: "article-1" }),
      }),
    );
    expect(screen.getByText("blog-detail-header")).toBeInTheDocument();
    expect(screen.getByText("blog-article-detail-view")).toBeInTheDocument();
  });

  it("handles company profile success and not-found branches", async () => {
    render(
      await CompanyProfilePage({
        params: Promise.resolve({ companyId: "company-1" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Company Profile");

    getCompanyByIdMock.mockResolvedValueOnce({ success: false });
    await expect(
      CompanyProfilePage({
        params: Promise.resolve({ companyId: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("handles job create and edit pages with access checks", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
    });
    await expect(
      NewJobPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/overview");

    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });
    render(await NewJobPage({ searchParams: Promise.resolve({ workspace: "company-1" }) }));
    expect(screen.getByText("create-job-form")).toBeInTheDocument();

    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });
    render(
      await EditJobPage({
        params: Promise.resolve({ jobId: "job-1" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getAllByText("create-job-form").length).toBeGreaterThan(0);
  });

  it("handles job detail page success and not-found", async () => {
    render(
      await JobDetailPage({
        params: Promise.resolve({ jobId: "job-1" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByText("Detail Job")).toBeInTheDocument();
    expect(screen.getByText("job-detail-view")).toBeInTheDocument();

    getJobDetailPageDataMock.mockResolvedValueOnce(null);
    await expect(
      JobDetailPage({
        params: Promise.resolve({ jobId: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders resource detail with and without course data", async () => {
    render(
      await ResourceCoursePage({
        params: Promise.resolve({ courseId: "course-1" }),
      }),
    );
    expect(screen.getByText("course-detail-view")).toBeInTheDocument();

    getResourceCourseByIdMock.mockResolvedValueOnce({
      success: false,
    });
    render(
      await ResourceCoursePage({
        params: Promise.resolve({ courseId: "missing" }),
      }),
    );
    expect(screen.getByText(/Unable to load this course/i)).toBeInTheDocument();
  });

  it("renders interview create and details pages", async () => {
    render(await CreateInterviewPage());
    expect(screen.getByText("voice-interview-create-panel")).toBeInTheDocument();
    expect(screen.getByText("create-interview-form")).toBeInTheDocument();

    render(
      await InterviewDetailsPage({
        params: Promise.resolve({ interviewId: "interview-1" }),
      }),
    );
    expect(screen.getByText("delete-interview-button")).toBeInTheDocument();
    expect(screen.getByText("Interview Details")).toBeInTheDocument();
  });

  it("handles interview take page access and feedback page branch", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });
    await expect(
      TakeInterviewPage({
        params: Promise.resolve({ interviewId: "interview-1" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/interviews/interview-1");

    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
      name: "User",
      email: "user@example.com",
    });
    render(
      await TakeInterviewPage({
        params: Promise.resolve({ interviewId: "interview-1" }),
        searchParams: Promise.resolve({ returnTo: "/interviews" }),
      }),
    );
    expect(screen.getByText("interview-call-panel")).toBeInTheDocument();

    render(
      await SessionFeedbackPage({
        params: Promise.resolve({ sessionId: "session-1" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByText("Interview Feedback")).toBeInTheDocument();

    getInterviewSessionFeedbackMock.mockResolvedValueOnce({
      success: false,
      message: "Interview feedback not found.",
    });
    render(
      await SessionFeedbackPage({
        params: Promise.resolve({ sessionId: "session-missing-eval" }),
        searchParams: Promise.resolve({ returnTo: "/interview-hub" }),
      }),
    );
    expect(
      screen.getByText("Feedback is not ready for this attempt yet."),
    ).toBeInTheDocument();

    getInterviewSessionFeedbackMock.mockResolvedValueOnce({ success: false });
    await expect(
      SessionFeedbackPage({
        params: Promise.resolve({ sessionId: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

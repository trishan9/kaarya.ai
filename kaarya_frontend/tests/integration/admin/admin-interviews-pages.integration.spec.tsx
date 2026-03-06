import { render, screen } from "@testing-library/react";
import AdminInterviewsPage from "@/app/(protected)/admin/interviews/page";
import AdminCreateInterviewPage from "@/app/(protected)/admin/interviews/create/page";
import AdminInterviewDetailsPage from "@/app/(protected)/admin/interviews/[interviewId]/page";

const {
  notFoundMock,
  listInterviewsMock,
  getCurrentUserMock,
  getInterviewByIdMock,
  getInterviewAnalyticsMock,
  createInterviewFormMock,
  voiceInterviewCreatePanelMock,
} = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  listInterviewsMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  getInterviewByIdMock: vi.fn(),
  getInterviewAnalyticsMock: vi.fn(),
  createInterviewFormMock: vi.fn(() => (
    <div data-testid="create-interview-form">create-interview-form</div>
  )),
  voiceInterviewCreatePanelMock: vi.fn(() => (
    <div data-testid="voice-interview-create-panel">voice-interview-create-panel</div>
  )),
}));

vi.mock("next/navigation", () => ({
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

vi.mock("@/lib/actions/interview-actions", () => ({
  listInterviews: listInterviewsMock,
  getInterviewById: getInterviewByIdMock,
  getInterviewAnalytics: getInterviewAnalyticsMock,
}));

vi.mock("@/lib/dal", () => ({
  getCurrentUser: getCurrentUserMock,
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

vi.mock(
  "@/app/(protected)/(dashboard)/interviews/create/_components/create-interview-form",
  () => ({
    CreateInterviewForm: createInterviewFormMock,
  }),
);

vi.mock(
  "@/app/(protected)/(dashboard)/interviews/create/_components/voice-interview-create-panel",
  () => ({
    VoiceInterviewCreatePanel: voiceInterviewCreatePanelMock,
  }),
);

describe("Admin interviews pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listInterviewsMock.mockResolvedValue({
      success: true,
      data: {
        interviews: [
          {
            id: "interview-1",
            title: "Backend Engineering Interview",
            role: "Backend Engineer",
            interviewType: "system_design",
            source: "admin",
            status: "published",
            visibility: "public",
            attemptsCount: 16,
            createdAt: "2026-01-20T00:00:00.000Z",
          },
        ],
        meta: {
          page: 1,
          size: 12,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });

    getCurrentUserMock.mockResolvedValue({
      id: "admin-1",
      name: "Admin User",
      photo: null,
      role: "admin",
    });

    getInterviewByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "interview-1",
        title: "Backend Engineering Interview",
        role: "Backend Engineer",
        interviewType: "system_design",
        status: "published",
        visibility: "public",
        description: "System design interview for backend role",
        questionCount: 6,
        durationMinutes: 45,
        attemptsCount: 16,
        techStack: ["Node.js", "PostgreSQL"],
        createdAt: "2026-01-15T10:00:00.000Z",
      },
    });

    getInterviewAnalyticsMock.mockResolvedValue({
      success: true,
      data: {
        summary: {
          totalSessions: 10,
          uniqueParticipants: 8,
          completionRate: 90,
          averageScore: 78,
          highestScore: 95,
        },
        recentSessions: [
          {
            id: "session-1",
            status: "completed",
            score: 85,
            createdAt: "2026-01-25T10:00:00.000Z",
            candidate: {
              name: "Candidate One",
              email: "candidate@example.com",
            },
          },
        ],
      },
    });
  });

  it("renders admin interviews listing page with filters and result rows", async () => {
    render(
      await AdminInterviewsPage({
        searchParams: Promise.resolve({
          page: "1",
          size: "12",
          search: "Backend",
          status: "published",
          interviewType: "system_design",
        }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Interviews");
    expect(screen.getByText("Backend Engineering Interview")).toBeInTheDocument();
    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear" })).toHaveAttribute(
      "href",
      "/admin/interviews",
    );
    expect(listInterviewsMock).toHaveBeenCalledWith({
      page: 1,
      size: 12,
      search: "Backend",
      status: "published",
      interviewType: "system_design",
      ownership: "all",
      discover: false,
      sortBy: "updated",
    });
  });

  it("renders admin interviews listing failure state", async () => {
    listInterviewsMock.mockResolvedValueOnce({
      success: false,
      message: "Unable to fetch interviews",
    });

    render(
      await AdminInterviewsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("Unable to fetch interviews")).toBeInTheDocument();
  });

  it("renders admin create interview page with voice and manual flows", async () => {
    render(await AdminCreateInterviewPage());

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Create Interview");
    expect(screen.getByTestId("voice-interview-create-panel")).toBeInTheDocument();
    expect(screen.getByTestId("create-interview-form")).toBeInTheDocument();
    expect(voiceInterviewCreatePanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateName: "Admin User",
        redirectHref: "/admin/interviews",
      }),
      undefined,
    );
    expect(createInterviewFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        listHref: "/admin/interviews",
        detailHrefPrefix: "/admin/interviews",
      }),
      undefined,
    );
  });

  it("renders admin interview details page with analytics and sessions", async () => {
    render(
      await AdminInterviewDetailsPage({
        params: Promise.resolve({ interviewId: "interview-1" }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Interview Details");
    expect(screen.getByText("Backend Engineering Interview")).toBeInTheDocument();
    expect(screen.getByText("Candidate One")).toBeInTheDocument();
    expect(screen.getByText("85/100")).toBeInTheDocument();
    expect(screen.getByText("System Analytics")).toBeInTheDocument();
    expect(getInterviewAnalyticsMock).toHaveBeenCalledWith("interview-1", {
      page: 1,
      size: 20,
    });
  });

  it("returns not found for missing admin interview details", async () => {
    getInterviewByIdMock.mockResolvedValueOnce({
      success: false,
      data: null,
    });

    await expect(
      AdminInterviewDetailsPage({
        params: Promise.resolve({ interviewId: "missing-interview" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MyInterviewsBoard,
  type MyInterviewsBoardProps,
} from "@/app/(protected)/(dashboard)/interviews/_components/my-interviews-board";

const { listMyInterviewSessionsMock } = vi.hoisted(() => ({
  listMyInterviewSessionsMock: vi.fn(),
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

vi.mock("@/lib/actions/interview-actions", () => ({
  listMyInterviewSessions: listMyInterviewSessionsMock,
}));

const boardProps: MyInterviewsBoardProps = {
  title: "My Interviews",
  description: "Practice and track interviews",
  tabs: ["All", "Attempted"],
  activeTab: "All",
  createButtonLabel: "Create Interview",
  interviewsByTab: {
    All: [
      {
        id: "int-1",
        title: "Backend Interview",
        company: "Acme Labs",
        categoryLabel: "Technical",
        takenCount: 5,
        createdAtLabel: "Created on: Feb 01, 2026",
        createdAtTimestamp: 1738368000000,
        scoreLabel: "82/100",
        scoreValue: 82,
        description: "Backend practical interview",
        attemptStatus: "attempted",
        logoText: "AL",
        primaryActionLabel: "Retake",
        primaryActionHref: "/interviews/int-1/take",
      },
      {
        id: "int-2",
        title: "Frontend Interview",
        company: "Beta Works",
        categoryLabel: "Behavioral",
        takenCount: 1,
        createdAtLabel: "Created on: Feb 04, 2026",
        createdAtTimestamp: 1738627200000,
        scoreLabel: "Not attempted",
        scoreValue: null,
        description: "Frontend systems interview",
        attemptStatus: "not_attempted",
        logoText: "BW",
        primaryActionLabel: "Start",
        primaryActionHref: "/interviews/int-2/take",
      },
    ],
    Attempted: [],
  },
};

describe("MyInterviewsBoard integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMyInterviewSessionsMock.mockResolvedValue({
      success: true,
      data: {
        sessions: [
          {
            id: "session-1",
            status: "completed",
            createdAt: "2026-02-20T12:00:00.000Z",
            evaluation: {
              totalScore: 88,
            },
          },
        ],
      },
    });
  });

  it("filters interviews and loads recent attempts in detail sheet", async () => {
    const user = userEvent.setup();
    render(<MyInterviewsBoard {...boardProps} />);

    expect(screen.getByRole("link", { name: /create interview/i })).toHaveAttribute(
      "href",
      "/interviews/create",
    );

    await user.type(
      screen.getByPlaceholderText("Search interview title, company, or category..."),
      "frontend",
    );
    expect(screen.queryByText("Backend Interview")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Interview")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View" }));
    expect(await screen.findByText("Interview Details")).toBeInTheDocument();

    await waitFor(() => {
      expect(listMyInterviewSessionsMock).toHaveBeenCalledWith("int-2", {
        page: 1,
        size: 3,
      });
    });

    expect(screen.getByText("Recent Attempts (Last 3)")).toBeInTheDocument();
    expect(screen.getByText("88/100")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Feedback" })).toHaveAttribute(
      "href",
      "/interviews/sessions/session-1/feedback?returnTo=%2Finterviews",
    );
  });

  it("shows empty attempts state when interview has no sessions", async () => {
    listMyInterviewSessionsMock.mockResolvedValueOnce({
      success: true,
      data: {
        sessions: [],
      },
    });
    const user = userEvent.setup();
    render(<MyInterviewsBoard {...boardProps} />);

    await user.click(screen.getAllByRole("button", { name: "View" })[0]);

    expect(
      await screen.findByText("No attempts found for this interview yet."),
    ).toBeInTheDocument();
  });
});

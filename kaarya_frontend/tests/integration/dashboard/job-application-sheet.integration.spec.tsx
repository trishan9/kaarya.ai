import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobApplicationSheet } from "@/app/(protected)/(dashboard)/jobs/_components/job-application-sheet";

const {
  routerMock,
  getMyResumesMock,
  deleteMyResumeMock,
  createJobApplicationMock,
  toastMock,
} = vi.hoisted(() => ({
  routerMock: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  },
  getMyResumesMock: vi.fn(),
  deleteMyResumeMock: vi.fn(),
  createJobApplicationMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/job-actions", () => ({
  getMyResumes: getMyResumesMock,
  deleteMyResume: deleteMyResumeMock,
  createJobApplication: createJobApplicationMock,
}));

const baseProps = {
  job: {
    id: "job-1",
    title: "Senior Backend Engineer",
    company: "Acme Labs",
    locationLabel: "Kathmandu",
    postedAtLabel: "2 days ago",
    logoText: "AL",
  },
  defaultResumeId: "resume-1",
  triggerLabel: "Apply Now",
  sheetTitle: "Apply For Role",
  uploadLabel: "Upload Resume",
  uploadHelperText: "Maximum 10MB",
  uploadBrowseLabel: "Browse",
  coverLetterLabel: "Cover Letter",
  coverLetterPlaceholder: "Write a short cover letter",
  portfolioLabel: "Portfolio Links",
  portfolioPlaceholder: "https://portfolio.example.com/you",
  addPortfolioLabel: "Add portfolio link",
  submitLabel: "Submit Application",
  successTitle: "Application Sent",
  successDescription: "Your profile was shared with recruiter.",
  doneLabel: "Done",
} as const;

describe("JobApplicationSheet integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyResumesMock.mockResolvedValue({
      success: true,
      data: {
        resumes: [
          {
            id: "resume-1",
            fileName: "resume.pdf",
            createdAt: "2026-02-10T00:00:00.000Z",
            atsScore: 84,
          },
        ],
      },
    });
    deleteMyResumeMock.mockResolvedValue({
      success: true,
      message: "Resume deleted",
    });
    createJobApplicationMock.mockResolvedValue({
      success: true,
      message: "Application submitted successfully",
    });
  });

  it(
    "submits an application with existing resume and portfolio links",
    async () => {
    const user = userEvent.setup();
    render(<JobApplicationSheet {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Apply Now" }));
    await waitFor(() => {
      expect(getMyResumesMock).toHaveBeenCalledWith({ page: 1, size: 100 });
    });

    await user.type(
      screen.getByPlaceholderText("Write a short cover letter"),
      "I have delivered distributed systems at scale with measurable results.",
    );
    await user.type(
      screen.getByPlaceholderText("https://portfolio.example.com/you"),
      "portfolio.example.com/me",
    );

    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => {
      expect(createJobApplicationMock).toHaveBeenCalledWith(
        "job-1",
        expect.objectContaining({
          resumeId: "resume-1",
          coverLetter:
            "I have delivered distributed systems at scale with measurable results.",
          portfolioLinks: ["portfolio.example.com/me"],
        }),
      );
      expect(routerMock.refresh).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith(
        "Application submitted successfully",
      );
    });

    expect(screen.getByText("Application Sent")).toBeInTheDocument();
    },
    15000,
  );

  it(
    "shows validation when portfolio links are invalid",
    async () => {
    const user = userEvent.setup();
    render(<JobApplicationSheet {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Apply Now" }));
    await waitFor(() => expect(getMyResumesMock).toHaveBeenCalled());

    await user.type(
      screen.getByPlaceholderText("Write a short cover letter"),
      "I bring strong ownership and communication in cross-functional teams.",
    );
    await user.type(
      screen.getByPlaceholderText("https://portfolio.example.com/you"),
      "http://",
    );

    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(
      await screen.findByText("Please enter valid portfolio URL(s)."),
    ).toBeInTheDocument();
    expect(createJobApplicationMock).not.toHaveBeenCalled();
    },
    10000,
  );
});

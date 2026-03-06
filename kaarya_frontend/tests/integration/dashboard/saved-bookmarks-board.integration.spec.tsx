import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavedBookmarksBoard } from "@/app/(protected)/(dashboard)/saved/_components/saved-bookmarks-board";

const { jobRecommendationsCardMock, mockInterviewRecommendationsCardMock } = vi.hoisted(
  () => ({
    jobRecommendationsCardMock: vi.fn(
      ({
        jobsByTab,
        onJobBookmarkChange,
      }: {
        jobsByTab: Record<string, Array<{ id: string; title: string }>>;
        onJobBookmarkChange?: (jobId: string, saved: boolean) => void;
      }) => {
        const jobs = Object.values(jobsByTab).flat();
        return (
          <div data-testid="job-recommendations-card">
            <div>jobs:{jobs.map((job) => job.title).join(",")}</div>
            <button
              type="button"
              onClick={() => {
                if (jobs[0]) onJobBookmarkChange?.(jobs[0].id, false);
              }}
            >
              unsave-first-job
            </button>
          </div>
        );
      },
    ),
    mockInterviewRecommendationsCardMock: vi.fn(
      ({
        interviewsByTab,
        onInterviewBookmarkChange,
      }: {
        interviewsByTab: Record<string, Array<{ id: string; title: string }>>;
        onInterviewBookmarkChange?: (interviewId: string, saved: boolean) => void;
      }) => {
        const interviews = Object.values(interviewsByTab).flat();
        return (
          <div data-testid="interview-recommendations-card">
            <div>interviews:{interviews.map((interview) => interview.title).join(",")}</div>
            <button
              type="button"
              onClick={() => {
                if (interviews[0]) onInterviewBookmarkChange?.(interviews[0].id, false);
              }}
            >
              unsave-first-interview
            </button>
          </div>
        );
      },
    ),
  }),
);

vi.mock("@/app/(protected)/(dashboard)/_components/job-recommendations-card", () => ({
  JobRecommendationsCard: jobRecommendationsCardMock,
}));

vi.mock(
  "@/app/(protected)/(dashboard)/interview-hub/_components/mock-interview-recommendations-card",
  () => ({
    MockInterviewRecommendationsCard: mockInterviewRecommendationsCardMock,
  }),
);

describe("SavedBookmarksBoard integration", () => {
  it("updates counts, filters by search, and removes unsaved items", async () => {
    const user = userEvent.setup();
    render(
      <SavedBookmarksBoard
        title="Saved Bookmarks"
        description="Your saved jobs and interviews"
        searchPlaceholder="Search saved"
        typeOptions={[
          { value: "jobs", label: "Jobs", count: 0 },
          { value: "interviews", label: "Interviews", count: 0 },
        ]}
        defaultType="jobs"
        jobsSection={{
          title: "Saved Jobs",
          tabs: ["All"],
          activeTab: "All",
          jobsByTab: {
            All: [
              {
                id: "job-1",
                title: "Backend Engineer",
                company: "Acme Labs",
                location: "Kathmandu",
                statusLabel: "Open",
                employmentType: "Full-Time",
                engagementType: "Internship",
                postedAt: "2d",
                salaryRange: "NPR 1,000,000 - 1,200,000",
                roleType: "Engineering",
                logoText: "AL",
                href: "/jobs/job-1",
              },
              {
                id: "job-2",
                title: "Data Engineer",
                company: "Gamma Inc",
                location: "Remote",
                statusLabel: "Open",
                employmentType: "Full-Time",
                engagementType: "Internship",
                postedAt: "1d",
                salaryRange: "NPR 1,200,000 - 1,500,000",
                roleType: "Data",
                logoText: "GI",
                href: "/jobs/job-2",
              },
            ],
          },
          showToolbar: false,
          sortLabel: "Sort",
          filterLabel: "Filter",
          emptyMessage: "No saved jobs",
          surface: "plain",
          gridClassName: "",
        }}
        interviewsSection={{
          title: "Saved Interviews",
          tabs: ["All"],
          activeTab: "All",
          interviewsByTab: {
            All: [
              {
                id: "interview-1",
                title: "System Design Round",
                company: "Acme Labs",
                categoryLabel: "Technical",
                takenCount: 3,
                createdAtLabel: "Created on: Feb 01, 2026",
                createdAtTimestamp: 1738368000000,
                scoreLabel: "80/100",
                scoreValue: 80,
                description: "System design scenarios",
                attemptStatus: "attempted",
                logoText: "AL",
                primaryActionLabel: "Open",
              },
            ],
          },
          showToolbar: false,
          sortLabel: "Sort",
          filterLabel: "Filter",
          emptyMessage: "No saved interviews",
          gridClassName: "",
        }}
      />,
    );

    expect(screen.getByRole("tab", { name: "Jobs (2)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Interviews (1)" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search saved"), "gamma");
    expect(screen.getByText("jobs:Data Engineer")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search saved"));
    await user.click(screen.getByRole("button", { name: "unsave-first-job" }));
    expect(screen.getByRole("tab", { name: "Jobs (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Interviews (1)" }));
    await user.click(screen.getByRole("button", { name: "unsave-first-interview" }));
    expect(screen.getByRole("tab", { name: "Interviews (0)" })).toBeInTheDocument();
  });
});

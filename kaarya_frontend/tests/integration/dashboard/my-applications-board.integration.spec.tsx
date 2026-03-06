import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MyApplicationsBoard,
  type MyApplicationRecord,
} from "@/app/(protected)/(dashboard)/applications/_components/my-applications-board";

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

vi.mock("@/components/rich-text/quill-viewer", () => ({
  QuillViewer: ({ value }: { value: string }) => <div data-testid="quill-viewer">{value}</div>,
}));

const buildTimeline = (): MyApplicationRecord["timeline"] => [
  {
    key: "applied",
    label: "Applied",
    reached: true,
    isCurrent: false,
    at: "2026-02-01T10:00:00.000Z",
  },
  {
    key: "reviewing",
    label: "Reviewing",
    reached: true,
    isCurrent: true,
    at: "2026-02-02T10:00:00.000Z",
  },
  {
    key: "interview",
    label: "Interview",
    reached: false,
    isCurrent: false,
    at: null,
  },
];

const applications: MyApplicationRecord[] = [
  {
    id: "app-1",
    jobId: "job-1",
    roleTitle: "Backend Engineer",
    company: "Acme Labs",
    logoText: "AL",
    status: "reviewing",
    statusLabel: "Reviewing",
    statusTone: "info",
    location: "Kathmandu",
    workMode: "Hybrid",
    employmentType: "Full-Time",
    salaryRange: "NPR 800,000 - 1,000,000",
    nextStepLabel: "Technical screening",
    appliedAtLabel: "Feb 01, 2026",
    appliedAtTimestamp: 1738377600000,
    updatedAtLabel: "Feb 03, 2026",
    updatedAtTimestamp: 1738550400000,
    jobHref: "/jobs/job-1",
    timeline: buildTimeline(),
    description: "Design and ship backend services.",
    qualifications: ["Node.js", "PostgreSQL"],
    companyProfile: {
      name: "Acme Labs",
      location: "Kathmandu",
      industry: "Software",
      companySize: "50-100",
      profileHref: "/companies/acme",
      description: "Builds developer productivity tools.",
    },
    resume: {
      previewUrl: "https://example.com/resume-preview",
      downloadUrl: "https://example.com/resume-download",
      fileName: "resume.pdf",
    },
  },
  {
    id: "app-2",
    jobId: "job-2",
    roleTitle: "Frontend Engineer",
    company: "Beta Works",
    logoText: "BW",
    status: "shortlisted",
    statusLabel: "Shortlisted",
    statusTone: "success",
    location: "Remote",
    workMode: "Remote",
    employmentType: "Full-Time",
    salaryRange: "NPR 1,200,000 - 1,600,000",
    nextStepLabel: "Hiring manager interview",
    appliedAtLabel: "Feb 04, 2026",
    appliedAtTimestamp: 1738636800000,
    updatedAtLabel: "Feb 05, 2026",
    updatedAtTimestamp: 1738723200000,
    jobHref: "/jobs/job-2",
    timeline: buildTimeline(),
    description: "Create accessible frontend systems.",
    qualifications: ["React", "TypeScript"],
    companyProfile: {
      name: "Beta Works",
      location: "Remote",
      industry: "SaaS",
      profileHref: "/companies/beta",
    },
  },
];

describe("MyApplicationsBoard integration", () => {
  it("searches applications and opens detailed sheet tabs", async () => {
    const user = userEvent.setup();
    render(
      <MyApplicationsBoard
        title="My Applications"
        description="Track your applications"
        tabs={["All", "Shortlisted"]}
        activeTab="All"
        applicationsByTab={{
          All: applications,
          Shortlisted: [applications[1]],
        }}
        searchPlaceholder="Search role"
      />,
    );

    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search role"), "beta");
    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View Application" }));
    expect(await screen.findByText("Detail My Applications")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Detail Job" }));
    expect(screen.getByText("Job Descriptions")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Company Profile" }));
    expect(screen.getByText("About Company")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Profile" })).toHaveAttribute(
      "href",
      "/companies/beta",
    );
  });

  it("renders empty state when no rows match current filters", async () => {
    const user = userEvent.setup();
    render(
      <MyApplicationsBoard
        title="My Applications"
        description="Track your applications"
        tabs={["All"]}
        activeTab="All"
        applicationsByTab={{ All: applications }}
        emptyMessage="No rows after filters."
      />,
    );

    await user.type(
      screen.getByPlaceholderText("Search by role, company, or location..."),
      "nonexistent-keyword",
    );

    expect(screen.getByText("No rows after filters.")).toBeInTheDocument();
  });
});

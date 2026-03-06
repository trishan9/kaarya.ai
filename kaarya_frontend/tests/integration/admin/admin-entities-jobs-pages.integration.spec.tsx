import { render, screen } from "@testing-library/react";
import AdminCollegesPage from "@/app/(protected)/admin/colleges/page";
import AdminCompaniesPage from "@/app/(protected)/admin/companies/page";
import AdminCompanyDetailsPage from "@/app/(protected)/admin/companies/[companyId]/page";
import AdminJobsPage from "@/app/(protected)/admin/jobs/page";
import AdminJobDetailsPage from "@/app/(protected)/admin/jobs/[jobId]/page";

const {
  notFoundMock,
  listCollegesMock,
  listCompaniesMock,
  getCompanyByIdMock,
  listCompanyRecruitersMock,
  getJobsMock,
  getJobByIdMock,
  getJobApplicationsMock,
  jobDescriptionPanelMock,
  adminJobApplicantsPanelMock,
} = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  listCollegesMock: vi.fn(),
  listCompaniesMock: vi.fn(),
  getCompanyByIdMock: vi.fn(),
  listCompanyRecruitersMock: vi.fn(),
  getJobsMock: vi.fn(),
  getJobByIdMock: vi.fn(),
  getJobApplicationsMock: vi.fn(),
  jobDescriptionPanelMock: vi.fn(() => (
    <div data-testid="job-description-panel">job-description-panel</div>
  )),
  adminJobApplicantsPanelMock: vi.fn(() => (
    <div data-testid="admin-job-applicants-panel">admin-job-applicants-panel</div>
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

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  listColleges: listCollegesMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  listCompanies: listCompaniesMock,
  getCompanyById: getCompanyByIdMock,
  listCompanyRecruiters: listCompanyRecruitersMock,
}));

vi.mock("@/lib/actions/job-actions", () => ({
  getJobs: getJobsMock,
  getJobById: getJobByIdMock,
  getJobApplications: getJobApplicationsMock,
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
  "@/app/(protected)/(dashboard)/jobs/_components/job-description-panel",
  () => ({
    JobDescriptionPanel: jobDescriptionPanelMock,
  }),
);

vi.mock(
  "@/app/(protected)/admin/jobs/[jobId]/_components/admin-job-applicants-panel",
  () => ({
    AdminJobApplicantsPanel: adminJobApplicantsPanelMock,
  }),
);

describe("Admin entities and jobs pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listCollegesMock.mockResolvedValue({
      success: true,
      data: {
        colleges: [
          {
            id: "college-1",
            name: "Softwarica College",
            institutionType: "College",
            location: "Kathmandu",
            createdAt: "2026-01-10T00:00:00.000Z",
          },
        ],
        meta: {
          page: 2,
          size: 1,
          totalItems: 3,
          totalPages: 3,
          prevPage: 1,
          nextPage: 3,
        },
      },
    });

    listCompaniesMock.mockResolvedValue({
      success: true,
      data: {
        companies: [
          {
            id: "company-1",
            name: "Acme Labs",
            industry: "Software",
            location: "Kathmandu",
            verifiedStatus: true,
            createdAt: "2026-01-08T00:00:00.000Z",
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

    getCompanyByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "company-1",
        name: "Acme Labs",
        industry: "Software",
        location: "Kathmandu",
        verifiedStatus: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    listCompanyRecruitersMock.mockResolvedValue({
      success: true,
      data: {
        members: [
          {
            id: "member-1",
            designation: "Hiring Manager",
            recruiter: {
              id: "recruiter-1",
              name: "Recruiter A",
              email: "recruiter@example.com",
            },
          },
        ],
      },
    });

    getJobsMock.mockImplementation(async (params?: { status?: string; size?: number }) => {
      if (params?.status === "open" && params.size === 1) {
        return { success: true, data: { meta: { totalItems: 4 } } };
      }
      if (params?.status === "draft" && params.size === 1) {
        return { success: true, data: { meta: { totalItems: 2 } } };
      }
      if (params?.status === "closed" && params.size === 1) {
        return { success: true, data: { meta: { totalItems: 1 } } };
      }
      return {
        success: true,
        data: {
          jobs: [
            {
              id: "job-1",
              title: "Backend Engineer",
              status: "open",
              visibility: "public",
              workspaceType: "company",
              company: {
                id: "company-1",
                name: "Acme Labs",
              },
              location: "Remote",
              employmentType: "Full-time",
              applicationsCount: 9,
              createdAt: "2026-01-09T00:00:00.000Z",
              deadline: "2026-03-31T00:00:00.000Z",
            },
          ],
          meta: {
            page: 1,
            size: 10,
            totalItems: 1,
            totalPages: 1,
          },
        },
      };
    });

    getJobByIdMock.mockResolvedValue({
      success: true,
      data: {
        id: "job-1",
        title: "Backend Engineer",
        status: "open",
        visibility: "public",
        workspaceType: "company",
        companyId: "company-1",
        company: {
          name: "Acme Labs",
        },
        description: "Build robust APIs",
        requirements: {
          skills: ["Node.js", "PostgreSQL"],
        },
        applicationsCount: 9,
        viewsCount: 88,
        location: "Remote",
        createdAt: "2026-01-01T00:00:00.000Z",
        deadline: "2026-03-01T00:00:00.000Z",
      },
    });

    getJobApplicationsMock.mockResolvedValue({
      success: true,
      data: {
        applications: [
          {
            id: "application-1",
            status: "shortlisted",
            createdAt: "2026-01-12T00:00:00.000Z",
            candidate: {
              id: "candidate-1",
              name: "Candidate One",
              email: "candidate@example.com",
            },
            resume: {
              fileName: "candidate-resume.pdf",
              previewUrl: "https://example.com/resume-preview",
              downloadUrl: "https://example.com/resume-download",
            },
          },
        ],
      },
    });
  });

  it("renders admin colleges page with table rows and pagination links", async () => {
    render(
      await AdminCollegesPage({
        searchParams: Promise.resolve({
          page: "2",
          size: "1",
          search: "Softwarica",
        }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Colleges");
    expect(screen.getByText("Softwarica College")).toBeInTheDocument();
    expect(screen.getByText("Showing 2-2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/admin/colleges?page=1&size=1&search=Softwarica",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/admin/colleges?page=3&size=1&search=Softwarica",
    );
  });

  it("renders admin colleges page error state", async () => {
    listCollegesMock.mockResolvedValueOnce({
      success: false,
      message: "Unable to list colleges",
    });

    render(
      await AdminCollegesPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("Unable to list colleges")).toBeInTheDocument();
  });

  it("renders admin companies page with verified badge", async () => {
    render(
      await AdminCompaniesPage({
        searchParams: Promise.resolve({
          search: "Acme",
        }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Companies");
    expect(screen.getByText("Acme Labs")).toBeInTheDocument();
    expect(screen.getAllByText("Verified").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/admin/companies/company-1",
    );
    expect(listCompaniesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Acme",
      }),
    );
  });

  it("renders admin companies page empty state", async () => {
    listCompaniesMock.mockResolvedValueOnce({
      success: true,
      data: {
        companies: [],
      },
    });

    render(
      await AdminCompaniesPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("No companies found.")).toBeInTheDocument();
  });

  it("renders admin company detail page with recruiters and recent jobs", async () => {
    render(
      await AdminCompanyDetailsPage({
        params: Promise.resolve({ companyId: "company-1" }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Company Profile");
    expect(screen.getByText("Acme Labs")).toBeInTheDocument();
    expect(screen.getByText("Recruiter A")).toBeInTheDocument();
    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThan(0);
    expect(getJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "company-1", status: "open" }),
    );
    expect(getJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "company-1", status: "draft" }),
    );
    expect(getJobsMock).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "company-1", status: "closed" }),
    );
  });

  it("returns not found for missing admin company detail page", async () => {
    getCompanyByIdMock.mockResolvedValueOnce({
      success: false,
      data: null,
    });

    await expect(
      AdminCompanyDetailsPage({
        params: Promise.resolve({ companyId: "missing-company" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders admin jobs page with filters and listing", async () => {
    render(
      await AdminJobsPage({
        searchParams: Promise.resolve({
          page: "1",
          size: "10",
          search: "Backend",
          status: "open",
          companyId: "company-1",
        }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Job Postings");
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear" })).toHaveAttribute(
      "href",
      "/admin/jobs",
    );
    expect(getJobsMock).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      search: "Backend",
      status: "open",
      companyId: "company-1",
      collegeId: undefined,
    });
  });

  it("renders admin jobs page failure state", async () => {
    getJobsMock.mockResolvedValueOnce({
      success: false,
      message: "Unable to load jobs",
    });

    render(
      await AdminJobsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("Unable to load jobs")).toBeInTheDocument();
  });

  it("renders admin job detail page and parses application rows", async () => {
    render(
      await AdminJobDetailsPage({
        params: Promise.resolve({ jobId: "job-1" }),
      }),
    );

    expect(screen.getByTestId("dashboard-header")).toHaveTextContent("Job Details");
    expect(screen.getByTestId("job-description-panel")).toBeInTheDocument();
    expect(screen.getByTestId("admin-job-applicants-panel")).toBeInTheDocument();
    expect(jobDescriptionPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        qualifications: ["Experience with Node.js", "Experience with PostgreSQL"],
      }),
      undefined,
    );
    expect(adminJobApplicantsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applications: [
          expect.objectContaining({
            id: "application-1",
            candidateName: "Candidate One",
            candidateEmail: "candidate@example.com",
            status: "shortlisted",
          }),
        ],
      }),
      undefined,
    );
  });

  it("returns not found for missing admin job detail page", async () => {
    getJobByIdMock.mockResolvedValueOnce({
      success: false,
      data: null,
    });

    await expect(
      AdminJobDetailsPage({
        params: Promise.resolve({ jobId: "missing-job" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

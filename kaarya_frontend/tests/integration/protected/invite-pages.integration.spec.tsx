import { render, screen } from "@testing-library/react";
import CompanyInvitesPage from "@/app/(protected)/company-invites/page";
import CollegeInvitesPage from "@/app/(protected)/college-invites/page";
import { Role } from "@/lib/definitions";

const {
  redirectMock,
  getCurrentUserMock,
  listRecruiterWorkspacesMock,
  getCompanyByIdMock,
  listCollegeWorkspacesMock,
  getCollegeByIdMock,
  getJobsMock,
  companyInviteJoinCardMock,
  collegeInviteJoinCardMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  getCurrentUserMock: vi.fn(),
  listRecruiterWorkspacesMock: vi.fn(),
  getCompanyByIdMock: vi.fn(),
  listCollegeWorkspacesMock: vi.fn(),
  getCollegeByIdMock: vi.fn(),
  getJobsMock: vi.fn(),
  companyInviteJoinCardMock: vi.fn((props: any) => (
    <div data-testid="company-invite-card">{JSON.stringify(props)}</div>
  )),
  collegeInviteJoinCardMock: vi.fn((props: any) => (
    <div data-testid="college-invite-card">{JSON.stringify(props)}</div>
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

vi.mock("@/lib/actions/company-actions", () => ({
  listRecruiterWorkspaces: listRecruiterWorkspacesMock,
  getCompanyById: getCompanyByIdMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  listCollegeWorkspaces: listCollegeWorkspacesMock,
  getCollegeById: getCollegeByIdMock,
}));

vi.mock("@/lib/actions/job-actions", () => ({
  getJobs: getJobsMock,
}));

vi.mock(
  "@/app/(protected)/company-invites/_components/company-invite-join-card",
  () => ({
    CompanyInviteJoinCard: companyInviteJoinCardMock,
  }),
);

vi.mock(
  "@/app/(protected)/college-invites/_components/college-invite-join-card",
  () => ({
    CollegeInviteJoinCard: collegeInviteJoinCardMock,
  }),
);

describe("Invite pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRecruiterWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });
    listCollegeWorkspacesMock.mockResolvedValue({
      data: {
        workspaces: [],
      },
    });
    getCompanyByIdMock.mockResolvedValue({
      success: true,
      data: {
        name: "Acme",
      },
    });
    getCollegeByIdMock.mockResolvedValue({
      success: true,
      data: {
        name: "Softwarica",
      },
    });
    getJobsMock.mockResolvedValue({
      data: {
        jobs: [],
      },
    });
  });

  it("redirects company invite page to sign-in when unauthenticated", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    await expect(
      CompanyInvitesPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in");
  });

  it("shows recruiter-access notice for non-recruiter users", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
    });

    const page = await CompanyInvitesPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("Recruiter Access Required")).toBeInTheDocument();
  });

  it("renders company join card for recruiter with resolved invite details", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
      name: "Recruiter User",
      email: "recruiter@example.com",
    });
    listRecruiterWorkspacesMock.mockResolvedValueOnce({
      data: {
        workspaces: [
          {
            company: {
              id: "aaaaaaaaaaaaaaaaaaaaaaaa",
              name: "Acme",
              inviteCode: "INVITE-CO",
            },
          },
        ],
      },
    });
    getJobsMock.mockResolvedValueOnce({
      data: {
        jobs: [{ id: "job-1" }, { id: "job-2" }],
      },
    });

    const page = await CompanyInvitesPage({
      searchParams: Promise.resolve({
        companyId: "aaaaaaaaaaaaaaaaaaaaaaaa",
        inviteCode: "invite-co",
        designation: "HR",
      }),
    });
    render(page);

    expect(screen.getByTestId("company-invite-card")).toBeInTheDocument();
    const props = companyInviteJoinCardMock.mock.calls[0]?.[0];
    expect(props).toEqual(
      expect.objectContaining({
        companyId: "aaaaaaaaaaaaaaaaaaaaaaaa",
        initialInviteCode: "invite-co",
        initialDesignation: "HR",
        openRolesCount: 2,
        alreadyMember: true,
      }),
    );
  });

  it("shows student-access notice for restricted college roles", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "rec-1",
      role: Role.RECRUITER,
    });

    const page = await CollegeInvitesPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("Student Access Required")).toBeInTheDocument();
  });

  it("renders college join card for candidate/student users", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "candidate-1",
      role: Role.USER,
      name: "Candidate User",
      email: "candidate@example.com",
    });
    listCollegeWorkspacesMock.mockResolvedValueOnce({
      data: {
        workspaces: [
          {
            college: {
              id: "bbbbbbbbbbbbbbbbbbbbbbbb",
              name: "Softwarica",
              inviteCode: "INVITE-CL",
            },
          },
        ],
      },
    });
    getJobsMock.mockResolvedValueOnce({
      data: {
        jobs: [{ id: "job-1" }],
      },
    });

    const page = await CollegeInvitesPage({
      searchParams: Promise.resolve({
        collegeId: "bbbbbbbbbbbbbbbbbbbbbbbb",
        inviteCode: "invite-cl",
        program: "CS",
        year: "3",
      }),
    });
    render(page);

    expect(screen.getByTestId("college-invite-card")).toBeInTheDocument();
    const props = collegeInviteJoinCardMock.mock.calls[0]?.[0];
    expect(props).toEqual(
      expect.objectContaining({
        collegeId: "bbbbbbbbbbbbbbbbbbbbbbbb",
        initialInviteCode: "invite-cl",
        initialProgram: "CS",
        initialYear: 3,
        openRolesCount: 1,
        alreadyMember: true,
      }),
    );
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { useCreateJob } from "@/app/(protected)/(dashboard)/jobs/new/_hooks/use-create-job";
import { useCollegeSettings } from "@/app/(protected)/(dashboard)/college-settings/_hooks/use-college-settings";
import { useCompanySettings } from "@/app/(protected)/(dashboard)/company-settings/_hooks/use-company-settings";

const {
  routerMock,
  toastMock,
  createJobPostingMock,
  updateJobPostingMock,
  updateCollegeMock,
  inviteStudentToCollegeMock,
  resetCollegeInviteCodeMock,
  removeStudentFromCollegeMock,
  updateCompanyMock,
  inviteRecruiterToCompanyMock,
  resetCompanyInviteCodeMock,
  removeRecruiterFromCompanyMock,
} = vi.hoisted(() => ({
  routerMock: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  },
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  createJobPostingMock: vi.fn(),
  updateJobPostingMock: vi.fn(),
  updateCollegeMock: vi.fn(),
  inviteStudentToCollegeMock: vi.fn(),
  resetCollegeInviteCodeMock: vi.fn(),
  removeStudentFromCollegeMock: vi.fn(),
  updateCompanyMock: vi.fn(),
  inviteRecruiterToCompanyMock: vi.fn(),
  resetCompanyInviteCodeMock: vi.fn(),
  removeRecruiterFromCompanyMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/job-actions", () => ({
  createJobPosting: createJobPostingMock,
  updateJobPosting: updateJobPostingMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  updateCollege: updateCollegeMock,
  inviteStudentToCollege: inviteStudentToCollegeMock,
  resetCollegeInviteCode: resetCollegeInviteCodeMock,
  removeStudentFromCollege: removeStudentFromCollegeMock,
}));

vi.mock("@/lib/actions/company-actions", () => ({
  updateCompany: updateCompanyMock,
  inviteRecruiterToCompany: inviteRecruiterToCompanyMock,
  resetCompanyInviteCode: resetCompanyInviteCodeMock,
  removeRecruiterFromCompany: removeRecruiterFromCompanyMock,
}));

describe("workspace hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and edits job posting with proper routing", async () => {
    createJobPostingMock.mockResolvedValueOnce({ success: true, message: "created" });
    const { result } = renderHook(() =>
      useCreateJob({
        workspaceId: "co-1",
        workspaceType: "company",
      }),
    );

    await act(async () => {
      await result.current.onSubmit({
        title: "Backend Engineer",
        description: "Build APIs",
        location: "Remote",
        employmentType: "Full-Time",
        engagementType: "Internship",
        workMode: "remote",
        salaryRange: "100k",
        skills: [" Node ", " "],
        deadline: "2030-01-01",
      });
    });

    await waitFor(() => {
      expect(createJobPostingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: "co-1",
          requirements: { skills: ["Node"] },
          status: "open",
        }),
      );
      expect(routerMock.push).toHaveBeenCalledWith("/jobs?workspace=co-1");
    });

    updateJobPostingMock.mockResolvedValueOnce({ success: true, message: "updated" });
    const { result: edit } = renderHook(() =>
      useCreateJob({
        workspaceId: "co-1",
        workspaceType: "company",
        mode: "edit",
        jobId: "job-1",
        activeWorkspaceId: "co-1",
      }),
    );
    await act(async () => {
      await edit.current.onSubmit({
        title: "Backend Engineer",
        description: "Build APIs",
        location: "Remote",
        employmentType: "Full-Time",
        engagementType: "Internship",
        workMode: "remote",
        salaryRange: "100k",
        skills: [],
        deadline: "2030-01-01",
      });
    });
    await waitFor(() => {
      expect(updateJobPostingMock).toHaveBeenCalledWith(
        "job-1",
        expect.objectContaining({
          title: "Backend Engineer",
        }),
      );
      expect(routerMock.push).toHaveBeenCalledWith("/jobs/job-1?workspace=co-1");
    });
  });

  it("handles create-job failures and missing edit id", async () => {
    createJobPostingMock.mockResolvedValueOnce({ success: false, message: "failed" });
    const { result } = renderHook(() =>
      useCreateJob({
        workspaceId: "cl-1",
        workspaceType: "college",
      }),
    );
    await act(async () => {
      await result.current.onSubmit({
        title: "Job",
        description: "Desc",
        location: "Remote",
        employmentType: "Full-Time",
        engagementType: "Internship",
        workMode: "remote",
        salaryRange: "100k",
        skills: [],
        deadline: "2030-01-01",
      });
    });
    await waitFor(() => {
      expect(createJobPostingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          collegeId: "cl-1",
          visibility: "college_only",
        }),
      );
      expect(toastMock.error).toHaveBeenCalledWith("failed");
    });

    const { result: missingIdEdit } = renderHook(() =>
      useCreateJob({
        workspaceId: "cl-1",
        workspaceType: "college",
        mode: "edit",
      }),
    );
    await act(async () => {
      await missingIdEdit.current.onSubmit({
        title: "Job",
        description: "Desc",
        location: "Remote",
        employmentType: "Full-Time",
        engagementType: "Internship",
        workMode: "remote",
        salaryRange: "100k",
        skills: [],
        deadline: "2030-01-01",
      });
    });
    expect(toastMock.error).toHaveBeenCalledWith(
      "Job id is missing. Unable to update this posting.",
    );
  });

  it("handles college settings update/invite/reset/remove", async () => {
    const { result } = renderHook(() =>
      useCollegeSettings({
        collegeId: "cl-1",
        initialCollege: { name: "College", institutionType: "Public", location: "KTM" },
      }),
    );

    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    await act(async () => {
      await result.current.onUpdateCollegeProfile({
        name: "College",
        institutionType: "Public",
        location: "KTM",
        logo: bigFile,
      });
    });
    expect(updateCollegeMock).not.toHaveBeenCalled();

    updateCollegeMock.mockResolvedValueOnce({ success: true, message: "updated" });
    await act(async () => {
      await result.current.onUpdateCollegeProfile({
        name: "College",
        institutionType: "Public",
        location: "KTM",
        logo: null,
      });
    });
    await waitFor(() => {
      expect(updateCollegeMock).toHaveBeenCalledWith("cl-1", {
        name: "College",
        institutionType: "Public",
        location: "KTM",
        logo: undefined,
      });
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    inviteStudentToCollegeMock.mockResolvedValueOnce({ success: true });
    await act(async () => {
      await result.current.onInviteStudent({
        email: "student@example.com",
        program: "CS",
        year: 2,
      });
    });
    await waitFor(() => {
      expect(inviteStudentToCollegeMock).toHaveBeenCalledWith("cl-1", {
        email: "student@example.com",
        program: "CS",
        year: 2,
      });
    });

    resetCollegeInviteCodeMock.mockResolvedValueOnce({ success: false, message: "nope" });
    await act(async () => {
      await result.current.onResetInviteCode();
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("nope");
    });

    removeStudentFromCollegeMock.mockResolvedValueOnce({ success: true });
    await act(async () => {
      await result.current.onRemoveStudent("s-1");
    });
    await waitFor(() => {
      expect(removeStudentFromCollegeMock).toHaveBeenCalledWith("cl-1", "s-1");
    });
  });

  it("handles company settings update/invite/reset/remove", async () => {
    const { result } = renderHook(() =>
      useCompanySettings({
        companyId: "co-1",
        initialCompany: { name: "Acme", industry: "IT", location: "KTM" },
      }),
    );

    const invalidFile = new File(["x"], "file.txt", { type: "text/plain" });
    await act(async () => {
      await result.current.onUpdateCompanyProfile({
        name: "Acme",
        industry: "IT",
        location: "KTM",
        logo: invalidFile,
      });
    });
    expect(updateCompanyMock).not.toHaveBeenCalled();

    updateCompanyMock.mockResolvedValueOnce({ success: true });
    await act(async () => {
      await result.current.onUpdateCompanyProfile({
        name: "Acme",
        industry: "IT",
        location: "KTM",
        logo: null,
      });
    });
    await waitFor(() => {
      expect(updateCompanyMock).toHaveBeenCalledWith("co-1", {
        name: "Acme",
        industry: "IT",
        location: "KTM",
        logo: undefined,
      });
    });

    inviteRecruiterToCompanyMock.mockResolvedValueOnce({ success: false, message: "invite failed" });
    await act(async () => {
      await result.current.onInviteRecruiter({
        email: "hr@example.com",
        designation: "HR",
      });
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("invite failed");
    });

    resetCompanyInviteCodeMock.mockResolvedValueOnce({ success: true });
    await act(async () => {
      await result.current.onResetInviteCode();
    });
    await waitFor(() => {
      expect(resetCompanyInviteCodeMock).toHaveBeenCalledWith("co-1");
    });

    removeRecruiterFromCompanyMock.mockResolvedValueOnce({ success: false });
    await act(async () => {
      await result.current.onRemoveRecruiter("r-1");
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Unable to remove recruiter. You might need admin permissions.",
      );
    });
  });
});


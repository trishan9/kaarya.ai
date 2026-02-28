import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollegeSettingsPanel } from "@/app/(protected)/(dashboard)/college-settings/_components/college-settings-panel";

const {
  routerMock,
  updateCollegeMock,
  inviteStudentToCollegeMock,
  resetCollegeInviteCodeMock,
  removeStudentFromCollegeMock,
  toastMock,
} = vi.hoisted(() => ({
  routerMock: {
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
  },
  updateCollegeMock: vi.fn(),
  inviteStudentToCollegeMock: vi.fn(),
  resetCollegeInviteCodeMock: vi.fn(),
  removeStudentFromCollegeMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/college-actions", () => ({
  updateCollege: updateCollegeMock,
  inviteStudentToCollege: inviteStudentToCollegeMock,
  resetCollegeInviteCode: resetCollegeInviteCodeMock,
  removeStudentFromCollege: removeStudentFromCollegeMock,
}));

describe("CollegeSettingsPanel integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    updateCollegeMock.mockResolvedValue({
      success: true,
      message: "College profile updated.",
    });
    inviteStudentToCollegeMock.mockResolvedValue({
      success: true,
      message: "Student invited.",
    });
    resetCollegeInviteCodeMock.mockResolvedValue({ success: true });
    removeStudentFromCollegeMock.mockResolvedValue({
      success: true,
      message: "Student removed from workspace.",
    });
  });

  it("renders metrics and runs update/invite/remove flows", async () => {
    const user = userEvent.setup();

    render(
      <CollegeSettingsPanel
        collegeId="cl-1"
        workspaceName="Softwarica"
        workspaceInstitutionType="Engineering"
        workspaceLocation="Kathmandu"
        inviteCode="COL-123"
        metrics={
          {
            summary: {
              students: 20,
              applications: 18,
              interviewScheduled: 7,
              accepted: 4,
              openCollegeJobs: 6,
            },
          } as any
        }
        members={
          [
            {
              id: "m-1",
              studentId: "student-1",
              student: {
                id: "student-1",
                name: "Student One",
                email: "student1@example.com",
              },
              program: "CS",
              year: 4,
            },
            {
              id: "m-2",
              studentId: "student-2",
              student: {
                id: "student-2",
                name: "Student Two",
                email: "student2@example.com",
              },
              program: "IT",
              year: 2,
            },
          ] as any
        }
      />,
    );

    expect(screen.getByText("20 students")).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("College Name"));
    await user.type(screen.getByLabelText("College Name"), "A");
    await user.click(
      screen.getByRole("button", { name: "Save College Changes" }),
    );

    expect(
      await screen.findByText(
        "College name must be at least 2 characters long.",
      ),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("College Name"));
    await user.type(
      screen.getByLabelText("College Name"),
      "Softwarica College",
    );
    await user.clear(screen.getByLabelText("Institution Type"));
    await user.type(screen.getByLabelText("Institution Type"), "Private");
    await user.clear(screen.getByLabelText("Location"));
    await user.type(screen.getByLabelText("Location"), "Pokhara");

    await user.click(
      screen.getByRole("button", { name: "Save College Changes" }),
    );

    await waitFor(() => {
      expect(updateCollegeMock).toHaveBeenCalledWith("cl-1", {
        name: "Softwarica College",
        institutionType: "Private",
        location: "Pokhara",
        logo: undefined,
      });
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Student Email"), "new@student.edu");
    await user.type(screen.getByLabelText("Program (Optional)"), "BSc CS");
    await user.type(screen.getByLabelText("Year (Optional)"), "3");
    await user.click(screen.getByRole("button", { name: "Invite Student" }));

    await waitFor(() => {
      expect(inviteStudentToCollegeMock).toHaveBeenCalledWith("cl-1", {
        email: "new@student.edu",
        program: "BSc CS",
        year: 3,
      });
    });

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(removeStudentFromCollegeMock).toHaveBeenCalledWith(
        "cl-1",
        "student-1",
      );
    });
  }, 15000);

  it("shows file-size validation error when uploaded logo is too large", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <CollegeSettingsPanel
        collegeId="cl-1"
        workspaceName="Softwarica"
        inviteCode="COL-123"
        members={[]}
      />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const oversizedImage = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "large.png",
      {
        type: "image/png",
      },
    );

    await user.upload(fileInput as HTMLInputElement, oversizedImage);

    expect(
      await screen.findByText("Logo size must be less than 5MB."),
    ).toBeInTheDocument();
    expect(updateCollegeMock).not.toHaveBeenCalled();
  });
});

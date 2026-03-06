import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompanySettingsPanel } from "@/app/(protected)/(dashboard)/company-settings/_components/company-settings-panel";

const {
  routerMock,
  updateCompanyMock,
  inviteRecruiterToCompanyMock,
  resetCompanyInviteCodeMock,
  removeRecruiterFromCompanyMock,
  toastMock,
} = vi.hoisted(() => ({
  routerMock: {
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
  },
  updateCompanyMock: vi.fn(),
  inviteRecruiterToCompanyMock: vi.fn(),
  resetCompanyInviteCodeMock: vi.fn(),
  removeRecruiterFromCompanyMock: vi.fn(),
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

vi.mock("@/lib/actions/company-actions", () => ({
  updateCompany: updateCompanyMock,
  inviteRecruiterToCompany: inviteRecruiterToCompanyMock,
  resetCompanyInviteCode: resetCompanyInviteCodeMock,
  removeRecruiterFromCompany: removeRecruiterFromCompanyMock,
}));

describe("CompanySettingsPanel integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    updateCompanyMock.mockResolvedValue({ success: true, message: "Company profile updated." });
    inviteRecruiterToCompanyMock.mockResolvedValue({
      success: true,
      message: "Recruiter invited.",
    });
    resetCompanyInviteCodeMock.mockResolvedValue({ success: true });
    removeRecruiterFromCompanyMock.mockResolvedValue({
      success: true,
      message: "Recruiter removed from workspace.",
    });
  });

  it(
    "validates and submits profile, invites recruiters, and removes members",
    async () => {
    const user = userEvent.setup();

    render(
      <CompanySettingsPanel
        companyId="co-1"
        workspaceName="Acme"
        workspaceIndustry="Technology"
        workspaceLocation="Kathmandu"
        inviteCode="INV-123"
        currentUserId="self-1"
        members={[
          {
            id: "m-1",
            recruiterId: "self-1",
            recruiter: {
              id: "self-1",
              name: "Self User",
              email: "self@acme.com",
            },
            designation: "Admin",
          },
          {
            id: "m-2",
            recruiterId: "other-1",
            recruiter: {
              id: "other-1",
              name: "Other User",
              email: "other@acme.com",
            },
            designation: "Recruiter",
          },
        ]}
      />,
    );

    await user.clear(screen.getByLabelText("Company Name"));
    await user.type(screen.getByLabelText("Company Name"), "A");
    await user.click(screen.getByRole("button", { name: "Save Company Changes" }));

    expect(
      await screen.findByText("Company name must be at least 2 characters long."),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Company Name"));
    await user.type(screen.getByLabelText("Company Name"), "Acme Labs");
    await user.clear(screen.getByLabelText("Industry"));
    await user.type(screen.getByLabelText("Industry"), "AI");
    await user.clear(screen.getByLabelText("Location"));
    await user.type(screen.getByLabelText("Location"), "Pokhara");

    await user.click(screen.getByRole("button", { name: "Save Company Changes" }));

    await waitFor(() => {
      expect(updateCompanyMock).toHaveBeenCalledWith("co-1", {
        name: "Acme Labs",
        industry: "AI",
        location: "Pokhara",
        logo: undefined,
      });
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Recruiter Email"), "hire@acme.com");
    await user.type(screen.getByLabelText("Designation"), "Talent Partner");
    await user.click(screen.getByRole("button", { name: "Invite Recruiter" }));

    await waitFor(() => {
      expect(inviteRecruiterToCompanyMock).toHaveBeenCalledWith("co-1", {
        email: "hire@acme.com",
        designation: "Talent Partner",
      });
      expect(screen.getByLabelText("Recruiter Email")).toHaveValue("");
    });

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);
    expect(removeButtons[0]).toBeDisabled();

    await user.click(removeButtons[1]);

    await waitFor(() => {
      expect(removeRecruiterFromCompanyMock).toHaveBeenCalledWith(
        "co-1",
        "other-1",
      );
    });
    },
    15000,
  );

  it("rejects unsupported logo upload types at form level", async () => {
    const user = userEvent.setup({ applyAccept: false });

    const { container } = render(
      <CompanySettingsPanel
        companyId="co-1"
        workspaceName="Acme"
        inviteCode="INV-123"
        members={[]}
      />,
    );

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const invalidFile = new File(["file"], "notes.txt", { type: "text/plain" });
    await user.upload(fileInput as HTMLInputElement, invalidFile);

    expect(await screen.findByText("Only image files are allowed.")).toBeInTheDocument();
    expect(updateCompanyMock).not.toHaveBeenCalled();
  });
});

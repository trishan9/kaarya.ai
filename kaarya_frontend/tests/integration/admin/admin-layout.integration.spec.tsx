import { render, screen } from "@testing-library/react";
import AdminLayout from "@/app/(protected)/admin/layout";
import { Role } from "@/lib/definitions";

const { redirectMock, getCurrentUserMock, adminShellMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  getCurrentUserMock: vi.fn(),
  adminShellMock: vi.fn(
    ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div data-testid="admin-shell">{children}</div>,
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/dal", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/app/(protected)/admin/_components/admin-shell", () => ({
  AdminShell: adminShellMock,
}));

describe("Admin layout integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to sign in", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    await expect(
      AdminLayout({
        children: <div>layout-content</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in");
  });

  it("redirects non-admin users to overview", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "user-1",
      role: Role.USER,
    });

    await expect(
      AdminLayout({
        children: <div>layout-content</div>,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/overview");
  });

  it("renders admin shell for admin users", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      id: "admin-1",
      role: Role.ADMIN,
      name: "Admin",
      email: "admin@example.com",
    });

    render(
      await AdminLayout({
        children: <div>layout-content</div>,
      }),
    );

    expect(screen.getByTestId("admin-shell")).toBeInTheDocument();
    expect(screen.getByText("layout-content")).toBeInTheDocument();
    expect(adminShellMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          id: "admin-1",
          role: Role.ADMIN,
        }),
      }),
      undefined,
    );
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { useCreateUser } from "@/app/(protected)/admin/users/_hooks/use-create-user";
import { useUpdateUser } from "@/app/(protected)/admin/users/_hooks/use-update-user";

const { routerMock, toastMock, createAdminUserMock, updateAdminUserMock } =
  vi.hoisted(() => ({
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
    createAdminUserMock: vi.fn(),
    updateAdminUserMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/admin/admin-user-actions", () => ({
  createAdminUser: createAdminUserMock,
  updateAdminUser: updateAdminUserMock,
}));

describe("admin user hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates user and routes on success", async () => {
    createAdminUserMock.mockResolvedValueOnce({ success: true, message: "created" });
    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await result.current.onSubmit({
        name: "User",
        email: "user@example.com",
        password: "Password12",
        confirmPassword: "Password12",
        role: "user",
        provider: "email",
        photo: null,
      });
    });

    await waitFor(() => {
      expect(createAdminUserMock).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith("created");
      expect(routerMock.push).toHaveBeenCalledWith("/admin/users");
      expect(routerMock.refresh).toHaveBeenCalled();
    });
  });

  it("shows create error", async () => {
    createAdminUserMock.mockResolvedValueOnce({ success: false, message: "failed" });
    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await result.current.onSubmit({
        name: "User",
        email: "user@example.com",
        password: "Password12",
        confirmPassword: "Password12",
        role: "user",
        provider: "email",
        photo: null,
      });
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("failed");
    });
  });

  it("updates user and routes on success/failure", async () => {
    updateAdminUserMock.mockResolvedValueOnce({ success: true, message: "updated" });
    const { result } = renderHook(() =>
      useUpdateUser("u-1", {
        name: "Old",
        email: "old@example.com",
        role: "user",
        provider: "email",
      }),
    );

    await act(async () => {
      await result.current.onSubmit({
        name: "New",
        email: "new@example.com",
        role: "admin",
        provider: "email",
        password: "",
        confirmPassword: "",
        photo: null,
      });
    });

    await waitFor(() => {
      expect(updateAdminUserMock).toHaveBeenCalledWith(
        "u-1",
        expect.objectContaining({
          name: "New",
          role: "admin",
        }),
      );
      expect(routerMock.push).toHaveBeenCalledWith("/admin/users/u-1");
      expect(routerMock.refresh).toHaveBeenCalled();
    });

    updateAdminUserMock.mockResolvedValueOnce({ success: false, message: "update-failed" });
    await act(async () => {
      await result.current.onSubmit({
        name: "New",
        email: "new@example.com",
        role: "admin",
        provider: "email",
        password: "",
        confirmPassword: "",
        photo: null,
      });
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("update-failed");
    });
  });
});


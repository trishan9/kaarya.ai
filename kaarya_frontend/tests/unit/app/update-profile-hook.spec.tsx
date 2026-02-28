import { act, renderHook, waitFor } from "@testing-library/react";
import { useUpdateProfile } from "@/app/(protected)/(dashboard)/settings/_components/profile/_hooks/use-update-profile";

const { routerMock, toastMock, updateProfileMock, onSuccessMock } = vi.hoisted(
  () => ({
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
    updateProfileMock: vi.fn(),
    onSuccessMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/lib/actions/auth-action", () => ({
  updateProfile: updateProfileMock,
}));

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits profile update and handles success state", async () => {
    updateProfileMock.mockResolvedValueOnce({ success: true, message: "updated" });
    const { result } = renderHook(() =>
      useUpdateProfile({
        user: {
          id: "u-1",
          name: "John",
          email: "john@example.com",
          role: "user",
          candidateProfile: {
            preferredRoles: ["Backend"],
            portfolioLinks: ["https://portfolio.test"],
          },
        } as any,
        onSuccess: onSuccessMock,
      }),
    );

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    await act(async () => {
      await result.current.onSubmit({
        name: "John Updated",
        email: "john.updated@example.com",
        photo: file,
        candidateProfile: {
          preferredRoles: ["Backend Engineer"],
          preferredLocations: [],
          preferredWorkModes: [],
          skills: [],
          education: [],
          experience: [],
          certifications: [],
          portfolioLinks: [],
          openToWork: true,
        },
      } as any);
    });

    await waitFor(() => {
      const formData = updateProfileMock.mock.calls[0]?.[0] as FormData;
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("name")).toBe("John Updated");
      expect(formData.get("email")).toBe("john.updated@example.com");
      expect(formData.get("photo")).toBe(file);
      expect(String(formData.get("candidateProfile"))).toContain(
        "Backend Engineer",
      );
      expect(toastMock.success).toHaveBeenCalledWith("updated");
      expect(routerMock.refresh).toHaveBeenCalled();
      expect(onSuccessMock).toHaveBeenCalled();
      expect(result.current.form.getValues("photo")).toBeNull();
    });
  });

  it("handles unsuccessful and thrown update errors", async () => {
    const { result } = renderHook(() =>
      useUpdateProfile({
        user: {
          id: "u-1",
          name: "John",
          email: "john@example.com",
          role: "user",
        } as any,
      }),
    );

    updateProfileMock.mockResolvedValueOnce({ success: false, message: "failed" });
    await act(async () => {
      await result.current.onSubmit({
        name: "John",
        email: "john@example.com",
        photo: null,
      } as any);
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("failed");
    });

    updateProfileMock.mockRejectedValueOnce(new Error("runtime-error"));
    await act(async () => {
      await result.current.onSubmit({
        name: "John",
        email: "john@example.com",
        photo: null,
      } as any);
    });
    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("runtime-error");
    });
  });
});


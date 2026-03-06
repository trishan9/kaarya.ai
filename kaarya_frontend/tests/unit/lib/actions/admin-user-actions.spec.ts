import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserById,
  getAdminUsers,
  getAdminUsersAnalytics,
  updateAdminUser,
} from "@/lib/actions/admin/admin-user-actions";
import { API_URLS } from "@/lib/api/endpoints";

const { apiMock, multipartConfig } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  multipartConfig: {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  },
}));

vi.mock("@/lib/api/axios-instance", () => ({
  api: apiMock,
  MULTIPART_FORM_DATA_CONFIG: multipartConfig,
}));

const responseError = (message: string) => ({
  response: {
    data: { message },
  },
});

describe("admin user actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets users with query params and handles errors", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, items: [] } });
    expect(await getAdminUsers({ page: 1, size: 20, search: "john" })).toEqual({
      success: true,
      items: [],
    });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.ADMIN.USERS, {
      params: { page: 1, size: 20, search: "john" },
    });

    apiMock.get.mockRejectedValueOnce(responseError("users-response"));
    expect(await getAdminUsers()).toEqual({
      success: false,
      message: "users-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("users-runtime"));
    expect(await getAdminUsers()).toEqual({
      success: false,
      message: "users-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getAdminUsers()).toEqual({
      success: false,
      message: "Failed to fetch users",
    });
  });

  it("gets analytics and handles errors", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true } });
    expect(await getAdminUsersAnalytics()).toEqual({ success: true });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.ADMIN.USERS_ANALYTICS);

    apiMock.get.mockRejectedValueOnce(responseError("analytics-response"));
    expect(await getAdminUsersAnalytics()).toEqual({
      success: false,
      message: "analytics-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("analytics-runtime"));
    expect(await getAdminUsersAnalytics()).toEqual({
      success: false,
      message: "analytics-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getAdminUsersAnalytics()).toEqual({
      success: false,
      message: "Failed to fetch users analytics",
    });
  });

  it("gets user by id and handles errors", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, id: "u-1" } });
    expect(await getAdminUserById("u-1")).toEqual({ success: true, id: "u-1" });
    expect(apiMock.get).toHaveBeenCalledWith(API_URLS.ADMIN.USER_BY_ID("u-1"));

    apiMock.get.mockRejectedValueOnce(responseError("user-response"));
    expect(await getAdminUserById("u-1")).toEqual({
      success: false,
      message: "user-response",
    });

    apiMock.get.mockRejectedValueOnce(new Error("user-runtime"));
    expect(await getAdminUserById("u-1")).toEqual({
      success: false,
      message: "user-runtime",
    });

    apiMock.get.mockRejectedValueOnce({});
    expect(await getAdminUserById("u-1")).toEqual({
      success: false,
      message: "Failed to fetch user",
    });
  });

  it("creates admin user as multipart form data and handles errors", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    expect(
      await createAdminUser({
        name: "Test User",
        email: "test@example.com",
        password: "Password12",
        confirmPassword: "Password12",
        role: "user",
        provider: "email",
        photo: file,
      }),
    ).toEqual({ success: true });

    const [url, formData, config] = apiMock.post.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.ADMIN.USERS);
    expect(entries).toContainEqual(["name", "Test User"]);
    expect(entries).toContainEqual(["email", "test@example.com"]);
    expect(entries).toContainEqual(["photo", file]);
    expect(config).toBe(multipartConfig);

    apiMock.post.mockRejectedValueOnce(responseError("create-response"));
    expect(await createAdminUser({})).toEqual({
      success: false,
      message: "create-response",
    });

    apiMock.post.mockRejectedValueOnce(new Error("create-runtime"));
    expect(await createAdminUser({})).toEqual({
      success: false,
      message: "create-runtime",
    });

    apiMock.post.mockRejectedValueOnce({});
    expect(await createAdminUser({})).toEqual({
      success: false,
      message: "Failed to create user",
    });
  });

  it("updates admin user as multipart form data and handles errors", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    apiMock.put.mockResolvedValueOnce({ data: { success: true } });

    expect(
      await updateAdminUser("u-1", {
        name: "Updated",
        photo: file,
      }),
    ).toEqual({ success: true });

    const [url, formData, config] = apiMock.put.mock.calls[0];
    const entries = Array.from((formData as FormData).entries());
    expect(url).toBe(API_URLS.ADMIN.USER_BY_ID("u-1"));
    expect(entries).toContainEqual(["name", "Updated"]);
    expect(entries).toContainEqual(["photo", file]);
    expect(config).toBe(multipartConfig);

    apiMock.put.mockRejectedValueOnce(responseError("update-response"));
    expect(await updateAdminUser("u-1", {})).toEqual({
      success: false,
      message: "update-response",
    });

    apiMock.put.mockRejectedValueOnce(new Error("update-runtime"));
    expect(await updateAdminUser("u-1", {})).toEqual({
      success: false,
      message: "update-runtime",
    });

    apiMock.put.mockRejectedValueOnce({});
    expect(await updateAdminUser("u-1", {})).toEqual({
      success: false,
      message: "Failed to update user",
    });
  });

  it("deletes user and handles errors", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });
    expect(await deleteAdminUser("u-1")).toEqual({ success: true });
    expect(apiMock.delete).toHaveBeenCalledWith(API_URLS.ADMIN.USER_BY_ID("u-1"));

    apiMock.delete.mockRejectedValueOnce(responseError("delete-response"));
    expect(await deleteAdminUser("u-1")).toEqual({
      success: false,
      message: "delete-response",
    });

    apiMock.delete.mockRejectedValueOnce(new Error("delete-runtime"));
    expect(await deleteAdminUser("u-1")).toEqual({
      success: false,
      message: "delete-runtime",
    });

    apiMock.delete.mockRejectedValueOnce({});
    expect(await deleteAdminUser("u-1")).toEqual({
      success: false,
      message: "Failed to delete user",
    });
  });
});


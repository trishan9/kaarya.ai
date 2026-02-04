export const API_URLS = {
  BASE: process.env.NEXT_PUBLIC_API_BASE_URL,
  AUTH: {
    SIGNUP: "/auth/signup",
    SIGNIN: "/auth/login",
    ME: "/auth/me",
    UPDATE_ME: "/auth/update-me",
  },
  ADMIN: {
    USERS: "/admin/users",
    USERS_ANALYTICS: "admin/users/analytics",
    USER_BY_ID: (id: string) => `/admin/users/${id}`,
  },
};

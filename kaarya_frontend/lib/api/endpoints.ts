export const API_URLS = {
  BASE: process.env.NEXT_PUBLIC_API_BASE_URL,
  AUTH: {
    SIGNUP: "/auth/signup",
    SIGNIN: "/auth/login",
    OAUTH_AUTHORIZE: (provider: "google" | "github") =>
      `/auth/oauth/${provider}/authorize`,
    OAUTH_LINK_AUTHORIZE: (provider: "google" | "github") =>
      `/auth/oauth/${provider}/link/authorize`,
    OAUTH_EXCHANGE: "/auth/oauth/exchange",
    OAUTH_LINK_COMPLETE: "/auth/oauth/link/complete",
    ME: "/auth/me",
    UPDATE_ME: "/auth/update-me",
    PASSWORD_RESET_REQUEST: "/auth/password-reset/request",
    PASSWORD_RESET_VERIFY: "/auth/password-reset/verify",
    PASSWORD_RESET_CONFIRM: "/auth/password-reset/confirm",
  },
  ADMIN: {
    USERS: "/admin/users",
    USERS_ANALYTICS: "admin/users/analytics",
    USER_BY_ID: (id: string) => `/admin/users/${id}`,
  },
};

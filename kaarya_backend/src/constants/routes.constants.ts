export const ROUTES = {
  AUTH: {
    BASE: 'auth',
    LOGIN: 'login',
    SIGNUP: 'signup',
    ME: 'me',
    UPDATE_ME: 'update-me',
    PASSWORD_RESET_REQUEST: 'password-reset/request',
    PASSWORD_RESET_VERIFY: 'password-reset/verify',
    PASSWORD_RESET_CONFIRM: 'password-reset/confirm',
    OAUTH_AUTHORIZE: 'oauth/:provider/authorize',
    OAUTH_LINK_AUTHORIZE: 'oauth/:provider/link/authorize',
    OAUTH_CALLBACK: 'oauth/:provider/callback',
    OAUTH_EXCHANGE: 'oauth/exchange',
    OAUTH_LINK_COMPLETE: 'oauth/link/complete',
    LOGOUT_ALL: 'logout-all',
  },
  ADMIN: {
    BASE: 'admin',
  },
  USER: {
    BASE: 'users',
    BY_ID: ':id',
  },
} as const;

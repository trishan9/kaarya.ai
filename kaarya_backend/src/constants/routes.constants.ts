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
  },
  ADMIN: {
    BASE: 'admin',
  },
  USER: {
    BASE: 'users',
    BY_ID: ':id',
  },
} as const;

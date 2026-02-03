export const ROUTES = {
  AUTH: {
    BASE: 'auth',
    LOGIN: 'login',
    SIGNUP: 'signup',
    ME: 'me',
    UPDATE_ME: 'update-me',
  },
  ADMIN: {
    BASE: 'admin',
  },
  USER: {
    BASE: 'users',
    BY_ID: ':id',
  },
} as const;

export const ROUTES = {
  AUTH: {
    BASE: 'auth',
    LOGIN: 'login',
    SIGNUP: 'signup',
    ME: 'me',
  },
  ADMIN: {
    BASE: 'admin',
  },
  USER: {
    BASE: 'users',
    BY_ID: ':id',
  },
} as const;

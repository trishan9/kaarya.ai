export const ROUTES = {
  AUTH: {
    BASE: 'auth',
    LOGIN: 'login',
    SIGNUP: 'signup',
    ME: 'me',
  },
  USER: {
    BASE: 'users',
    BY_ID: ':id',
  },
} as const;

process.env.NODE_ENV = 'test';
process.env.APP_PORT = process.env.APP_PORT || '3001';
process.env.API_PREFIX = process.env.API_PREFIX || 'api';
process.env.FRONTEND_DOMAIN =
  process.env.FRONTEND_DOMAIN || 'http://localhost:3000';

process.env.AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || 'test-jwt-secret';
process.env.AUTH_JWT_TOKEN_EXPIRES_IN =
  process.env.AUTH_JWT_TOKEN_EXPIRES_IN || '1h';
process.env.AUTH_REFRESH_SECRET =
  process.env.AUTH_REFRESH_SECRET || 'test-refresh-secret';
process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN =
  process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN || '7d';
process.env.AUTH_FORGOT_SECRET =
  process.env.AUTH_FORGOT_SECRET || 'test-forgot-secret';
process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN =
  process.env.AUTH_FORGOT_TOKEN_EXPIRES_IN || '15m';
process.env.AUTH_CONFIRM_EMAIL_SECRET =
  process.env.AUTH_CONFIRM_EMAIL_SECRET || 'test-confirm-secret';
process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN =
  process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN || '15m';

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mongodb://root:example@localhost:27017';
process.env.DATABASE_NAME = process.env.DATABASE_NAME || 'kaarya_test';

if (process.env.DATABASE_URL) {
  delete process.env.DATABASE_USERNAME;
  delete process.env.DATABASE_PASSWORD;
}

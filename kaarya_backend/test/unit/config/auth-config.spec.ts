import authConfig from 'src/config/auth-config';

describe('auth-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTH_JWT_SECRET: 'secret',
      AUTH_JWT_TOKEN_EXPIRES_IN: '1h',
      AUTH_REFRESH_SECRET: 'refresh',
      AUTH_REFRESH_TOKEN_EXPIRES_IN: '7d',
      AUTH_FORGOT_SECRET: 'forgot',
      AUTH_FORGOT_TOKEN_EXPIRES_IN: '15m',
      AUTH_CONFIRM_EMAIL_SECRET: 'confirm',
      AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN: '15m',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load auth secrets and expirations', () => {
    const config = authConfig();

    expect(config).toEqual(
      expect.objectContaining({
        secret: 'secret',
        expires: '1h',
        refreshSecret: 'refresh',
        refreshExpires: '7d',
        forgotSecret: 'forgot',
        forgotExpires: '15m',
        confirmEmailSecret: 'confirm',
        confirmEmailExpires: '15m',
      }),
    );
  });
});

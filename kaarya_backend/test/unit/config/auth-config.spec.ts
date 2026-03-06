import authConfig from 'src/config/auth-config';

describe('auth-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      FRONTEND_DOMAIN: 'http://localhost:3000',
      AUTH_JWT_SECRET: 'secret',
      AUTH_JWT_TOKEN_EXPIRES_IN: '1h',
      AUTH_FORGOT_SECRET: 'forgot',
      AUTH_FORGOT_TOKEN_EXPIRES_IN: '15m',
      AUTH_OAUTH_ALLOWED_REDIRECTS:
        'https://app.example.com,https://jobs.example.com',
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
        forgotSecret: 'forgot',
        forgotExpires: '15m',
        resetOtpSecret: 'forgot',
        resetOtpExpires: '10m',
        resetOtpMaxAttempts: 10,
        resetRequestWindow: '1h',
        resetRequestMax: 10,
        resetVerifyWindow: '15m',
        resetVerifyMax: 10,
        resetPasswordWindow: '15m',
        resetPasswordMax: 10,
        oauthStateExpires: '10m',
        oauthResultExpires: '5m',
        oauthLinkExpires: '15m',
        oauthAllowedRedirects: expect.arrayContaining([
          'https://app.example.com',
          'https://jobs.example.com',
          'http://localhost:3000',
        ]),
      }),
    );
  });
});

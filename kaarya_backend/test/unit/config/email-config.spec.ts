import emailConfig from 'src/config/email-config';

describe('email-config', () => {
  const originalEnv = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    EMAIL_BRAND_NAME: process.env.EMAIL_BRAND_NAME,
    EMAIL_SUPPORT_URL: process.env.EMAIL_SUPPORT_URL,
    EMAIL_LOGO_URL: process.env.EMAIL_LOGO_URL,
    EMAIL_PRIMARY_COLOR: process.env.EMAIL_PRIMARY_COLOR,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASSWORD: process.env.MAIL_PASSWORD,
    MAIL_SECURE: process.env.MAIL_SECURE,
    MAIL_IGNORE_TLS: process.env.MAIL_IGNORE_TLS,
    MAIL_REQUIRE_TLS: process.env.MAIL_REQUIRE_TLS,
  };

  afterEach(() => {
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('should use defaults when optional values are missing', () => {
    delete process.env.EMAIL_PROVIDER;
    delete process.env.EMAIL_BRAND_NAME;
    delete process.env.EMAIL_PRIMARY_COLOR;
    delete process.env.MAIL_SECURE;
    delete process.env.MAIL_IGNORE_TLS;
    delete process.env.MAIL_REQUIRE_TLS;
    delete process.env.MAIL_PORT;

    const config = emailConfig() as any;

    expect(config.provider).toBe('nodemailer');
    expect(config.brandName).toBe('Kaarya');
    expect(config.primaryColor).toBe('#1d4ed8');
    expect(config.smtpPort).toBeUndefined();
    expect(config.smtpSecure).toBeUndefined();
    expect(config.smtpIgnoreTls).toBeUndefined();
    expect(config.smtpRequireTls).toBeUndefined();
  });

  it('should parse SMTP and tls flags from environment strings', () => {
    process.env.EMAIL_PROVIDER = 'nodemailer';
    process.env.EMAIL_FROM = 'noreply@example.com';
    process.env.EMAIL_REPLY_TO = 'support@example.com';
    process.env.EMAIL_BRAND_NAME = 'Kaarya Test';
    process.env.EMAIL_SUPPORT_URL = 'http://localhost:3000/support';
    process.env.EMAIL_LOGO_URL = 'http://localhost:3000/logo.png';
    process.env.EMAIL_PRIMARY_COLOR = '#000000';
    process.env.MAIL_HOST = 'smtp.example.com';
    process.env.MAIL_PORT = '587';
    process.env.MAIL_USER = 'smtp-user';
    process.env.MAIL_PASSWORD = 'smtp-pass';
    process.env.MAIL_SECURE = 'false';
    process.env.MAIL_IGNORE_TLS = 'true';
    process.env.MAIL_REQUIRE_TLS = 'false';

    const config = emailConfig() as any;

    expect(config).toEqual(
      expect.objectContaining({
        provider: 'nodemailer',
        from: 'noreply@example.com',
        replyTo: 'support@example.com',
        brandName: 'Kaarya Test',
        supportUrl: 'http://localhost:3000/support',
        logoUrl: 'http://localhost:3000/logo.png',
        primaryColor: '#000000',
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'smtp-user',
        smtpPass: 'smtp-pass',
        smtpSecure: false,
        smtpIgnoreTls: true,
        smtpRequireTls: false,
      }),
    );
  });
});

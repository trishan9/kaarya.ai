import 'reflect-metadata';

describe('Nest modules', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'mongodb://localhost:27017',
      DATABASE_NAME: 'test',
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

  it('should load module definitions', async () => {
    jest.resetModules();

    const { AppModule } = await import('src/app.module');
    const { AuthModule } = await import('src/modules/auth.module');
    const { UserModule } = await import('src/modules/user.module');
    const { LoggerModule } = await import('src/logger/logger.module');
    const { MongoDatabaseModule } = await import('src/database/mongodb.module');

    expect(AppModule).toBeDefined();
    expect(AuthModule).toBeDefined();
    expect(UserModule).toBeDefined();
    expect(LoggerModule).toBeDefined();
    expect(MongoDatabaseModule).toBeDefined();
  });

  it('should load modules when not running in test mode', async () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    const { AppModule } = await import('src/app.module');

    expect(AppModule).toBeDefined();
  });
});

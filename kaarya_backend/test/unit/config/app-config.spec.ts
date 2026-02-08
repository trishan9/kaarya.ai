import appConfig from 'src/config/app-config';

describe('app-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should respect APP_PORT when provided', async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_PORT = '4000';

    const config = await appConfig();

    expect(config.port).toBe(4000);
  });

  it('should fallback to PORT when APP_PORT is missing', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.APP_PORT;
    process.env.PORT = '5000';

    const config = await appConfig();

    expect(config.port).toBe(5000);
  });

  it('should fallback to default port when neither is set', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.APP_PORT;
    delete process.env.PORT;

    const config = await appConfig();

    expect(config.port).toBe(3000);
  });
});

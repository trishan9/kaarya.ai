import databaseConfig from 'src/config/database-config';

describe('database-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should prefer DATABASE_URL when provided', () => {
    process.env.DATABASE_URL = 'mongodb://localhost:27017';
    process.env.DATABASE_NAME = 'db';

    const config = databaseConfig();

    expect(config).toEqual(
      expect.objectContaining({
        url: 'mongodb://localhost:27017',
        name: 'db',
      }),
    );
  });

  it('should build config from discrete values when url is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.DATABASE_TYPE = 'mongodb';
    process.env.DATABASE_PORT = '27017';
    process.env.DATABASE_PASSWORD = 'pass';
    process.env.DATABASE_NAME = 'db';
    process.env.DATABASE_USERNAME = 'user';

    const config = databaseConfig();

    expect(config).toEqual(
      expect.objectContaining({
        type: 'mongodb',
        port: 27017,
        password: 'pass',
        name: 'db',
        username: 'user',
      }),
    );
  });
});

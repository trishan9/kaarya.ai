import cloudinaryConfig from 'src/config/cloudinary-config';

describe('cloudinary-config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLOUDINARY_CLOUD_NAME: 'cloud',
      CLOUDINARY_API_KEY: 'key',
      CLOUDINARY_API_SECRET: 'secret',
      CLOUDINARY_FOLDER: 'folder',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load cloudinary config values', () => {
    const config = cloudinaryConfig();

    expect(config).toEqual({
      cloudName: 'cloud',
      apiKey: 'key',
      apiSecret: 'secret',
      folder: 'folder',
    });
  });
});

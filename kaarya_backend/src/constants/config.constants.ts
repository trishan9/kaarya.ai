export const CONFIG_NAMESPACE = {
  APP: 'app',
  AUTH: 'auth',
  DATABASE: 'database',
  CLOUDINARY: 'cloudinary',
} as const;

export const CONFIG_KEYS = {
  APP: {
    API_PREFIX: `${CONFIG_NAMESPACE.APP}.apiPrefix`,
    PORT: `${CONFIG_NAMESPACE.APP}.port`,
    LOG_LEVEL: `${CONFIG_NAMESPACE.APP}.logLevel`,
  },
  AUTH: {
    SECRET: `${CONFIG_NAMESPACE.AUTH}.secret`,
    EXPIRES: `${CONFIG_NAMESPACE.AUTH}.expires`,
  },
  CLOUDINARY: {
    CLOUD_NAME: `${CONFIG_NAMESPACE.CLOUDINARY}.cloudName`,
    API_KEY: `${CONFIG_NAMESPACE.CLOUDINARY}.apiKey`,
    API_SECRET: `${CONFIG_NAMESPACE.CLOUDINARY}.apiSecret`,
    FOLDER: `${CONFIG_NAMESPACE.CLOUDINARY}.folder`,
  },
} as const;

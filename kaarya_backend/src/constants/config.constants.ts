export const CONFIG_NAMESPACE = {
  APP: 'app',
  AUTH: 'auth',
  DATABASE: 'database',
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
} as const;
